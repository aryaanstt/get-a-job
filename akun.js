// Akun get it (opsional). Tanpa login semuanya tetap di perangkat ini.
// Kalau login, lamaran, checklist, catatan, jawaban survei, target, dan loker yang dilewati
// disimpan di tabel get_a_job_akun (cuma bisa dibaca pemilik akun) biar sama di semua perangkat.
// Kunci sesi pakai awalan gja- biar ga ikut ke file cadangan (yang cuma ngambil gaj-).
const AKUN = { url: 'https://wtfshyfgcrglknogjgfb.supabase.co', kunci: 'sb_publishable_-vUvZe04JtPTTGfF6LEY6A_y0l1n_Ff' }
let sbA = null, akunUser = null, akunSibuk = false, akunLagi = false, akunTimer = null, akunPesan = '', akunMode = 'masuk', akunTarikTerakhir = 0
try { if (window.supabase && window.supabase.createClient) sbA = window.supabase.createClient(AKUN.url, AKUN.kunci, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'gja-auth' } }) } catch (e) { sbA = null }

const META_KOSONG = () => ({ t: {}, hapus: {}, terakhir: null })
const bacaMeta = () => { try { return Object.assign(META_KOSONG(), JSON.parse(localStorage.getItem('gja-meta')) || {}) } catch (e) { return META_KOSONG() } }
let akunMeta = bacaMeta()
const simpanMeta = () => { try { localStorage.setItem('gja-meta', JSON.stringify(akunMeta)) } catch (e) { } }
const KUNCI_SINKRON = { 'gaj-profil': 'profil', 'gaj-target': 'target', 'gaj-lewati-pilah': 'lewati' }
const tanpaT = l => { const { _t, ...r } = l || {}; return JSON.stringify(r) }
let akunJejak = {}
const jejakUlang = () => { akunJejak = {}; Object.entries(LM).forEach(([id, l]) => { akunJejak[id] = tanpaT(l) }) }
jejakUlang()

// Dipanggil simpanLS tiap ada perubahan: tandai waktu ubah per lamaran, catat yang dihapus, jadwalin kirim.
window.akunUbah = k => {
  if (window.__gajImpor) return
  const now = Date.now()
  if (k === 'gaj-lamaran') {
    let ada = false
    Object.entries(LM).forEach(([id, l]) => { const s = tanpaT(l); if (akunJejak[id] !== s) { l._t = now; akunJejak[id] = s; ada = true } })
    Object.keys(akunJejak).forEach(id => { if (!LM[id]) { akunMeta.hapus[id] = now; delete akunJejak[id]; ada = true } })
    if (!ada) return
    try { localStorage.setItem('gaj-lamaran', JSON.stringify(LM)) } catch (e) { }
  } else if (KUNCI_SINKRON[k]) akunMeta.t[KUNCI_SINKRON[k]] = now
  else return
  simpanMeta()
  if (akunUser) { clearTimeout(akunTimer); akunTimer = setTimeout(() => sinkronAkun(), 1500) }
}

