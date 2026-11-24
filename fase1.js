// Fase 1, mode tamu: semua data pengguna cuma di localStorage perangkat ini. Ga ada server, ga ada upload.
const TAHAP = ['Mau daftar', 'Udah daftar', 'Lolos berkas', 'Tes', 'Interview', 'Diterima']
const SEMUA_STATUS = [...TAHAP, 'Ditolak', 'Batal']
const AKTIF = ['Udah daftar', 'Lolos berkas', 'Tes', 'Interview']
const CEK = [['baca', 'Baca syarat sampai habis'], ['cv', 'Siapin CV terbaru'], ['ijazah', 'Siapin transkrip dan ijazah atau SKL'], ['cl', 'Tulis cover letter, kalau diminta'], ['kirim', 'Kirim lewat link resmi']]
const JENIS_CATAT = [['kabar', 'Dihubungi / ada kabar', null], ['lolos', 'Lolos berkas', 'Lolos berkas'], ['tes', 'Undangan tes', 'Tes'], ['interview', 'Undangan interview', 'Interview'], ['terima', 'Diterima', 'Diterima'], ['tolak', 'Ditolak', 'Ditolak']]
const JENIS_EV = { daftar: ['Daftar', '#378ADD'], kabar: ['Dihubungi', '#23A065'], agenda: ['Tes & interview', '#7B4FD6'], tutup: ['Tenggat', '#E39A00'], tolak: ['Ditolak & batal', '#D9473B'] }
const VIEWS = ['loker', 'pilah', 'lamaran', 'kalender', 'notif', 'privasi']
const NAMA_VIEW = { loker: 'Loker', pilah: 'Pilah', lamaran: 'Lamaranku', kalender: 'Kalender', notif: 'Notif', privasi: 'Privasi' }
const IKON_NAV = {
  loker: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  pilah: '<rect x="6" y="4" width="12" height="16" rx="3"/><path d="M3 8v8M21 8v8"/>',
  lamaran: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3"/>',
  kalender: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  notif: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  privasi: '<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
}
const hariStr = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)
const tglStr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const fmtPanjang = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) }
const teksSisa = n => n === null ? '' : n < 0 ? 'lewat' : n === 0 ? 'hari ini' : n === 1 ? 'besok' : n + ' hari lagi'
const bacaSS = (k, d) => { try { const v = JSON.parse(sessionStorage.getItem(k)); return v ?? d } catch (e) { return d } }
const simpanSS = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }

let LM = bacaLS('gaj-lamaran', {}), LEWATI = new Set(bacaLS('gaj-lewati-pilah', [])), TARGET = bacaLS('gaj-target', 3)
let BARU = new Set(), view = 'loker', urungPilah = [], bukaCek = new Set()
const simpanLM = () => simpanLS('gaj-lamaran', LM)
const lamaranDari = id => LM[id] || null
const lokerDari = id => DATA.find(j => j.id === id) || (LM[id] && LM[id].snap) || { perusahaan: '', program: '' }
const snap = j => ({ perusahaan: j.perusahaan, program: j.program, link: j.link, deadline: j.deadline || null, lokasi: j.lokasi || '' })
// simpanan lama (ikon penanda) dipindah jadi "Mau daftar"
;(() => { const lama = bacaLS('gaj-simpan', null); if (!lama) return; lama.forEach(id => { if (!LM[id]) LM[id] = { status: 'Mau daftar', dibuat: hariStr(), riwayat: [{ tanggal: hariStr(), status: 'Mau daftar', catatan: 'Dipindah dari simpanan' }], cek: {} } }); simpanLM(); try { localStorage.removeItem('gaj-simpan') } catch (e) { } })()

// ubah data dengan tombol Urungkan
function ubah(id, fn, pesan) {
  const sebelum = LM[id] ? JSON.parse(JSON.stringify(LM[id])) : null
  fn(); simpanLM(); segarSemua()
  if (pesan) toast(pesan, { label: 'Urungkan', fn: () => { if (sebelum) LM[id] = sebelum; else delete LM[id]; simpanLM(); segarSemua() } })
}
function tambahLamaran(j) { LM[j.id] = { status: 'Mau daftar', dibuat: hariStr(), snap: snap(j), riwayat: [{ tanggal: hariStr(), status: 'Mau daftar', catatan: 'Masuk Lamaranku' }], cek: {} } }
function setStatus(l, st, catatan) {
  if (st === l.status) return
  l.riwayat.push({ tanggal: hariStr(), status: st, catatan: catatan || 'Status jadi ' + st })
  if (st === 'Udah daftar' && !l.tanggal_daftar) l.tanggal_daftar = hariStr()
  l.status = st
}
function togelMau(id) {
  const j = DATA.find(x => x.id === id), l = LM[id]
  if (!l) ubah(id, () => tambahLamaran(j), 'Masuk Lamaranku: Mau daftar')
  else if (l.status === 'Mau daftar') ubah(id, () => { delete LM[id] }, 'Dihapus dari Lamaranku')
  else toast('Udah di Lamaranku, statusnya ' + l.status, { label: 'Buka', fn: () => { location.hash = 'lamaran' } })
}

