// Notif web opsional. Yang dikirim ke server cuma alamat langganan push dari browser + pilihan survei.
const NOTIF = {
  url: 'https://wtfshyfgcrglknogjgfb.supabase.co/rest/v1/rpc/',
  kunci: 'sb_publishable_-vUvZe04JtPTTGfF6LEY6A_y0l1n_Ff',
  vapid: 'BJRnkwAP7TjvDPM7_LZ-7eoX--LrtVtdsan2SD9Ju6IyuiHQcpmA4yGO63P_ZOTOjh8SRF3Yowha5b0i18STkBw',
}
const keUint8 = b => { const p = '='.repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)) }
const rpc = (fn, body) => fetch(NOTIF.url + fn, { method: 'POST', headers: { apikey: NOTIF.kunci, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error('rpc ' + r.status) })
const iOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const terpasang = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const bisaPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && isSecureContext
let notifSibuk = false

async function langgananSekarang() {
  if (!bisaPush()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return reg ? reg.pushManager.getSubscription() : null
}
async function keadaanNotif() {
  if (!bisaPush()) return iOS() && !terpasang() ? 'ios' : 'ga-bisa'
  if (Notification.permission === 'denied') return 'diblok'
  const sub = await langgananSekarang()
  return sub && Notification.permission === 'granted' ? 'nyala' : 'mati'
}
const prefDariProfil = () => profil ? { p_bidang: [profil.jurusan], p_jenis_kerja: profil.minat, p_wilayah: profil.lokasi, p_tipe: profil.tipe } : {}
async function simpanLangganan(sub) {
  const k = sub.toJSON().keys
  await rpc('langganan_simpan', Object.assign({ p_endpoint: sub.endpoint, p_p256dh: k.p256dh, p_auth: k.auth }, prefDariProfil()))
}
async function nyalakanNotif() {
  if (!profil) { toast('Isi survei dulu biar notifnya cuma loker yang cocok'); bukaSurvei(true); return }
  const izin = await Notification.requestPermission()
  if (izin !== 'granted') { toast(izin === 'denied' ? 'Notif diblok browser' : 'Notif belum diizinkan'); return }
  const reg = await navigator.serviceWorker.register('sw.js')
  await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keUint8(NOTIF.vapid) }))
  await simpanLangganan(sub)
  simpanLS('gaj-notif', { sejak: hariStr() })
  toast('Notif nyala. Loker baru yang cocok bakal dikabarin.')
}
async function matikanNotif() {
  const sub = await langgananSekarang()
  if (sub) { await rpc('langganan_hapus', { p_endpoint: sub.endpoint }).catch(() => { }); await sub.unsubscribe().catch(() => { }) }
  try { localStorage.removeItem('gaj-notif') } catch (e) { }
}
// survei diubah: preferensi di server ikut diperbarui
async function notifPerbarui() { try { const sub = await langgananSekarang(); if (sub) await simpanLangganan(sub) } catch (e) { } }

const LANGKAH_IOS = `<ol class="ios-langkah"><li>Buka situs ini di <b>Safari</b>.</li><li>Pencet tombol <b>Bagikan</b> (kotak dengan panah ke atas).</li><li>Pilih <b>Tambah ke Layar Utama</b>, terus <b>Tambah</b>.</li><li>Buka get a job dari ikon di Layar Utama, terus nyalain notif dari situ.</li></ol><p class="redup kecil">Butuh iOS atau iPadOS 16.4 ke atas.</p>`
function htmlNotif(st, ringkas) {
  if (st === 'nyala') return `<div class="notif-baris"><span class="lonceng on">${svg('lonceng', 18)}</span><div><b>Notif loker nyala</b><span>Loker baru yang cocok sama survei kamu bakal dikabarin.</span></div><button class="btn garis kecil" data-notif="mati">Matiin</button></div>`
  if (st === 'mati') return `<div class="notif-baris"><span class="lonceng">${svg('lonceng', 18)}</span><div><b>Kabarin aku kalau ada loker baru yang cocok</b><span>Opsional. Bisa dimatiin kapan aja.${ringkas ? ' <a href="#privasi">Apa yang disimpan?</a>' : ''}</span></div><button class="btn utama kecil" data-notif="nyala">Nyalain notif</button></div>`
  if (st === 'diblok') return `<div class="notif-baris"><span class="lonceng">${svg('lonceng', 18)}</span><div><b>Notif diblok di browser ini</b><span>Buka pengaturan situs di browser, izinkan notifikasi, terus muat ulang halaman ini.</span></div></div>`
  if (st === 'ios') return `<div class="notif-baris"><span class="lonceng">${svg('lonceng', 18)}</span><div><b>Di iPhone, pasang ke Layar Utama dulu</b><span>Notif di iPhone cuma jalan kalau get a job dibuka dari ikon di Layar Utama.</span></div></div><details class="lipat" style="margin-top:8px"><summary>Caranya</summary>${LANGKAH_IOS}</details>`
  return ringkas ? '' : `<div class="notif-baris"><span class="lonceng">${svg('lonceng', 18)}</span><div><b>Browser ini belum bisa nerima notif</b><span>Coba Chrome, Edge, Firefox, atau Samsung Internet.</span></div></div>`
}
async function segarNotif() {
  const st = await keadaanNotif().catch(() => 'ga-bisa')
  const mini = $('notif-mini')
  if (mini) { const tampil = view === 'loker' && mode === 'kamu' && profil && !bacaLS('gaj-notif-tutup', false) && st !== 'ga-bisa'; mini.hidden = !tampil; if (tampil) mini.innerHTML = htmlNotif(st, true) + (st === 'nyala' ? '' : `<button class="ikon-btn tutup-mini" data-notif="tutup" aria-label="Sembunyiin">${svg('tutup', 16)}</button>`) }
  const b = $('notif-kendali'); if (b) b.innerHTML = htmlNotif(st, false)
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-notif]'); if (!b || notifSibuk) return
  const a = b.dataset.notif
  if (a === 'tutup') { simpanLS('gaj-notif-tutup', true); segarNotif(); return }
  notifSibuk = true; b.disabled = true
  try { if (a === 'nyala') await nyalakanNotif(); else { await matikanNotif(); toast('Notif dimatiin, langganan dihapus') } }
  catch (err) { console.error(err); toast('Gagal ngatur notif. Coba lagi bentar.') }
  notifSibuk = false; segarNotif()
})
ikon.lonceng = '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'