// ---------- gabung data ----------
const kunciRiw = r => [r.tanggal, r.status || '', r.catatan || ''].join('|')
function gabungRiwayat(a, b) {
  const ada = new Set((a || []).map(kunciRiw))
  return [...(a || []), ...(b || []).filter(r => !ada.has(kunciRiw(r)))].sort((x, y) => String(x.tanggal).localeCompare(String(y.tanggal)))
}
function gabungSatu(a, b) {
  const [dasar, lain] = (a._t || 0) >= (b._t || 0) ? [a, b] : [b, a]
  const x = Object.assign({}, dasar, { riwayat: gabungRiwayat(dasar.riwayat, lain.riwayat) })
  if (dasar.snap || lain.snap) x.snap = Object.assign({}, lain.snap || {}, dasar.snap || {})
  return x
}
// Bandingin isi tanpa peduli urutan key, biar ga dianggap berubah terus.
const stabil = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, kk) => (o[kk] = x[kk], o), {}) : x)
function gabungData(lokal, awan) {
  const hapus = Object.assign({}, awan.hapus || {})
  Object.entries(lokal.hapus || {}).forEach(([id, t]) => { hapus[id] = Math.max(t, hapus[id] || 0) })
  const la = lokal.lamaran || {}, aw = awan.lamaran || {}, lamaran = {}
  new Set([...Object.keys(la), ...Object.keys(aw)]).forEach(id => {
    const a = la[id], b = aw[id], x = !a ? b : !b ? a : gabungSatu(a, b)
    if (hapus[id] && hapus[id] >= (x._t || 0)) return
    lamaran[id] = x
  })
  const out = { lamaran, hapus, t: {} }
  ;['profil', 'target', 'lewati'].forEach(k => {
    const tl = (lokal.t || {})[k] || 0, ta = (awan.t || {})[k] || 0
    const pakaiLokal = awan[k] == null || (lokal[k] != null && tl > ta)
    out[k] = pakaiLokal ? lokal[k] : awan[k]
    out.t[k] = pakaiLokal ? tl : ta
    if (out[k] == null) delete out[k]
  })
  return out
}
// Update dari Jobseeker (cuma buat akun yang diisi cron). Aturannya sama kayak selaras.js.
function terapkanJobseeker(lamaran, js, hapus) {
  Object.entries(js || {}).forEach(([id, b]) => {
    const a = lamaran[id]
    if (hapus[id] && !a) return
    if (!a) { lamaran[id] = Object.assign({}, b, { _t: 1 }); return }
    const ada = new Set((a.riwayat || []).map(kunciRiw))
    const tambahan = (b.riwayat || []).filter(r => !ada.has(kunciRiw(r)))
    if (!tambahan.length) return
    const riw = gabungRiwayat(a.riwayat, tambahan)
    const akhir = [...riw].reverse().find(r => r.status)
    lamaran[id] = Object.assign({}, a, { status: akhir ? akhir.status : a.status, riwayat: riw, snap: Object.assign({}, b.snap || {}, a.snap || {}) })
    if (b.catatan && !a.catatan) lamaran[id].catatan = b.catatan
  })
  return lamaran
}
const dataLokal = () => ({ lamaran: LM, profil: profil || null, target: bacaLS('gaj-target', null), lewati: bacaLS('gaj-lewati-pilah', null), t: akunMeta.t, hapus: akunMeta.hapus })
function terapkanKeLokal(m) {
  let ubah = false
  const tulis = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }
  if (stabil(m.lamaran) !== stabil(LM)) { LM = m.lamaran; tulis('gaj-lamaran', LM); jejakUlang(); ubah = true }
  if (stabil(m.profil ?? null) !== stabil(profil ?? null)) { profil = m.profil ?? null; tulis('gaj-profil', profil); ubah = true }
  if (m.target != null && m.target !== TARGET) { TARGET = m.target; tulis('gaj-target', TARGET); ubah = true }
  if (m.lewati && stabil(m.lewati) !== stabil([...LEWATI])) { LEWATI = new Set(m.lewati); tulis('gaj-lewati-pilah', m.lewati); ubah = true }
  akunMeta.hapus = m.hapus; akunMeta.t = m.t; simpanMeta()
  return ubah
}

// ---------- sinkron ----------
async function sinkronAkun() {
  if (!sbA || !akunUser) return
  if (akunSibuk) { akunLagi = true; return }
  akunSibuk = true; clearTimeout(akunTimer); gambarAkun()
  try {
    const { data: row, error } = await sbA.from('get_a_job_akun').select('data, dari_jobseeker').eq('user_id', akunUser.id).maybeSingle()
    if (error) throw error
    const awan = (row && row.data) || {}
    const m = gabungData(dataLokal(), awan)
    if (row && row.dari_jobseeker) m.lamaran = terapkanJobseeker(m.lamaran, row.dari_jobseeker, m.hapus)
    const berubah = terapkanKeLokal(m)
    if (!row || stabil(m) !== stabil(awan)) {
      const { error: e2 } = await sbA.from('get_a_job_akun').upsert({ user_id: akunUser.id, data: m, diperbarui: new Date().toISOString() })
      if (e2) throw e2
    }
    akunMeta.terakhir = Date.now(); simpanMeta(); akunPesan = ''
    if (berubah) { segarSemua(); toast('Lamaran disamain sama akun kamu') }
  } catch (e) {
    console.error(e)
    akunPesan = /fetch|network|load failed/i.test((e && e.message) || '') ? 'Lagi offline. Nanti disinkron lagi pas koneksi balik.' : 'Sinkron gagal. Coba pencet Sinkron sekarang.'
  }
  akunSibuk = false; akunTarikTerakhir = Date.now(); gambarAkun()
  if (akunLagi) { akunLagi = false; sinkronAkun() }
}
document.addEventListener('visibilitychange', () => {
  if (!akunUser) return
  if (document.visibilityState === 'visible' && Date.now() - akunTarikTerakhir > 20000) sinkronAkun()
  if (document.visibilityState === 'hidden' && akunTimer) sinkronAkun()
})
addEventListener('online', () => { if (akunUser) sinkronAkun() })