// tanda "Baru": loker yang belum ada pas kunjungan terakhir di perangkat ini
function siapkanBaru() {
  const ids = DATA.map(j => j.id)
  let s = bacaSS('gaj-baru', null)
  if (!s) { const lalu = bacaLS('gaj-kunjungan', null); s = { ids: lalu ? ids.filter(i => !lalu.ids.includes(i)) : [], tgl: lalu ? lalu.tgl : null }; simpanSS('gaj-baru', s) }
  simpanLS('gaj-kunjungan', { tgl: hariStr(), ids })
  BARU = new Set(s.ids.filter(i => ids.includes(i)))
  DATA.forEach(j => { if (LM[j.id] && !LM[j.id].snap) LM[j.id].snap = snap(j) })
  if (BARU.size && s.tgl) $('diperbarui').textContent += ` · ${BARU.size} baru sejak ${fmtPendek(s.tgl)}`
}

// ---------- navigasi ----------
for (const id of ['nav-atas', 'nav-bawah']) $(id).innerHTML = VIEWS.map(k => `<a href="#${k}" data-v="${k}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON_NAV[k]}</svg>${NAMA_VIEW[k]}<span class="bdg" hidden></span></a>`).join('')
function arahkan() {
  const h = location.hash.slice(1), lama = view
  view = VIEWS.includes(h) ? h : 'loker'
  document.querySelectorAll('[data-view]').forEach(s => s.hidden = s.id !== 'v-' + view)
  document.querySelectorAll('.nav a, .tabbar a').forEach(a => a.dataset.v === view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'))
  document.title = view === 'loker' ? 'get a job.' : NAMA_VIEW[view] + ' · get a job.'
  tampil()
  if (lama !== view && VIEWS.includes(h)) scrollTo(0, 0)
}
function tampil() { if (typeof segarNotif === 'function') segarNotif(); if (typeof kabarSegar === 'function' && DATA.length && view !== 'notif') kabarSegar(); ({ pilah: halamanPilah, lamaran: halamanLamaran, kalender: halamanKalender, notif: typeof halamanNotif === 'function' ? halamanNotif : null, privasi: halamanPrivasi })[view]?.() ; navBadge() }
function segarSemua() { if (DATA.length) render(); tampil() }
function navBadge() {
  const n = Object.values(LM).filter(l => l.status === 'Mau daftar' || AKTIF.includes(l.status)).length
  document.querySelectorAll('a[data-v="lamaran"] .bdg').forEach(b => { b.hidden = !n; b.textContent = n })
  const k = typeof belumDibaca === 'function' && view !== 'notif' ? belumDibaca() : 0
  document.querySelectorAll('a[data-v="notif"] .bdg').forEach(b => { b.hidden = !k; b.textContent = k > 9 ? '9+' : k; b.classList.add('merah') })
}
addEventListener('hashchange', arahkan)

// ---------- Lamaranku ----------
function miniRel(id, l) {
  const pos = TAHAP.indexOf(l.status)
  return `<div class="mini" role="group" aria-label="Pindah status">${TAHAP.map((s, i) => `${i ? `<s class="${pos >= i ? 'on' : ''}"></s>` : ''}<button class="stn ${pos >= i ? 'on' : ''} ${pos === i ? 'skrg' : ''}" data-rel="${esc(id)}" data-st="${s}" title="${s}" aria-label="Pindah ke ${s}" ${pos === i ? 'aria-current="step"' : ''}></button>`).join('')}</div>
    <div class="mini-ket"><span>Mau</span><b>${esc(l.status)}</b><span>Diterima</span></div>`
}
function kartuLamaran(id) {
  const l = LM[id], j = lokerDari(id), n = j.deadline ? sisa(j.deadline) : null, arsip = ['Ditolak', 'Batal'].includes(l.status)
  const cek = CEK.filter(([k]) => l.cek && l.cek[k]).length
  const tags = []
  if (l.status === 'Mau daftar' && j.deadline) tags.push(`<span class="tag ${n !== null && n <= 3 ? 'exp' : ''}">Tutup ${fmtPendek(j.deadline)} · ${teksSisa(n)}</span>`)
  if (l.tanggal_daftar) tags.push(`<span class="tag">Daftar ${fmtPendek(l.tanggal_daftar)}</span>`)
  if (arsip) tags.push(`<span class="tag exp">${esc(l.status)}</span>`)
  if (j.lokasi) tags.push(`<span class="tag">${esc(j.lokasi)}</span>`)
  const ag = l.agenda_tanggal && l.agenda_tanggal >= hariStr() ? `<div class="agenda"><b>${fmtPanjang(l.agenda_tanggal)}:</b> ${esc(l.agenda || 'Agenda')}</div>` : ''
  const riw = l.riwayat.slice().reverse()
  return `<article class="kartu" data-lam="${esc(id)}">
    <div><div class="co">${esc(j.perusahaan)}</div><div class="prog">${esc(j.program)}</div></div>
    ${arsip ? '' : miniRel(id, l)}
    ${tags.length ? `<div class="tags">${tags.join('')}</div>` : ''}${ag}
    <details class="lipat" data-cek ${bukaCek.has(id) || (l.status === 'Mau daftar' && !bukaCek.has('-' + id)) ? 'open' : ''}><summary>Checklist berkas ${cek}/${CEK.length} <span class="prog-mini"><i style="width:${cek / CEK.length * 100}%"></i></span></summary>
      <div class="ceklis">${CEK.map(([k, t]) => `<button role="checkbox" aria-checked="${!!(l.cek && l.cek[k])}" data-cekk="${k}"><span class="kotak">${l.cek && l.cek[k] ? svg('cek', 14) : ''}</span><span>${t}</span></button>`).join('')}</div></details>
    <div class="act"><select class="pilih" data-status aria-label="Status ${esc(j.program)}">${SEMUA_STATUS.map(s => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <button class="btn garis kecil" data-catat>Catat kejadian</button>
      ${j.link ? `<a class="btn garis kecil" href="${esc(j.link)}" target="_blank" rel="noopener">Link resmi ${svg('luar', 13)}</a>` : ''}
      <button class="btn garis kecil" data-hapus aria-label="Hapus dari Lamaranku">Hapus</button></div>
    <details class="lipat"><summary>Riwayat (${riw.length})</summary><div class="riw">${riw.map(r => `<span><b>${fmtPendek(r.tanggal)}</b> ${esc(r.catatan || r.status || '')}</span>`).join('')}</div></details>
  </article>`
}
function formCatat(id) {
  return `<form class="catat" data-form="${esc(id)}" novalidate>
    <label>Tanggal<input type="date" name="tgl" value="${hariStr()}"></label>
    <label>Jenis<select name="jenis">${JENIS_CATAT.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
    <label class="lebar">Catatan singkat<input name="cat" maxlength="140" placeholder="Misal: HR nelpon, tes online minggu depan"></label>
    <label class="lebar" data-acara hidden>Tanggal acaranya (tes atau interview)<input type="date" name="acara"></label>
    <button class="btn utama kecil lebar" type="submit">Simpan</button></form>`
}
function targetMingguan() {
  const d = new Date(Date.now() + 7 * 3600e3); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); const senin = d.toISOString().slice(0, 10)
  const kirim = Object.values(LM).filter(l => l.riwayat.some(r => r.status === 'Udah daftar' && r.tanggal >= senin)).length
  const R = 31, K = 2 * Math.PI * R, p = Math.min(1, kirim / TARGET)
  return `<div class="target"><div class="cincin"><svg viewBox="0 0 78 78" width="78" height="78" aria-hidden="true"><circle cx="39" cy="39" r="${R}" fill="none" stroke="var(--garis-ui)" stroke-width="8"/><circle class="isi" cx="39" cy="39" r="${R}" fill="none" stroke="var(--biru)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${K}" stroke-dashoffset="${K * (1 - p)}" transform="rotate(-90 39 39)"/></svg><b>${kirim}/${TARGET}</b></div>
    <div class="tx"><b>${kirim >= TARGET ? 'Target minggu ini kelar. Mantap.' : `Kirim ${TARGET - kirim} lamaran lagi minggu ini`}</b>
    <span>Minggu ini aku mau kirim <select id="target" aria-label="Target lamaran per minggu">${[1, 2, 3, 5, 7, 10].map(n => `<option ${n === TARGET ? 'selected' : ''}>${n}</option>`).join('')}</select> lamaran. Dihitung dari status Udah daftar sejak Senin.</span></div></div>`
}
function halamanLamaran() {
  const v = $('v-lamaran'), ids = Object.keys(LM)
  const grup = ['Interview', 'Tes', 'Lolos berkas', 'Udah daftar', 'Mau daftar', 'Diterima'].map(st => [st, ids.filter(id => LM[id].status === st)]).filter(g => g[1].length)
  const ars = ids.filter(id => ['Ditolak', 'Batal'].includes(LM[id].status))
  const urutId = (a, b) => String(LM[a].agenda_tanggal || lokerDari(a).deadline || '9999').localeCompare(String(LM[b].agenda_tanggal || lokerDari(b).deadline || '9999'))
  v.innerHTML = `<div class="kepala-hal"><span class="label">Lamaranku</span><h1>Progres tiap lamaran</h1><p>Ketuk titik di rel buat pindah status. Semua yang kamu catat di sini cuma disimpan di perangkat ini.</p></div>
    ${targetMingguan()}
    ${grup.length ? grup.map(([st, g]) => `<div class="sec-h"><h2>${st}</h2><span class="n">${g.length}</span></div><div class="papan">${g.sort(urutId).map(kartuLamaran).join('')}</div>`).join('') : `<div class="kosong" style="margin-top:16px">Belum ada lamaran. Buka <a href="#loker">Loker</a> atau <a href="#pilah">Pilah</a>, terus pencet ikon penanda di tiket.</div>`}
    ${ars.length ? `<details class="arsip"><summary>Arsip: ditolak dan batal (${ars.length})</summary><div class="papan">${ars.map(kartuLamaran).join('')}</div></details>` : ''}`
  $('target').onchange = e => { TARGET = Number(e.target.value); simpanLS('gaj-target', TARGET); halamanLamaran() }
}
$('v-lamaran').addEventListener('click', e => {
  const k = e.target.closest('[data-lam]'); if (!k) return
  const id = k.dataset.lam, l = LM[id], nm = lokerDari(id).perusahaan
  const r = e.target.closest('[data-rel]')
  if (r) { const st = r.dataset.st; if (st !== l.status) ubah(id, () => setStatus(l, st), nm + ' → ' + st); return }
  const c = e.target.closest('[data-cekk]')
  if (c) {
    const key = c.dataset.cekk, on = !(l.cek && l.cek[key]); bukaCek.add(id)
    if (key === 'kirim' && on && l.status === 'Mau daftar') ubah(id, () => { l.cek = Object.assign({}, l.cek, { kirim: true }); setStatus(l, 'Udah daftar', 'Kirim lamaran') }, 'Status jadi Udah daftar')
    else { l.cek = Object.assign({}, l.cek, { [key]: on }); simpanLM(); halamanLamaran() }
    return
  }
  if (e.target.closest('[data-hapus]')) { ubah(id, () => { delete LM[id] }, 'Dihapus dari Lamaranku'); return }
  if (e.target.closest('[data-catat]')) { const ada = k.querySelector('.catat'); if (ada) { ada.remove(); return } k.querySelector('.act').insertAdjacentHTML('afterend', formCatat(id)); const f = k.querySelector('.catat'); f.jenis.onchange = () => { f.querySelector('[data-acara]').hidden = !['tes', 'interview'].includes(f.jenis.value) }; f.tgl.focus() }
})
$('v-lamaran').addEventListener('toggle', e => { const d = e.target; if (d.matches && d.matches('[data-cek]')) { const id = d.closest('[data-lam]').dataset.lam; if (d.open) { bukaCek.add(id); bukaCek.delete('-' + id) } else { bukaCek.delete(id); bukaCek.add('-' + id) } } }, true)
$('v-lamaran').addEventListener('change', e => { const s = e.target.closest('[data-status]'); if (!s) return; const id = s.closest('[data-lam]').dataset.lam; ubah(id, () => setStatus(LM[id], s.value), lokerDari(id).perusahaan + ' → ' + s.value) })
$('v-lamaran').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, id = f.dataset.form, l = LM[id]
  if (!f.tgl.value) { toast('Isi tanggalnya dulu'); return }
  const [k, t, st] = JENIS_CATAT.find(x => x[0] === f.jenis.value), cat = f.cat.value.trim()
  ubah(id, () => {
    const ent = { tanggal: f.tgl.value, jenis: k, catatan: cat || t }; if (st) ent.status = st
    l.riwayat.push(ent); if (st && st !== l.status) l.status = st
    if (['tes', 'interview'].includes(k) && f.acara.value) { l.agenda_tanggal = f.acara.value; l.agenda = t + (cat ? ': ' + cat : '') }
  }, 'Kecatat: ' + t)
})

