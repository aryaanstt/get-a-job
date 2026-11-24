// Menu Notif: kumpulan kabar sejak terakhir buka. Dihitung di perangkat ini dari data yang udah ada, ga ada yang dikirim ke server.
// Jenis kabar: loker baru (berapa yang cocok sama survei), tenggat lamaran Mau daftar, status lamaran berubah dari luar
// (sinkron akun atau update dari Jobseeker), dan loker bernilai 4 ke atas (cuma kalau ada nilai pribadi).
const KABAR_MAKS = 80
const IKON_KABAR = {
  loker: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  tenggat: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  status: '<path d="M4 12l5 5L20 6"/>',
  nilai: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
}
const snapRiw = () => Object.fromEntries(Object.entries(LM).map(([id, l]) => [id, (l.riwayat || []).length]))
const nilaiTinggi = () => NILAI && NILAI.isi ? Object.entries(NILAI.isi).filter(([, v]) => v.n >= 4 && !v.g).map(([id]) => id) : []
const namaLoker = id => { const j = lokerDari(id); return [j.perusahaan, j.program].filter(Boolean).join(', ') || id }
let kabarSiap = false

function kabarSegar() {
  if (!DATA.length) return
  const sekarang = new Date().toISOString(), idsNow = DATA.map(j => j.id)
  let K = bacaLS('gaj-kabar', null), awal = false
  if (!K || !K.lihat) {
    awal = true
    K = { item: [], dibaca: null, lihat: { loker: idsNow.filter(i => !BARU.has(i)), riw: snapRiw(), nilai: nilaiTinggi() } }
  }
  const tambah = it => { if (!K.item.some(x => x.id === it.id)) K.item.unshift(Object.assign({ waktu: sekarang }, it)) }

  // 1. loker baru sejak terakhir dicek
  const lihat = new Set(K.lihat.loker)
  const baru = DATA.filter(j => !lihat.has(j.id) && buka(j))
  if (baru.length) {
    const cocok = profil ? baru.filter(j => { const c = nilaiCocok(j, profil); return c && c.pas }) : []
    tambah({ id: 'loker-' + sekarang, jenis: 'loker', judul: baru.length + ' loker baru masuk',
      isi: profil ? (cocok.length ? cocok.length + ' cocok sama jawaban survei kamu' : 'Belum ada yang pas sama survei kamu, tapi bisa jadi ada yang mirip') : 'Isi survei biar keliatan mana yang cocok buat kamu',
      ids: (cocok.length ? cocok : baru).slice(0, 6).map(j => j.id), lebih: Math.max(0, (cocok.length || baru.length) - 6) })
  }
  K.lihat.loker = idsNow

  // 2. tenggat lamaran yang masih Mau daftar (hari ini, besok, 3 hari lagi)
  for (const [id, l] of Object.entries(LM)) {
    if (l.status !== 'Mau daftar') continue
    const dl = (DATA.find(j => j.id === id) || {}).deadline || (l.snap || {}).deadline
    if (!dl) continue
    const n = sisa(dl)
    if (n < 0 || n > 3) continue
    const tahap = n <= 1 ? n : 3
    tambah({ id: `tenggat-${id}-${dl}-${tahap}`, jenis: 'tenggat', judul: `${namaLoker(id)} tutup ${teksSisa(n)}`,
      isi: 'Ada di Lamaranku dengan status Mau daftar. Cek dulu tanggal pastinya di link resmi.', ids: [id], ke: 'lamaran' })
  }

  // 3. lamaran baru atau status berubah dari luar perangkat ini (sinkron akun, update dari email)
  if (!awal) {
    for (const [id, l] of Object.entries(LM)) {
      const n = (l.riwayat || []).length, lama = K.lihat.riw[id]
      if (lama === undefined) {
        tambah({ id: `lamaran-${id}`, jenis: 'status', judul: `Masuk Lamaranku: ${namaLoker(id)}`, isi: `Status ${l.status}. Ditambahin dari perangkat atau akun kamu yang lain.`, ids: [id], ke: 'lamaran' })
      } else if (n > lama) {
        const baruR = (l.riwayat || []).slice(lama), akhir = [...baruR].reverse().find(r => r.status) || baruR[baruR.length - 1]
        tambah({ id: `status-${id}-${n}`, jenis: 'status', judul: `${namaLoker(id)}: ${akhir.status || 'ada kabar'}`, isi: akhir.catatan || 'Status lamaran kamu berubah.', ids: [id], ke: 'lamaran' })
      }
    }
  }
  K.lihat.riw = snapRiw()

  // 4. loker bernilai 4 ke atas (nilai pribadi, cuma ada kalau pemilik akun ngimpor penilaiannya)
  const tinggi = nilaiTinggi(), lihatN = new Set(K.lihat.nilai || [])
  const nBaru = tinggi.filter(id => !lihatN.has(id) && DATA.some(j => j.id === id && buka(j)))
  if (nBaru.length && !awal) tambah({ id: 'nilai-' + sekarang, jenis: 'nilai', judul: nBaru.length === 1 ? `Nilai ${NILAI.isi[nBaru[0]].n} buat kamu: ${namaLoker(nBaru[0])}` : `${nBaru.length} loker bernilai 4 ke atas buat kamu`, isi: 'Dari penilaian pribadi kamu. Liat alasannya di Detail.', ids: nBaru.slice(0, 6) })
  K.lihat.nilai = tinggi

  K.item = K.item.slice(0, KABAR_MAKS)
  simpanLS('gaj-kabar', K)
  kabarSiap = true
  if (typeof navBadge === 'function') navBadge()
}

