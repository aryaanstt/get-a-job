const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const fmt = d => { const [y, m, dd] = d.split('-').map(Number); return `${dd} ${BULAN[m - 1]} ${y}` }
const fmtPendek = d => { const [, m, dd] = d.split('-').map(Number); return `${dd} ${BULAN[m - 1]}` }
const hariIni = () => { const n = new Date(Date.now() + 7 * 3600e3); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) }
const sisa = d => { const [y, m, dd] = d.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, dd) - hariIni()) / 864e5) }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const simpanLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }
const bacaLS = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch (e) { return d } }
const $ = id => document.getElementById(id)
const ikon = {
  bulan: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  matahari: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  simpan: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  luar: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  cek: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  kiri: '<path d="M15 18l-6-6 6-6"/>',
  kanan: '<path d="M9 18l6-6-6-6"/>',
  tutup: '<path d="M6 6l12 12M18 6L6 18"/>',
}
const svg = (n, s = 18) => `<svg class="ik" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ikon[n]}</svg>`

// tema
const gelap = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches)
const pasangTema = t => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; $('tema').innerHTML = svg(gelap() ? 'matahari' : 'bulan', 20) }
pasangTema(bacaLS('gaj-tema', null))
$('tema').onclick = () => { const t = gelap() ? 'light' : 'dark'; simpanLS('gaj-tema', t); pasangTema(t) }

// pilihan survei. id-nya sama dengan data/aturan-klasifikasi.json
const OPSI = {
  bidang: [
    ['teknik', 'Teknik', 'Mesin, Elektro, Sipil, Industri, Kimia, Tambang'],
    ['it', 'IT & ilmu komputer', 'Informatika, Sistem Informasi, Ilmu Komputer'],
    ['data', 'Data & statistik', 'Statistika, Matematika, Aktuaria, Sains Data'],
    ['sains', 'Sains (MIPA)', 'Fisika, Kimia, Biologi, Geologi, Astronomi'],
    ['bisnis', 'Bisnis & manajemen', 'Manajemen, Bisnis, Ekonomi, Logistik'],
    ['akuntansi', 'Akuntansi & keuangan', 'Akuntansi, Keuangan, Perpajakan, Perbankan'],
    ['kesehatan', 'Kesehatan', 'Kedokteran, Farmasi, Keperawatan, Gizi, Kesmas'],
    ['hukum', 'Hukum', 'Ilmu Hukum'],
    ['komunikasi', 'Komunikasi & desain', 'Ilmu Komunikasi, PR, DKV, Desain'],
    ['pertanian', 'Pertanian & kehutanan', 'Pertanian, Agribisnis, Kehutanan, Perikanan, Pangan'],
    ['sosial', 'Psikologi, sosial & pendidikan', 'Psikologi, Sosiologi, HI, Pendidikan, Sastra'],
    ['lainnya', 'Lainnya', 'Jurusanku ga ada di atas'],
  ],
  jenis: [
    ['mt', 'MT & program trainee', 'Program 1 sampai 2 tahun, rotasi, jalur cepat jadi pemimpin'],
    ['analis', 'Analis & data', 'Ngolah angka, laporan, riset bisnis, risiko'],
    ['teknik', 'Teknik & operasional', 'Pabrik, tambang, site, produksi, gudang, IT'],
    ['admin', 'Admin, HR & support', 'Administrasi, HR, procurement, payroll'],
    ['sales', 'Sales, marketing & komunikasi', 'Jualan, konsultan, brand, e-commerce, PR'],
    ['riset', 'Riset & sains', 'Peneliti, scientist, riset pasar'],
  ],
  wilayah: [
    ['jabodetabek', 'Jabodetabek & Banten'], ['jabar', 'Jawa Barat'], ['jateng', 'Jawa Tengah & DIY'], ['jatim', 'Jawa Timur'],
    ['bali', 'Bali & Nusa Tenggara'], ['sumatera', 'Sumatera'], ['kalimantan', 'Kalimantan'], ['sulawesi', 'Sulawesi & Indonesia Timur'],
  ],
  tipe: [
    ['penuh waktu', 'Penuh waktu', 'Karyawan tetap atau program MT'],
    ['kontrak', 'Kontrak', 'Durasi tertentu, misal 6 sampai 12 bulan'],
    ['magang', 'Magang', 'Internship buat nambah pengalaman'],
  ],
}
const LBL = Object.fromEntries(Object.entries(OPSI).map(([k, v]) => [k, Object.fromEntries(v.map(x => [x[0], x[1]]))]))
LBL.wilayah.seluruh = 'Seluruh Indonesia'