// ---------- Pilah ----------
function antrean() {
  const sisaJ = DATA.filter(j => buka(j) && !LM[j.id] && !LEWATI.has(j.id))
  if (!profil) return urutkan(sisaJ, 'deadline')
  const sk = new Map(sisaJ.map(j => { const c = nilaiCocok(j, profil); return [j, c ? (c.pas ? 100 : c.beda.length <= 1 ? 50 : 0) + c.s : -100] }))
  return sisaJ.sort((a, b) => sk.get(b) - sk.get(a) || urutDl(a) - urutDl(b))
}
function halamanPilah() {
  const v = $('v-pilah'), q = antrean(), total = DATA.filter(buka).length, udah = total - q.length, j = q[0]
  const c = j && profil ? nilaiCocok(j, profil) : null, n = j && j.deadline ? sisa(j.deadline) : null
  v.innerHTML = `<div class="pilah-wrap"><div class="kepala-hal"><span class="label">Pilah · ${q.length} tersisa</span><h1>Satu-satu aja.</h1><p>Geser ke kanan buat Mau daftar, ke kiri buat lewati. ${profil ? 'Urutannya dari yang paling cocok sama jawaban survei kamu.' : 'Jawab survei biar yang paling cocok muncul duluan.'}</p></div>
    <div class="bar" aria-hidden="true"><i style="width:${total ? udah / total * 100 : 0}%"></i></div>
    ${!profil ? `<div class="profil" style="margin-bottom:14px"><span class="redup kecil" style="flex:1">Urutan sekarang cuma dari tenggat terdekat.</span><button class="btn garis kecil" data-survei>Jawab survei</button></div>` : ''}
    ${j ? `<div class="tumpuk">${q[1] ? '<div class="pk-blk" aria-hidden="true"></div>' : ''}<article class="pk" id="pk" data-id="${esc(j.id)}" aria-label="${esc(j.perusahaan + ', ' + j.program)}">
      <span class="stempel mau">Mau</span><span class="stempel lewat">Lewati</span>
      <div><div class="co">${esc(j.perusahaan)}</div><div class="prog">${esc(j.program)}</div></div>
      ${c ? `<div class="alasan">${c.alasan.map(a => `<span>${svg('cek', 12)}${esc(a)}</span>`).join('')}${c.beda.map(a => `<span class="beda">${esc(a)}</span>`).join('')}</div>` : ''}
      <div class="tags">${BARU.has(j.id) ? '<span class="tag baru">Baru</span>' : ''}${tagJurusan(j)}${j.tipe && j.tipe !== 'penuh waktu' ? `<span class="tag tp">${esc(LBL.tipe[j.tipe] || j.tipe)}</span>` : ''}${j.lokasi ? `<span class="tag">${esc(j.lokasi)}</span>` : ''}${j.fresh_grad ? '' : '<span class="tag exp">Butuh pengalaman</span>'}</div>
      <p style="margin:0;font-size:14px;color:var(--ink-2)"><b>Untuk:</b> ${esc(j.untuk)}</p>
      ${(j.syarat || []).length ? `<ul>${j.syarat.slice(0, 4).map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      <div class="pk-tgl">${j.deadline ? 'Tutup ' + fmt(j.deadline) : 'Tanggal tutup belum diumumkan'}<b>${teksSisa(n)}</b></div>
    </article></div>
    <div class="aksi-pilah"><button class="btn garis" data-p="lewat">${svg('kiri', 18)} Lewati</button><button class="btn garis" data-p="urung" aria-label="Urungkan" ${urungPilah.length ? '' : 'disabled'}>↶</button><button class="btn biru" data-p="mau">Mau daftar ${svg('kanan', 18)}</button></div>
    <p class="petunjuk">Di laptop: <kbd>←</kbd> lewati, <kbd>→</kbd> mau daftar, <kbd>Z</kbd> urungkan</p>`
    : `<div class="kosong">Udah kepilah semua. <a href="#lamaran">Buka Lamaranku</a>${LEWATI.size ? ` atau <button class="link-tombol" data-p="ulang">liat lagi ${LEWATI.size} yang dilewati</button>` : ''}.</div>`}</div>`
  const pk = $('pk'); if (pk) pasangSeret(pk)
}
function putus(arah) {
  const pk = $('pk'); if (!pk) return
  const id = pk.dataset.id, j = DATA.find(x => x.id === id)
  pk.style.transform = `translateX(${arah === 'mau' ? 130 : -130}%) rotate(${arah === 'mau' ? 14 : -14}deg)`; pk.style.opacity = 0
  setTimeout(() => {
    if (arah === 'mau') { tambahLamaran(j); simpanLM() } else { LEWATI.add(id); simpanLS('gaj-lewati-pilah', [...LEWATI]) }
    urungPilah.push([id, arah]); render(); halamanPilah(); navBadge()
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200)
}
function urungkanPilah() {
  const x = urungPilah.pop(); if (!x) return
  const [id, arah] = x
  if (arah === 'mau') { if (LM[id] && LM[id].status === 'Mau daftar') delete LM[id]; simpanLM() } else { LEWATI.delete(id); simpanLS('gaj-lewati-pilah', [...LEWATI]) }
  render(); halamanPilah(); navBadge()
}
function pasangSeret(pk) {
  let x0 = null, dx = 0
  pk.addEventListener('pointerdown', e => { if (e.button) return; x0 = e.clientX; dx = 0; pk.classList.add('seret'); pk.setPointerCapture(e.pointerId) })
  pk.addEventListener('pointermove', e => { if (x0 === null) return; dx = e.clientX - x0; pk.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`; pk.dataset.arah = dx > 50 ? 'mau' : dx < -50 ? 'lewat' : '' })
  const lepas = () => { if (x0 === null) return; x0 = null; pk.classList.remove('seret'); if (Math.abs(dx) > 110) putus(dx > 0 ? 'mau' : 'lewat'); else { pk.style.transform = ''; pk.dataset.arah = '' } }
  pk.addEventListener('pointerup', lepas); pk.addEventListener('pointercancel', lepas)
}
$('v-pilah').addEventListener('click', e => {
  const b = e.target.closest('[data-p]'); if (!b) return
  const p = b.dataset.p
  if (p === 'urung') urungkanPilah()
  else if (p === 'ulang') { LEWATI.clear(); simpanLS('gaj-lewati-pilah', []); urungPilah = []; halamanPilah() }
  else { const pk = $('pk'); if (pk) { pk.dataset.arah = p; putus(p) } }
})
document.addEventListener('keydown', e => {
  if (view !== 'pilah' || !$('survei').hidden || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return
  if (e.key === 'ArrowRight') { const pk = $('pk'); if (pk) { pk.dataset.arah = 'mau'; putus('mau') } }
  else if (e.key === 'ArrowLeft') { const pk = $('pk'); if (pk) { pk.dataset.arah = 'lewat'; putus('lewat') } }
  else if (e.key.toLowerCase() === 'z') urungkanPilah()
})

// ---------- Kalender dan timeline ----------
let kalBulan = null, kalPilih = null, kalMode = bacaLS('gaj-kalmode', 'bulan'), kalSaring = new Set(Object.keys(JENIS_EV))
function semuaKejadian() {
  const ev = []
  for (const [id, l] of Object.entries(LM)) {
    const j = lokerDari(id), co = j.perusahaan, pos = j.program
    l.riwayat.forEach(r => {
      if (r.status === 'Mau daftar') return
      const jn = r.status === 'Udah daftar' ? 'daftar' : ['Ditolak', 'Batal'].includes(r.status) ? 'tolak' : 'kabar'
      ev.push({ t: r.tanggal, j: jn, co, pos, ket: r.catatan || r.status, id, lam: true })
    })
    if (l.agenda_tanggal) ev.push({ t: l.agenda_tanggal, j: 'agenda', co, pos, ket: l.agenda || 'Agenda', id, lam: true })
    if (l.status === 'Mau daftar' && j.deadline) ev.push({ t: j.deadline, j: 'tutup', co, pos, ket: 'Hari terakhir daftar', id, lam: true })
  }
  if (profil) daftarCocok().pas.forEach(([j]) => { if (j.deadline && !LM[j.id]) ev.push({ t: j.deadline, j: 'tutup', co: j.perusahaan, pos: j.program, ket: 'Tutup, cocok buat kamu', id: j.id }) })
  return ev.filter(e => e.t && kalSaring.has(e.j))
}
const barisKj = (e, tgl) => `<button class="kj" style="--w:${JENIS_EV[e.j][1]}" data-ev="${esc(e.id)}" data-lam="${e.lam ? 1 : ''}"><i></i><div style="min-width:0"><div class="j">${JENIS_EV[e.j][0]}${tgl ? ' · ' + fmtPendek(e.t) : ''}</div><div class="c">${esc(e.co)}</div><div class="k">${esc([e.pos, e.ket].filter(Boolean).join(' · '))}</div></div></button>`
function halamanKalender() {
  const v = $('v-kalender'), hs = hariStr()
  if (!kalBulan) { const [y, m] = hs.split('-').map(Number); kalBulan = new Date(y, m - 1, 1); kalPilih = hs }
  const ev = semuaKejadian(), per = {}; ev.forEach(e => (per[e.t] = per[e.t] || []).push(e))
  let isi = ''
  if (kalMode === 'timeline') {
    const tulis = (judul, list, kosong) => `<div class="tl-batas">${judul}</div>` + (list.length ? `<div class="tl">${list.map(t => `<div class="tl-tgl">${fmtPanjang(t)}${t >= hs ? ' · ' + teksSisa(sisa(t)) : ''}</div>${per[t].map(e => barisKj(e)).join('')}`).join('')}</div>` : `<div class="kosong">${kosong}</div>`)
    isi = tulis('Ke depan', Object.keys(per).filter(t => t >= hs).sort(), 'Ga ada tenggat atau agenda ke depan.') + tulis('Udah lewat', Object.keys(per).filter(t => t < hs).sort().reverse(), 'Belum ada riwayat. Catat kejadian dari kartu di Lamaranku.')
  } else {
    const awal = new Date(kalBulan); awal.setDate(1 - ((kalBulan.getDay() + 6) % 7))
    let sel = ''
    for (let i = 0; i < 42; i++) {
      const d = new Date(awal); d.setDate(awal.getDate() + i); if (i >= 35 && d.getMonth() !== kalBulan.getMonth()) break
      const s = tglStr(d), es = per[s] || []
      sel += `<button class="hr ${d.getMonth() !== kalBulan.getMonth() ? 'luar' : ''} ${s === hs ? 'skrg' : ''}" data-hari="${s}" aria-pressed="${s === kalPilih}" aria-label="${d.getDate()} ${BULAN[d.getMonth()]}, ${es.length} kejadian"><span>${d.getDate()}</span>${es.length ? `<div class="td">${es.slice(0, 4).map(e => `<i style="--w:${JENIS_EV[e.j][1]}"></i>`).join('')}</div>` : ''}</button>`
    }
    const hari = per[kalPilih] || []
    isi = `<div class="kal-tata"><div class="kal" id="kal"><div class="kal-kepala"><h2>${kalBulan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
      <button class="ikon-btn" data-geser="-1" aria-label="Bulan sebelumnya">${svg('kiri', 18)}</button><button class="ikon-btn" data-geser="1" aria-label="Bulan berikutnya">${svg('kanan', 18)}</button><button class="btn garis kecil" data-geser="0">Hari ini</button></div>
      <div class="kal-grid">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => `<div class="kal-hr">${x}</div>`).join('')}${sel}</div></div>
      <div class="hari-panel"><h3 style="font-size:18px;margin-bottom:6px">${kalPilih ? fmtPanjang(kalPilih) : 'Pilih tanggal'}</h3>${hari.length ? hari.map(e => barisKj(e)).join('') : '<p class="redup" style="margin:4px 0">Ga ada kejadian di tanggal ini.</p>'}</div></div>`
  }
  v.innerHTML = `<div class="kepala-hal"><span class="label">Kalender</span><h1>Kapan daftar, dihubungi, dan tutup</h1><p>Isinya dari Lamaranku dan tenggat loker yang cocok buat kamu.</p></div>
    <div class="seg">${[['bulan', 'Bulan'], ['timeline', 'Timeline']].map(([k, t]) => `<button data-mode-kal="${k}" aria-pressed="${kalMode === k}">${t}</button>`).join('')}</div>
    <div class="legenda" role="group" aria-label="Saring jenis kejadian">${Object.entries(JENIS_EV).map(([k, [n, w]]) => `<button class="lg" style="--w:${w}" data-lg="${k}" aria-pressed="${kalSaring.has(k)}"><i></i>${n}</button>`).join('')}</div>${isi}`
  const kal = $('kal'); if (kal) { let x0 = null; kal.onpointerdown = e => { x0 = e.clientX }; kal.onpointerup = e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 70) geserBulan(dx < 0 ? 1 : -1) } }
}
function geserBulan(n) { kalBulan = n ? new Date(kalBulan.getFullYear(), kalBulan.getMonth() + n, 1) : null; halamanKalender() }
$('v-kalender').addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return
  if (t.dataset.modeKal) { kalMode = t.dataset.modeKal; simpanLS('gaj-kalmode', kalMode); halamanKalender() }
  else if (t.dataset.lg) { const k = t.dataset.lg; kalSaring.has(k) ? kalSaring.delete(k) : kalSaring.add(k); halamanKalender() }
  else if (t.dataset.geser !== undefined) geserBulan(Number(t.dataset.geser))
  else if (t.dataset.hari) { kalPilih = t.dataset.hari; halamanKalender() }
  else if (t.dataset.ev) { if (t.dataset.lam) location.hash = 'lamaran'; else { const id = t.dataset.ev; location.hash = 'loker'; setTimeout(() => loncat(id), 60) } }
})