// Perubahan yang kamu bikin sendiri di perangkat ini ga perlu dikabarin balik.
window.kabarUbah = k => {
  if (k !== 'gaj-lamaran') return
  const K = bacaLS('gaj-kabar', null); if (!K || !K.lihat) return
  K.lihat.riw = snapRiw()
  try { localStorage.setItem('gaj-kabar', JSON.stringify(K)) } catch (e) { }
}

const belumDibaca = () => { const K = bacaLS('gaj-kabar', null); if (!K) return 0; return K.item.filter(x => !K.dibaca || x.waktu > K.dibaca).length }
const jamKabar = iso => {
  const d = new Date(iso), m = Math.round((Date.now() - d) / 60000)
  if (m < 1) return 'barusan'
  if (m < 60) return m + ' menit lalu'
  if (m < 24 * 60) return Math.round(m / 60) + ' jam lalu'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
const hariKabar = iso => { const t = new Date(iso), h = new Date(); const s = Math.round((new Date(h.toDateString()) - new Date(t.toDateString())) / 864e5); return s === 0 ? 'Hari ini' : s === 1 ? 'Kemarin' : t.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) }

function halamanNotif() {
  if (!kabarSiap) kabarSegar()
  const K = bacaLS('gaj-kabar', null) || { item: [] }, batas = K.dibaca
  let isi = ''
  if (!K.item.length) isi = `<div class="kabar-kosong"><b>Belum ada kabar</b><span>Loker baru, tenggat lamaran, dan perubahan status lamaranmu bakal muncul di sini. Balik lagi besok pagi.</span></div>`
  else {
    let hariLalu = ''
    isi = K.item.map(x => {
      const h = hariKabar(x.waktu), judulHari = h !== hariLalu ? `<h2 class="kabar-hari">${h}</h2>` : ''
      hariLalu = h
      const baru = !batas || x.waktu > batas
      const daftar = (x.ids || []).map(id => `<button class="kabar-loker" data-kabar-ke="${x.ke || 'loker'}" data-kabar-id="${esc(id)}">${esc(namaLoker(id))}${svg('kanan', 14)}</button>`).join('')
      return `${judulHari}<article class="kabar ${baru ? 'baru' : ''} j-${x.jenis}"><span class="kabar-ikon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IKON_KABAR[x.jenis] || IKON_KABAR.loker}</svg></span>
        <div class="kabar-isi"><div class="kabar-atas"><b>${esc(x.judul)}</b><span class="kabar-jam">${baru ? '<i class="titik-baru" aria-label="Baru"></i>' : ''}${jamKabar(x.waktu)}</span></div><p>${esc(x.isi || '')}</p>${daftar ? `<div class="kabar-daftar">${daftar}${x.lebih ? `<span class="redup kecil">+${x.lebih} lagi di tab Loker</span>` : ''}</div>` : ''}</div></article>`
    }).join('')
  }
  $('v-notif').innerHTML = `<div class="kepala-hal"><span class="label">Notif</span><h1>Kabar buat kamu.</h1><p>Semua yang kejadian sejak terakhir kamu buka: loker baru, tenggat yang mepet, dan perubahan status lamaran.</p></div>
    <div class="kabar-alat"><span class="kecil redup">${belumDibaca() ? belumDibaca() + ' belum dibaca' : 'Semua udah dibaca'}</span><a class="btn garis kecil" href="#privasi">Atur notif HP</a></div>
    <div class="kabar-list">${isi}</div>`
  // dibuka = dibaca. Titik "baru" tetap keliatan di kunjungan ini, ilang di kunjungan berikutnya.
  if (K.item.length) { K.dibaca = new Date().toISOString(); simpanLS('gaj-kabar', K) }
  document.querySelectorAll('a[data-v="notif"] .bdg').forEach(b => { b.hidden = true })
}
$('v-notif').addEventListener('click', e => {
  const b = e.target.closest('[data-kabar-id]'); if (!b) return
  const id = b.dataset.kabarId
  if (b.dataset.kabarKe === 'lamaran') { location.hash = 'lamaran'; return }
  location.hash = 'loker'; setTimeout(() => loncat(id), 60)
})