const STATUS = {
  'terverifikasi': ['b-ok', 'Terverifikasi', 'Ketemu di situs, form, atau akun resmi perusahaan.'],
  'perlu dicek': ['b-warn', 'Perlu dicek', 'Baru ketemu di TikTok, IG info loker, atau agregator. Cek dulu ke situs resmi sebelum daftar.'],
  'kemungkinan tutup': ['b-mute', 'Kemungkinan tutup', 'Sumber bilang pendaftarannya udah lewat. Tetap dicatat buat jaga-jaga kalau dibuka lagi.'],
}
const status = j => STATUS[j.status] || STATUS['perlu dicek']
const tutup = j => j.status === 'kemungkinan tutup'
const buka = j => !tutup(j) && (!j.deadline || sisa(j.deadline) >= 0)
const terimaJurusan = (j, b) => (j.bidang || []).includes(b) || (j.bidang || []).includes('semua')

// cadangan: loker baru yang belum diisi alat/isi_bidang.py diklasifikasi di sini pakai aturan yang sama
function klasifikasi(j, A) {
  const teks = g => g.sumber.flatMap(k => { const v = j[k]; const b = Array.isArray(v) ? v.map(String) : v ? [String(v)] : []; const s = g._saring && g._saring[k]; return b.filter(x => !s || s.test(x)) }).join(' ; ')
  const cocok = (daftar, t) => daftar.filter(d => (d._re && d._re.test(t.toLowerCase())) || (d._rek && d._rek.test(t))).map(d => d.id)
  if (!j.bidang) { const t = teks(A.bidang); j.bidang = (A.bidang._semua && A.bidang._semua.test(t.toLowerCase()) ? ['semua'] : []).concat(cocok(A.bidang.daftar, t)) }
  if (!j.jenis_kerja) { const c = cocok(A.jenis_kerja.daftar, teks(A.jenis_kerja)); j.jenis_kerja = c.length ? c : ['lainnya'] }
  if (!j.tipe) j.tipe = cocok(A.tipe.daftar, teks(A.tipe))[0] || A.tipe.bawaan
  if (!j.wilayah) j.wilayah = cocok(A.wilayah.daftar, teks(A.wilayah))
}
function siapkanAturan(A) {
  const re = (p, f) => { try { return new RegExp(p, f) } catch (e) { return null } }
  ;['bidang', 'jenis_kerja', 'tipe', 'wilayah'].forEach(g => {
    A[g].daftar.forEach(d => { d._re = re(d.pola, 'i'); d._rek = d.pola_kapital ? re(d.pola_kapital, '') : null })
    A[g]._saring = Object.fromEntries(Object.entries(A[g].saring_baris || {}).map(([k, p]) => [k, re(p, 'i')]))
  })
  A.bidang._semua = re(A.bidang.semua, 'i')
  return A
}

// profil dari survei, disimpan di perangkat ini aja
let profil = bacaLS('gaj-profil', null)
let DATA = [], saring = 'buka', kat = '', jur = '', jen = ''
let mode = bacaLS('gaj-mode', null) || (profil ? 'kamu' : 'semua')
const FILTER = [['buka', 'Masih buka', buka], ['mepet', 'Tutup ≤ 7 hari', j => buka(j) && j.deadline && sisa(j.deadline) <= 7], ['fresh', 'Ramah fresh graduate', j => buka(j) && j.fresh_grad], ['ok', 'Terverifikasi', j => buka(j) && j.status === 'terverifikasi'], ['cek', 'Perlu dicek', j => buka(j) && j.status === 'perlu dicek'], ['baru', 'Baru', j => BARU.has(j.id)], ['lamar', 'Di Lamaranku', j => !!lamaranDari(j.id)], ['semua', 'Semua termasuk tutup', () => true]]

// seberapa cocok satu loker sama profil. null = jurusan ga diterima
function nilaiCocok(j, p) {
  if (!buka(j)) return null
  const B = j.bidang || [], J = j.jenis_kerja || [], W = j.wilayah || [], alasan = [], beda = []
  let s = 0, pasti = true
  if (p.jurusan !== 'lainnya' && B.includes(p.jurusan)) { s += 4; alasan.push('Jurusan ' + LBL.bidang[p.jurusan] + ' disebut') }
  else if (B.includes('semua')) { s += 2; alasan.push('Semua jurusan') }
  else if (!B.length) { pasti = false; beda.push('Jurusan belum disebut') }
  else return null
  if (p.minat.length) {
    const sama = J.filter(x => p.minat.includes(x))
    if (sama.length) { s += 3; alasan.push(LBL.jenis[sama[0]]) } else beda.push('Jenis kerja lain')
  }
  if (!p.lokasi.includes('mana')) {
    const sama = W.filter(x => p.lokasi.includes(x))
    if (sama.length) { s += 2; alasan.push(LBL.wilayah[sama[0]]) }
    else if (W.includes('seluruh')) { s += 1; alasan.push('Penempatan seluruh Indonesia') }
    else if (W.length) beda.push('Di luar lokasi pilihanmu')
  }
  if (!p.tipe.includes(j.tipe || 'penuh waktu')) beda.push(LBL.tipe[j.tipe] || j.tipe)
  if (!j.fresh_grad) s -= 2
  if (j.status === 'terverifikasi') s += .5
  return { s, alasan, beda, pas: pasti && !beda.length }
}
function daftarCocok() {
  const pas = [], mirip = []
  if (!profil) return { pas, mirip }
  DATA.forEach(j => { const c = nilaiCocok(j, profil); if (!c) return; if (c.pas) pas.push([j, c]); else if (c.beda.length <= 1) mirip.push([j, c]) })
  return { pas, mirip }
}