// ---------- Privasi dan data saya ----------
const kunciKu = () => { try { return Object.keys(localStorage).filter(k => k.startsWith('gaj-')) } catch (e) { return [] } }
function halamanPrivasi() {
  const nL = Object.keys(LM).length, nC = Object.values(LM).reduce((a, l) => a + l.riwayat.length, 0)
  $('v-privasi').innerHTML = `<div class="kepala-hal"><span class="label">Privasi dan akun</span><h1>Datamu, kamu yang atur.</h1><p>Get a Job bisa dipakai tanpa akun. Tanpa login, semua yang kamu isi cuma disimpan di browser HP atau laptop ini. Login cuma kalau kamu mau lamaranmu ikut ke perangkat lain.</p></div>
  <div class="priv">
    <section class="blok data" id="akun-blok"></section>
    <section class="blok"><h2>Data saya di perangkat ini</h2>
      <div class="isi-data"><span>${profil ? 'Jawaban survei' : 'Belum isi survei'}</span><span>${nL} lamaran</span><span>${nC} catatan riwayat</span><span>${LEWATI.size} loker dilewati</span><span>Target ${TARGET}/minggu</span></div>
      <p>Ganti HP atau browser, datanya ga ikut pindah. Simpan cadangan dulu, terus buka file itu lewat Impor di perangkat baru.</p>
      <div class="act" style="margin-top:12px"><button class="btn utama kecil" data-ekspor>Unduh cadangan (.json)</button><label class="btn garis kecil" style="cursor:pointer">Impor cadangan<input type="file" accept=".json,application/json" data-impor hidden></label><button class="btn garis kecil bahaya" data-hapus-semua>Hapus semua data saya</button></div>
      <div id="impor-tanya"></div></section>
    <section class="blok"><h2>Apa aja yang disimpan</h2><ul>
      <li>Jawaban survei: rumpun jurusan, minat kerja, daerah, dan jenis kerja. Bukan nama, bukan kampus.</li>
      <li>Lamaranku: loker yang kamu tandai, statusnya, checklist berkas, dan catatan kejadian yang kamu tulis sendiri.</li>
      <li>Loker yang kamu lewati di Pilah, target mingguan, dan pilihan tema.</li>
      <li>Daftar loker yang udah ada pas kamu terakhir buka, biar loker baru bisa ditandai <b>Baru</b>.</li></ul>
      <p>Get a Job ga pernah minta CV, ijazah, NIK, atau nomor HP. Kamu kirim berkas langsung ke perusahaan lewat link resminya. Tolong jangan nulis data sensitif kayak NIK di kolom catatan.</p></section>
    <section class="blok"><h2>Di mana disimpannya</h2>
      <p>Di penyimpanan browser (localStorage) perangkat ini. Situs ini file statis di GitHub Pages, jadi kalau kamu ga login, semua isian di atas ga dikirim ke kami. Pengecualiannya dua: kalau kamu login, atau kalau kamu nyalain notif loker (penjelasannya di bawah).</p></section>
    <section class="blok"><h2>Kalau kamu login (opsional)</h2>
      <p>Akunnya akun get it, sama dengan Get a Skill. Email dan kata sandi diurus Supabase Auth (kata sandi disimpan dalam bentuk acak, kami ga bisa baca). Lamaran, checklist berkas, catatan, jawaban survei, target mingguan, dan loker yang kamu lewati disimpan di database get it (Supabase) biar sama di semua perangkat.</p>
      <p>Data itu cuma bisa dibaca dan diubah akunmu sendiri. Pilihan tema dan notif tetap per perangkat.</p>
      <p>Hapus kapan aja lewat tombol <b>Hapus data Get a Job dari akun</b> di atas.</p></section>
    <section class="blok"><h2>Yang tetap terjadi</h2>
      <p>Kayak buka situs apa pun: GitHub (tempat situs ini di-host), jsDelivr (sumber kode login), dan Google Fonts (sumber huruf) nerima permintaan biasa dari browsermu, misalnya alamat IP. Pas kamu buka link resmi, kamu pindah ke situs perusahaan itu dan aturan privasi mereka yang berlaku.</p></section>
    <section class="blok"><h2>Notif loker (opsional)</h2>
      <div id="notif-kendali" style="margin:6px 0 12px"></div>
      <p>Kalau kamu nyalain, browsermu bikin <b>alamat langganan</b>: deretan huruf acak dari layanan push browser (misalnya Google, Mozilla, atau Apple). Alamat itu kami simpan di database get it (Supabase) bareng pilihan survei kamu: rumpun jurusan, jenis kerja, daerah, dan tipe kerja.</p>
      <p>Ga ada nama, email, atau nomor HP. Alamat langganan ga bisa dipakai buat tau siapa kamu, gunanya cuma buat ngirim notif ke browser ini.</p>
      <p>Matiin kapan aja lewat tombol di atas, dan alamatnya langsung dihapus dari database. Kalau kamu cabut izin notif dari pengaturan browser, alamatnya kehapus sendiri pas kami coba kirim notif berikutnya.</p>
      <p><b>Bisa di:</b> Android (Chrome, Edge, Firefox, Samsung Internet), laptop (Chrome, Edge, Firefox, Safari Mac terbaru), dan iPhone atau iPad iOS 16.4 ke atas kalau get a job dipasang ke Layar Utama.</p>
      <details class="lipat"><summary>Cara pasang ke Layar Utama di iPhone</summary>${LANGKAH_IOS}</details></section>
    <section class="blok"><h2>Ga ada pelacak</h2><p>Situs ini ga pakai analitik, iklan, pelacak, atau cookie. Kodenya terbuka, bisa dicek di <a href="https://github.com/aryaanstt/get-a-job" target="_blank" rel="noopener">github.com/aryaanstt/get-a-job</a>.</p></section>
    <section class="blok"><h2>Cara hapus</h2><p>Pencet <b>Hapus semua data saya</b> di atas. Kalau notif lagi nyala, langganannya ikut dimatiin dan dihapus dari database. Kalau lagi login, kamu juga dikeluarin dari perangkat ini (data di akun tetap, hapusnya lewat tombol di bagian akun). Bisa juga lewat pengaturan browser (hapus data situs). Kalau buka pakai mode penyamaran, datanya hilang sendiri pas jendelanya ditutup.</p></section>
  </div>`
  if (typeof gambarAkun === 'function') gambarAkun()
}
$('v-privasi').addEventListener('click', e => {
  if (e.target.closest('[data-ekspor]')) {
    const data = {}; kunciKu().forEach(k => { data[k] = bacaLS(k, null) })
    const blob = new Blob([JSON.stringify({ aplikasi: 'get a job', versi: 1, diekspor: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `get-a-job-cadangan-${hariStr()}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast('Cadangan diunduh')
  }
  const h = e.target.closest('[data-hapus-semua]')
  if (h) {
    if (!h.classList.contains('yakin')) { h.classList.add('yakin'); h.textContent = 'Yakin? Pencet lagi buat hapus permanen'; setTimeout(() => { if (document.contains(h)) { h.classList.remove('yakin'); h.textContent = 'Hapus semua data saya' } }, 5000); return }
    ;(typeof matikanNotif === 'function' ? matikanNotif() : Promise.resolve()).catch(() => { }).then(() => typeof akunKeluarLokal === 'function' ? akunKeluarLokal() : null).catch(() => { }).then(() => { kunciKu().forEach(k => { try { localStorage.removeItem(k) } catch (x) { } }); try { sessionStorage.removeItem('gaj-baru'); localStorage.removeItem('gja-meta') } catch (x) { }
    location.hash = 'loker'; location.reload() })
  }
  const y = e.target.closest('[data-impor-ya]')
  if (y) { window.__gajImpor = true; const d = $('impor-tanya')._data; kunciKu().forEach(k => { try { localStorage.removeItem(k) } catch (x) { } }); Object.entries(d).forEach(([k, v]) => { if (k.startsWith('gaj-')) simpanLS(k, v) }); location.reload() }
  if (e.target.closest('[data-impor-batal]')) $('impor-tanya').innerHTML = ''
})
$('v-privasi').addEventListener('change', e => {
  const inp = e.target.closest('[data-impor]'); if (!inp || !inp.files[0]) return
  inp.files[0].text().then(t => {
    const o = JSON.parse(t)
    if (!o || o.aplikasi !== 'get a job' || typeof o.data !== 'object') throw 0
    const n = Object.keys((o.data && o.data['gaj-lamaran']) || {}).length, box = $('impor-tanya'); box._data = o.data
    box.innerHTML = `<div class="agenda" style="margin-top:12px">Cadangan tanggal ${esc(String(o.diekspor || '').slice(0, 10))}, isinya ${n} lamaran. Data di perangkat ini bakal diganti isi cadangan. <div class="act" style="margin-top:8px"><button class="btn utama kecil" data-impor-ya>Ganti pakai cadangan</button><button class="btn garis kecil" data-impor-batal>Batal</button></div></div>`
  }).catch(() => toast('File itu bukan cadangan Get a Job'))
  inp.value = ''
})