// ---------- masuk, daftar, keluar ----------
const pesanAkun = e => {
  const m = (e && e.message) || String(e)
  if (/invalid login/i.test(m)) return 'Email atau kata sandi salah.'
  if (/already (registered|exists)/i.test(m)) return 'Email ini udah terdaftar. Coba Masuk.'
  if (/not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Buka email konfirmasinya (cek juga folder spam), klik link-nya, terus masuk lagi.'
  if (/rate limit|too many|security purposes/i.test(m)) return 'Lagi kebanyakan percobaan. Tunggu sebentar, terus coba lagi.'
  if (/password/i.test(m)) return 'Kata sandi minimal 6 karakter.'
  if (/fetch|network|load failed/i.test(m)) return 'Koneksi ke server bermasalah. Cek internet terus coba lagi.'
  return m
}
async function akunAksi(jenis) {
  const email = String(($('akun-email') || {}).value || '').trim().toLowerCase(), pass = String(($('akun-sandi') || {}).value || '')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { akunPesan = 'Format email belum bener.'; gambarAkun(); return }
  if (pass.length < 6) { akunPesan = 'Kata sandi minimal 6 karakter.'; gambarAkun(); return }
  akunSibuk = true; akunPesan = ''; gambarAkun()
  try {
    if (jenis === 'daftar') {
      const { data, error } = await sbA.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } })
      if (error) throw error
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error('already registered')
      if (!data.session) { akunSibuk = false; akunMode = 'masuk'; akunPesan = 'Akun dibuat. Buka email konfirmasi dari kami (cek juga spam), klik link-nya, terus balik ke sini dan Masuk.'; gambarAkun(); return }
      akunUser = data.user
    } else {
      const { data, error } = await sbA.auth.signInWithPassword({ email, password: pass })
      if (error) throw error
      akunUser = data.user
    }
    akunSibuk = false
    await sinkronAkun()
    toast('Masuk. Lamaranmu sekarang ikut ke semua perangkat.')
  } catch (e) { akunSibuk = false; akunPesan = pesanAkun(e); gambarAkun() }
}
async function akunKeluar(tanpaKirim) {
  if (!sbA) return
  if (!tanpaKirim && akunUser) await sinkronAkun()
  try { await sbA.auth.signOut({ scope: 'local' }) } catch (e) { }
  akunUser = null; akunMeta = META_KOSONG(); try { localStorage.removeItem('gja-meta') } catch (e) { }
  gambarAkun()
}
window.akunKeluarLokal = () => akunKeluar(true)
async function akunHapusData() {
  if (!akunUser) return
  akunSibuk = true; gambarAkun()
  const { error } = await sbA.from('get_a_job_akun').delete().eq('user_id', akunUser.id)
  akunSibuk = false
  if (error) { akunPesan = 'Gagal ngehapus. Coba lagi.'; gambarAkun(); return }
  await akunKeluar(true)
  toast('Data Get a Job di akun udah dihapus. Data di perangkat ini tetap ada.')
}