function stub(j) {
  if (tutup(j)) return `<small>Status</small><b style="font-size:20px">Tutup?</b>`
  if (!j.deadline) return `<small>Tutup</small><b style="font-size:15px;line-height:1.15">Belum diumumkan</b>`
  const n = sisa(j.deadline)
  if (n < 0) return `<small>Udah</small><b style="font-size:22px">tutup</b><span class="tgl">${fmtPendek(j.deadline)}</span>`
  if (n === 0) return `<small>Tutup</small><b style="font-size:22px">hari ini</b><span class="tgl">${fmtPendek(j.deadline)}</span>`
  return `<b>${n}</b><small>hari lagi</small><span class="tgl">${fmtPendek(j.deadline)}</span>`
}
function tagJurusan(j) {
  const B = j.bidang || []
  if (B.includes('semua')) return '<span class="tag bd">Semua jurusan</span>'
  if (!B.length) return ''
  const nm = B.map(b => LBL.bidang[b] || b)
  return `<span class="tag bd" title="${esc(nm.join(', '))}">${esc(nm.slice(0, 2).join(', '))}${nm.length > 2 ? ' +' + (nm.length - 2) : ''}</span>`
}
function tiket(j, c) {
  const [kls, teks, arti] = status(j), n = j.deadline ? sisa(j.deadline) : null
  const kelas = tutup(j) ? 'tutup' : n !== null && n < 0 ? 'tutup lewat' : n !== null && n <= 7 ? 'mepet' : ''
  const tags = [c ? '' : tagJurusan(j)].concat([j.kategori, j.lokasi].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`))
  if (j.tipe && j.tipe !== 'penuh waktu') tags.unshift(`<span class="tag tp">${esc(LBL.tipe[j.tipe] || j.tipe)}</span>`)
  if (!j.fresh_grad) tags.push('<span class="tag exp">Butuh pengalaman</span>')
  const lm = lamaranDari(j.id)
  if (lm) tags.unshift(`<span class="tag lm">${esc(lm.status)}</span>`)
  if (BARU.has(j.id)) tags.unshift('<span class="tag baru">Baru</span>')
  const alasan = c ? `<div class="alasan" aria-label="Kenapa cocok">${c.alasan.map(a => `<span>${svg('cek', 12)}${esc(a)}</span>`).join('')}${c.beda.map(a => `<span class="beda">${esc(a)}</span>`).join('')}</div>` : ''
  return `<article class="tiket ${kelas}" id="t-${esc(j.id)}" data-id="${esc(j.id)}">
    <div class="stub" aria-label="${j.deadline ? 'Tutup ' + fmt(j.deadline) : 'Tanggal tutup belum diumumkan'}">${stub(j)}</div>
    <div class="isi-t">
      <div class="t-atas"><div><div class="co">${esc(j.perusahaan)}</div><div class="prog">${esc(j.program)}</div></div><span class="badge ${kls}" title="${esc(arti)}"><i></i>${teks}</span></div>
      ${alasan}
      <div class="tags">${tags.join('')}</div>
      <div class="detail"><div>
        <p><b>Untuk:</b> ${esc(j.untuk)}</p>${(j.jalur || []).length ? `<p><b>Jalur:</b> ${j.jalur.map(esc).join(', ')}</p>` : ''}
        ${(j.syarat || []).length ? `<ul>${j.syarat.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        ${j.catatan ? `<p>${esc(j.catatan)}</p>` : ''}
        <p class="src">${j.deadline ? 'Tutup ' + fmt(j.deadline) + ' · ' : ''}Dicek: ${esc(j.dicek)} · Info awal: ${esc(j.sumber)}</p>
      </div></div>
      <div class="aksi"><button class="btn garis kecil" data-detail aria-expanded="false">Detail</button><a class="btn utama kecil" href="${esc(j.link)}" target="_blank" rel="noopener">Link resmi ${svg('luar', 14)}</a><button class="simpan mau" data-mau aria-pressed="${!!lm}" aria-label="${lm ? 'Ada di Lamaranku' : 'Mau daftar'}: ${esc(j.program)}" title="${lm ? 'Ada di Lamaranku' : 'Mau daftar'}">${svg('simpan', 17)}</button></div>
    </div>
  </article>`
}

const cocokCari = (j, q) => !q || (j.perusahaan + ' ' + j.program + ' ' + (j.jalur || []).join(' ') + ' ' + (j.kategori || '') + ' ' + (j.lokasi || '')).toLowerCase().includes(q)
const urutDl = j => { if (!buka(j)) return 2e9; return j.deadline ? sisa(j.deadline) : 1e9 }
function urutkan(list, u, skor) {
  return list.sort((a, b) => u === 'az' ? a.perusahaan.localeCompare(b.perusahaan)
    : u === 'baru' ? String(b.dibuka || '').localeCompare(String(a.dibuka || '')) || urutDl(a) - urutDl(b)
    : u === 'cocok' && skor ? skor(b) - skor(a) || urutDl(a) - urutDl(b)
    : urutDl(a) - urutDl(b) || (a.status === 'terverifikasi' ? -1 : 1))
}

function render() {
  const q = $('q').value.trim().toLowerCase()
  let u = $('urut').value
  document.querySelectorAll('[data-semua]').forEach(e => e.hidden = mode !== 'semua')
  $('urut').querySelector('[value="cocok"]').hidden = mode !== 'kamu'
  if (mode === 'semua' && u === 'cocok') { u = 'deadline'; $('urut').value = u }
  ;['kamu', 'semua'].forEach(m => $('tab-' + m).setAttribute('aria-selected', mode === m))
  const { pas, mirip } = daftarCocok()
  $('n-kamu').textContent = profil ? pas.length : '?'
  $('n-semua').textContent = DATA.filter(buka).length
  segarProfil()
  const g = $('grid')
  if (mode === 'kamu') {
    if (!profil) {
      g.innerHTML = `<div class="ajak"><div><b>Biar ga scroll ratusan loker</b><span class="redup">Jawab 4 pertanyaan singkat soal jurusan, minat, lokasi, dan jenis kerja. Nanti loker yang pas buat kamu dikumpulin di sini.</span></div><button class="btn utama besar" data-survei>Mulai ${svg('kanan', 18)}</button></div>`
      $('hasil-n').textContent = ''
      return
    }
    const peta = new Map(pas.concat(mirip).map(([j, c]) => [j, c]))
    const skor = j => peta.get(j).s
    const A = urutkan(pas.map(x => x[0]).filter(j => cocokCari(j, q)), u, skor)
    const B = urutkan(mirip.map(x => x[0]).filter(j => cocokCari(j, q)), u, skor)
    let h = A.length ? A.map(j => tiket(j, peta.get(j))).join('') : `<div class="kosong">${q ? 'Ga ada loker cocok yang sesuai kata kunci itu.' : 'Belum ada loker yang pas banget sama jawabanmu. Coba liat yang mirip di bawah, atau ubah jawaban.'}</div>`
    if (B.length) h += `<h3 class="sub-judul">Mungkin juga cocok <span>Beda satu hal dari jawabanmu, labelnya abu-abu</span></h3>` + B.map(j => tiket(j, peta.get(j))).join('')
    g.innerHTML = h
    $('hasil-n').textContent = `${A.length} cocok · ${B.length} mungkin juga`
    return
  }
  const f = FILTER.find(x => x[0] === saring)[2]
  const list = urutkan(DATA.filter(j => f(j) && (!kat || j.kategori === kat) && (!jur || terimaJurusan(j, jur)) && (!jen || (j.jenis_kerja || []).includes(jen)) && cocokCari(j, q)), u)
  g.innerHTML = list.length ? list.map(j => tiket(j)).join('') : `<div class="kosong">${saring === 'lamar' ? 'Belum ada. Pencet ikon penanda di tiket buat masukin ke Lamaranku.' : 'Ga ada lowongan yang cocok. Coba kata kunci atau filter lain.'}</div>`
  $('hasil-n').textContent = `${list.length} lowongan`
  hitungChip()
}
function hitungChip() { document.querySelectorAll('#filter .chip').forEach(b => { const ff = FILTER.find(x => x[0] === b.dataset.f)[2]; b.querySelector('.n').textContent = DATA.filter(ff).length }) }
function segarProfil() {
  const el = $('profil')
  el.hidden = !(mode === 'kamu' && profil)
  if (el.hidden) return
  const p = profil
  const isi = [LBL.bidang[p.jurusan]]
    .concat(p.minat.length ? p.minat.map(m => LBL.jenis[m]) : ['Semua jenis kerja'])
    .concat(p.lokasi.includes('mana') ? ['Lokasi mana aja'] : p.lokasi.map(w => LBL.wilayah[w]))
    .concat(p.tipe.map(t => LBL.tipe[t]))
  if (typeof segarNotif === 'function') segarNotif()
  el.innerHTML = `<span class="label">Profilmu</span><div class="profil-isi">${isi.map(x => `<span>${esc(x)}</span>`).join('')}</div><button class="btn garis kecil" data-survei>Ubah jawaban</button>`
}
function gantiMode(m) { mode = m; simpanLS('gaj-mode', m); if (m === 'kamu') $('urut').value = 'cocok'; render() }

function rel() {
  const H = 30, W = 1100, KIRI = 40, KANAN = 30, Y = 70
  const x = n => KIRI + n / H * (W - KIRI - KANAN)
  const item = DATA.filter(j => buka(j) && j.deadline && sisa(j.deadline) <= H).sort((a, b) => sisa(a.deadline) - sisa(b.deadline))
  const perHari = {}
  item.forEach(j => { const n = sisa(j.deadline); (perHari[n] = perHari[n] || []).push(j) })
  let tik = ''
  for (let n = 0; n <= H; n += 5) tik += `<line class="tik" x1="${x(n)}" x2="${x(n)}" y1="${Y + 12}" y2="${Y + 18}"/><text class="hari" x="${x(n)}" y="${Y + 32}" text-anchor="middle">${n === 0 ? 'hari ini' : '+' + n}</text>`
  let st = '', i = 0
  Object.entries(perHari).forEach(([n, js]) => {
    n = Number(n)
    const w = n <= 7 ? 'var(--mepet)' : 'var(--ink)'
    const atas = i++ % 2 === 0
    const nm = js[0].perusahaan.replace(/^PT\.?\s+/i, '').split(/[(,]/)[0].trim(), pendek = nm.length > 14 ? nm.slice(0, 13) + '…' : nm
    const label = js.length > 1 ? pendek + ' +' + (js.length - 1) : pendek
    st += `<g class="st" tabindex="0" role="link" data-id="${esc(js[0].id)}" aria-label="${esc(js.map(j => j.perusahaan + ' ' + j.program).join(', '))}, tutup ${fmt(js[0].deadline)}"><title>${esc(js.map(j => j.perusahaan + ': ' + j.program).join('\n'))}</title><circle cx="${x(n)}" cy="${Y}" r="8" style="stroke:${w}"/>${js.length > 1 ? `<text x="${x(n)}" y="${Y + 4}" text-anchor="middle" style="font:700 9px var(--f-kode);stroke-width:0">${js.length}</text>` : ''}<text x="${x(n)}" y="${atas ? Y - 18 : Y + 50}" text-anchor="middle">${esc(label)}</text></g>`
  })
  $('rel').innerHTML = item.length ? `<svg viewBox="0 0 ${W} 130" role="img" aria-label="Deadline lowongan 30 hari ke depan"><line class="trek" x1="${KIRI}" x2="${W - KANAN}" y1="${Y}" y2="${Y}"/>${tik}<circle class="denyut" cx="${KIRI}" cy="${Y}" r="9"/><circle class="hariini" cx="${KIRI}" cy="${Y}" r="7"/>${st}</svg>` : '<p class="redup">Ga ada deadline dalam 30 hari ke depan.</p>'
  document.querySelectorAll('#rel .st').forEach(g => { const pergi = () => loncat(g.dataset.id); g.onclick = pergi; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pergi() } } })
}
function loncat(id) {
  let el = document.getElementById('t-' + id)
  if (!el) { if (VIEWS.includes(id)) return; location.hash = 'loker'; mode = 'semua'; saring = 'semua'; kat = jur = jen = ''; $('q').value = ''; segarChip(); render(); el = document.getElementById('t-' + id) }
  if (!el) return
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  el.classList.remove('sorot'); void el.offsetWidth; el.classList.add('sorot')
}
function segarChip() {
  document.querySelectorAll('#filter .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === saring))
  $('kat').value = kat; $('jur').value = jur; $('jen').value = jen
}
function toast(t, aksi) { document.querySelectorAll('.toast').forEach(x => x.remove()); const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); const sp = document.createElement('span'); sp.textContent = t; e.append(sp); if (aksi) { const b = document.createElement('button'); b.textContent = aksi.label; b.onclick = () => { e.remove(); aksi.fn() }; e.append(b) } document.body.appendChild(e); setTimeout(() => e.remove(), aksi ? 5000 : 2400) }

// ---------- survei: satu pertanyaan per layar ----------
function bukaSurvei(dariAwal) {
  const ob = Object.assign({ jurusan: null, minat: [], lokasi: [], tipe: ['penuh waktu'] }, profil ? JSON.parse(JSON.stringify(profil)) : {})
  const el = $('survei'), balikFokus = document.activeElement
  const ubin = (v, judul, ket, on, multi, putus) => `<button class="ubin ${multi ? 'multi' : ''} ${putus ? 'putus' : ''} ${on ? 'on' : ''}" data-v="${esc(v)}" aria-pressed="${on}"><b>${esc(judul)}</b>${ket ? `<span>${esc(ket)}</span>` : ''}</button>`
  const LANGKAH = [
    { tanya: 'Kamu lulusan jurusan apa?', sub: 'Pilih rumpun yang paling deket sama jurusanmu.', sah: () => !!ob.jurusan,
      isi: () => `<div class="ubin-grid">${OPSI.bidang.map(([v, j, k]) => ubin(v, j, k, ob.jurusan === v)).join('')}</div>`,
      pilih: v => { ob.jurusan = v; return true } },
    { tanya: 'Pengen kerja di bidang apa?', sub: 'Boleh pilih lebih dari satu.', sah: () => true, multi: true,
      isi: () => `<div class="ubin-grid">${OPSI.jenis.map(([v, j, k]) => ubin(v, j, k, ob.minat.includes(v), true)).join('')}${ubin('*', 'Belum tahu', 'Tunjukin semua jenis kerja', !ob.minat.length, true, true)}</div>`,
      pilih: v => { ob.minat = v === '*' ? [] : ob.minat.includes(v) ? ob.minat.filter(x => x !== v) : ob.minat.concat(v) } },
    { tanya: 'Mau kerja di mana?', sub: 'Boleh pilih beberapa daerah.', sah: () => ob.lokasi.length > 0, multi: true,
      isi: () => `<div class="ubin-grid">${ubin('mana', 'Mana aja', 'Siap ditempatkan di seluruh Indonesia', ob.lokasi.includes('mana'), true, true)}${OPSI.wilayah.map(([v, j]) => ubin(v, j, '', ob.lokasi.includes(v), true)).join('')}</div>`,
      pilih: v => { ob.lokasi = v === 'mana' ? (ob.lokasi.includes('mana') ? [] : ['mana']) : ob.lokasi.filter(x => x !== 'mana'); if (v !== 'mana') ob.lokasi = ob.lokasi.includes(v) ? ob.lokasi.filter(x => x !== v) : ob.lokasi.concat(v) } },
    { tanya: 'Cari kerja yang kayak gimana?', sub: 'Boleh pilih lebih dari satu.', sah: () => ob.tipe.length > 0, multi: true,
      isi: () => `<div class="ubin-grid">${OPSI.tipe.map(([v, j, k]) => ubin(v, j, k, ob.tipe.includes(v), true)).join('')}</div>`,
      pilih: v => { ob.tipe = ob.tipe.includes(v) ? ob.tipe.filter(x => x !== v) : ob.tipe.concat(v) } },
  ]
  let i = profil && !dariAwal ? 0 : -1
  const tutupSurvei = () => { el.hidden = true; el.innerHTML = ''; document.body.classList.remove('terkunci'); document.removeEventListener('keydown', tombol); if (balikFokus && balikFokus.focus) balikFokus.focus() }
  const tombol = e => { if (e.key === 'Escape') { if (!profil) simpanLS('gaj-lewati', true); tutupSurvei() } }
  const lewati = `<button class="link-tombol" data-lewat>${profil ? 'Batal' : 'Lewati, liat semua loker'}</button>`
  function gambar() {
    if (i === -1) {
      el.innerHTML = `<header class="ob-atas"><span class="wm-get" aria-hidden="true"><span class="kap">get</span> <span class="aks">a</span> job<span class="aks">.</span></span></header>
        <main class="ob-isi masuk"><h1>Kenalan dulu, biar lokernya pas buat kamu.</h1><p>Ada loker buat anak teknik, kesehatan, bisnis, hukum, sampai pertanian. Biar ga kecampur, jawab dulu 4 pertanyaan singkat.</p>
        <div class="ob-jawab ob-sambut">
          <div class="poin"><i>1</i><div><b>Jurusan dan minat kerja</b><br><span class="redup kecil">Loker yang nerima jurusanmu muncul duluan.</span></div></div>
          <div class="poin"><i>2</i><div><b>Lokasi dan jenis kerja</b><br><span class="redup kecil">Penuh waktu, kontrak, atau magang, di daerah yang kamu mau.</span></div></div>
          <div class="poin"><i>${svg('cek', 18)}</i><div><b>Ga perlu daftar akun</b><br><span class="redup kecil">Jawabanmu disimpan di perangkat ini aja. Bisa diubah kapan pun lewat tombol Profilku.</span></div></div>
        </div></main>
        <footer class="ob-bawah">${lewati}<button class="btn utama besar" data-maju>Mulai ${svg('kanan', 18)}</button></footer>`
    } else if (i < LANGKAH.length) {
      const L = LANGKAH[i]
      el.innerHTML = `<header class="ob-atas"><button class="ikon-btn" data-balik aria-label="Sebelumnya" ${i === 0 && profil ? 'style="visibility:hidden"' : ''}>${svg('kiri', 20)}</button><div class="ob-ruas" aria-hidden="true">${LANGKAH.map((_, n) => `<i class="${n < i ? 'lewat' : n === i ? 'ini' : ''}"></i>`).join('')}</div><span class="kecil redup">${i + 1}/${LANGKAH.length}</span><button class="ikon-btn" data-lewat aria-label="Tutup survei">${svg('tutup', 18)}</button></header>
        <main class="ob-isi masuk"><h1 id="ob-tanya">${L.tanya}</h1><p>${L.sub}</p><div class="ob-jawab" role="group" aria-labelledby="ob-tanya">${L.isi()}</div></main>
        <footer class="ob-bawah">${lewati}<button class="btn utama besar" data-maju ${L.sah() ? '' : 'disabled'}>${i === LANGKAH.length - 1 ? 'Liat hasilnya' : 'Lanjut'} ${svg('kanan', 18)}</button></footer>`
      el.querySelectorAll('.ubin').forEach(b => b.onclick = () => {
        const lanjut = L.pilih(b.dataset.v)
        if (!L.multi) { el.querySelectorAll('.ubin').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b) }) }
        else { const ob2 = el.querySelector('.ob-jawab'); ob2.innerHTML = L.isi(); pasangUbin() }
        el.querySelector('[data-maju]').disabled = !L.sah()
        if (lanjut) setTimeout(maju, 220)
      })
      function pasangUbin() { el.querySelectorAll('.ubin').forEach(b => b.onclick = () => { L.pilih(b.dataset.v); el.querySelector('.ob-jawab').innerHTML = L.isi(); pasangUbin(); el.querySelector('[data-maju]').disabled = !L.sah(); const f = el.querySelector(`.ubin[data-v="${CSS.escape(b.dataset.v)}"]`); if (f) f.focus() }) }
      if (L.multi) pasangUbin()
    } else {
      const { pas, mirip } = daftarCocok()
      const top = urutkan(pas.map(x => x[0]), 'cocok', j => pas.find(x => x[0] === j)[1].s).slice(0, 3)
      el.innerHTML = `<header class="ob-atas"><span class="wm-get" aria-hidden="true"><span class="kap">get</span> <span class="aks">a</span> job<span class="aks">.</span></span></header>
        <main class="ob-isi masuk"><span class="label">Hasilnya</span><div class="ungkap-angka" style="margin-top:12px">${pas.length}</div><h1 style="margin-top:6px">${pas.length ? 'loker cocok buat kamu.' : 'loker yang pas banget, untuk sekarang.'}</h1>
        <p>${pas.length ? `Plus ${mirip.length} lagi yang mungkin juga cocok. Loker baru dicek tiap hari, jadi balik lagi ya.` : `Tapi ada ${mirip.length} yang mirip. Loker baru dicek tiap hari, coba balik lagi atau longgarin jawabanmu.`}</p>
        ${top.length ? `<div class="ungkap-list">${top.map(j => `<div><span><small>${esc(j.perusahaan)}</small><b>${esc(j.program)}</b></span><span class="hr">${j.deadline ? sisa(j.deadline) + ' hari lagi' : 'Tanggal belum ada'}</span></div>`).join('')}</div>` : ''}
        </main>
        <footer class="ob-bawah"><button class="link-tombol" data-balik>Ubah jawaban</button><button class="btn utama besar" data-selesai>Liat loker buat kamu ${svg('kanan', 18)}</button></footer>`
    }
    const m = el.querySelector('[data-maju]'); if (m) m.onclick = maju
    const b = el.querySelector('[data-balik]'); if (b) b.onclick = () => { i = i >= LANGKAH.length ? LANGKAH.length - 1 : Math.max(profil ? 0 : -1, i - 1); gambar() }
    el.querySelectorAll('[data-lewat]').forEach(x => x.onclick = () => { if (!profil) simpanLS('gaj-lewati', true); tutupSurvei() })
    const s = el.querySelector('[data-selesai]'); if (s) s.onclick = () => { tutupSurvei(); gantiMode('kamu'); scrollTo({ top: $('tab-kamu').getBoundingClientRect().top + scrollY - 12, behavior: 'smooth' }) }
    el.scrollTop = 0
    const f = el.querySelector('.ubin.on, .ubin, [data-maju], [data-selesai]'); if (f) f.focus({ preventScroll: true })
  }
  function maju() {
    if (i >= 0 && !LANGKAH[i].sah()) return
    i++
    if (i === LANGKAH.length) { profil = { jurusan: ob.jurusan, minat: ob.minat, lokasi: ob.lokasi, tipe: ob.tipe, tgl: new Date().toISOString().slice(0, 10) }; simpanLS('gaj-profil', profil); render(); if (typeof notifPerbarui === 'function') notifPerbarui() }
    gambar()
  }
  el.hidden = false; document.body.classList.add('terkunci'); document.addEventListener('keydown', tombol)
  gambar()
}