// ---------- tampilan (di halaman Privasi) ----------
const jamPendek = t => t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
function gambarAkun() {
  const b = $('akun-blok'); if (!b) return
  if (!sbA) { b.innerHTML = `<h2>Akun get it (opsional)</h2><p>Login lagi ga bisa dimuat di browser ini. Get a Job tetap jalan tanpa akun.</p>`; return }
  const pesan = akunPesan ? `<p class="akun-pesan" role="status">${esc(akunPesan)}</p>` : ''
  if (akunUser) {
    b.innerHTML = `<h2>Akun get it</h2>
      <p>Masuk sebagai <b>${esc(akunUser.email)}</b>. Lamaran, checklist berkas, catatan, jawaban survei, target, dan loker yang kamu lewati ikut ke semua perangkat yang login pakai akun ini.</p>
      <div class="isi-data"><span class="sinkron-titik${akunSibuk ? ' jalan' : ''}">${akunSibuk ? 'Lagi sinkron…' : 'Terakhir sinkron ' + jamPendek(akunMeta.terakhir)}</span></div>${pesan}
      <div class="act"><button class="btn utama kecil" data-akun="sinkron" ${akunSibuk ? 'disabled' : ''}>Sinkron sekarang</button><button class="btn garis kecil" data-akun="keluar">Keluar</button><button class="btn garis kecil bahaya" data-akun="hapus">Hapus data Get a Job dari akun</button></div>
      <p class="redup kecil" style="margin-top:10px">Keluar ga ngapus data di perangkat ini. Buat bersihin perangkat ini juga, pakai Hapus semua data saya di bawah.</p>`
    return
  }
  const daftar = akunMode === 'daftar'
  b.innerHTML = `<h2>Akun get it (opsional)</h2>
    <p>Login kalau kamu mau lamaranmu ikut ke HP, laptop, dan browser lain. Ga login juga gapapa, semuanya tetap jalan di perangkat ini. Udah punya akun Get a Skill? Pakai yang sama.</p>
    <form class="akun-isi" data-akun-form novalidate>
      <label class="label" for="akun-email">Email</label><input id="akun-email" type="email" autocomplete="email" inputmode="email" placeholder="nama@gmail.com" required>
      <label class="label" for="akun-sandi">Kata sandi</label><input id="akun-sandi" type="password" autocomplete="${daftar ? 'new-password' : 'current-password'}" minlength="6" placeholder="Minimal 6 karakter" required>
      ${pesan}
      <div class="act"><button class="btn utama kecil" type="submit" ${akunSibuk ? 'disabled' : ''}>${akunSibuk ? 'Sebentar…' : daftar ? 'Bikin akun' : 'Masuk'}</button><button class="link-tombol" type="button" data-akun="${daftar ? 'ke-masuk' : 'ke-daftar'}">${daftar ? 'Udah punya akun? Masuk' : 'Belum punya akun? Daftar'}</button></div>
    </form>`
}
document.addEventListener('submit', e => { if (e.target.closest('[data-akun-form]')) { e.preventDefault(); if (!akunSibuk) akunAksi(akunMode) } })
document.addEventListener('click', e => {
  const t = e.target.closest('[data-akun]'); if (!t) return
  const a = t.dataset.akun
  if (a === 'ke-daftar' || a === 'ke-masuk') { akunMode = a === 'ke-daftar' ? 'daftar' : 'masuk'; akunPesan = ''; gambarAkun() }
  else if (a === 'sinkron') sinkronAkun()
  else if (a === 'keluar') akunKeluar().then(() => toast('Udah keluar. Data di perangkat ini tetap ada.'))
  else if (a === 'hapus') {
    if (!t.classList.contains('yakin')) { t.classList.add('yakin'); t.textContent = 'Yakin? Pencet lagi'; setTimeout(() => { if (document.contains(t)) { t.classList.remove('yakin'); t.textContent = 'Hapus data Get a Job dari akun' } }, 5000); return }
    akunHapusData()
  }
})

// ---------- mulai ----------
if (sbA) {
  sbA.auth.onAuthStateChange((ev, sesi) => {
    if (ev === 'SIGNED_IN' && sesi && sesi.user && (!akunUser || akunUser.id !== sesi.user.id)) { akunUser = sesi.user; sinkronAkun() }
    if (ev === 'SIGNED_OUT') { akunUser = null; gambarAkun() }
  })
  sbA.auth.getSession().then(({ data }) => {
    const u = data && data.session && data.session.user
    if (u && !akunUser) { akunUser = u; sinkronAkun() } else gambarAkun()
  }).catch(() => gambarAkun())
}
gambarAkun()