function mulai(d, aturan) {
  DATA = d.loker
  if (aturan && DATA.some(j => !j.bidang || !j.jenis_kerja || !j.tipe || !j.wilayah)) { const A = siapkanAturan(aturan); DATA.forEach(j => klasifikasi(j, A)) }
  $('diperbarui').textContent = 'Diperbarui ' + fmt(d.diperbarui)
  $('s-buka').textContent = DATA.filter(buka).length
  $('s-mepet').textContent = DATA.filter(j => buka(j) && j.deadline && sisa(j.deadline) <= 7).length
  $('s-ok').textContent = DATA.filter(j => buka(j) && j.status === 'terverifikasi').length
  $('filter').innerHTML = FILTER.map(([k, n]) => `<button class="chip" data-f="${k}" aria-pressed="false">${n} <span class="n"></span></button>`).join('')
  const B = DATA.filter(buka)
  const kats = [...new Set(B.map(j => j.kategori).filter(Boolean))].sort()
  $('kat').insertAdjacentHTML('beforeend', kats.map(k => `<option>${esc(k)}</option>`).join(''))
  $('jur').insertAdjacentHTML('beforeend', OPSI.bidang.filter(x => x[0] !== 'lainnya').map(([v, l]) => `<option value="${v}">${esc(l)} (${B.filter(j => terimaJurusan(j, v)).length})</option>`).join(''))
  $('jen').insertAdjacentHTML('beforeend', OPSI.jenis.map(([v, l]) => `<option value="${v}">${esc(l)} (${B.filter(j => (j.jenis_kerja || []).includes(v)).length})</option>`).join(''))
  document.querySelectorAll('#filter .chip').forEach(b => b.onclick = () => { saring = b.dataset.f; segarChip(); render() })
  $('kat').onchange = e => { kat = e.target.value; render() }
  $('jur').onchange = e => { jur = e.target.value; render() }
  $('jen').onchange = e => { jen = e.target.value; render() }
  if (mode === 'kamu') $('urut').value = 'cocok'
  siapkanBaru(); segarChip(); rel(); render(); arahkan()
  const h = location.hash.slice(1)
  if (h && !VIEWS.includes(h)) setTimeout(() => loncat(h), 100)
  else if (!profil && !bacaLS('gaj-lewati', false)) bukaSurvei(true)
}

const ambil = u => fetch(u, { cache: 'no-store' }).then(r => { if (!r.ok) throw r; return r.json() })
Promise.all([ambil('data/loker.json'), ambil('data/aturan-klasifikasi.json').catch(() => null)]).then(([d, a]) => mulai(d, a)).catch(() => {
  $('grid').innerHTML = '<div class="kosong">Data gagal dimuat. Coba muat ulang halaman.</div>'
  $('diperbarui').textContent = 'Gagal memuat'
})
$('q').addEventListener('input', render)
$('urut').addEventListener('change', render)
$('buka-survei').onclick = () => bukaSurvei(!profil)
document.querySelectorAll('.tab-seg button').forEach(b => b.onclick = () => gantiMode(b.dataset.mode))
document.addEventListener('click', e => { if (e.target.closest('[data-survei]')) bukaSurvei(!profil) })
$('grid').addEventListener('click', e => {
  const d = e.target.closest('[data-detail]')
  if (d) { const t = d.closest('.tiket'), on = t.classList.toggle('buka'); d.textContent = on ? 'Tutup' : 'Detail'; d.setAttribute('aria-expanded', on); return }
  const m = e.target.closest('[data-mau]')
  if (m) togelMau(m.closest('.tiket').dataset.id)
})
