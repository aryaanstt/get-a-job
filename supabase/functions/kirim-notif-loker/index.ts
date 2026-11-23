// Kirim notif web push buat loker baru Get a Job yang cocok sama preferensi tiap pelanggan.
// POST body: {mode: "kirim"} (bawaan), {mode: "tes", endpoint}, atau {mode: "init"} (sekali, bikin kunci VAPID).
// Selain init, wajib header x-kunci = notif_kunci.kunci_panggil (cuma bisa dibaca service role).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const LOKER_URL = "https://aryaanstt.github.io/get-a-job/data/loker.json";
const SUBJEK = "https://aryaanstt.github.io/get-a-job/";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type Loker = { id: string; perusahaan: string; program: string; deadline?: string; status?: string; lokasi?: string; fresh_grad?: boolean; bidang?: string[]; jenis_kerja?: string[]; wilayah?: string[]; tipe?: string };
type Sub = { endpoint: string; p256dh: string; auth: string; bidang: string[]; jenis_kerja: string[]; wilayah: string[]; tipe: string[] };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const fmt = (d: string) => { const [, m, dd] = d.split("-").map(Number); return `${dd} ${BULAN[m - 1]}`; };
const buka = (j: Loker) => j.status !== "kemungkinan tutup" && (!j.deadline || j.deadline >= hariIni());
const ada = (a: string[] = [], b: string[] = []) => a.some((x) => b.includes(x));

// sama kayak "Cocok buat kamu" di situs, versi ketat
function cocok(s: Sub, j: Loker) {
  if (!buka(j) || j.fresh_grad === false) return false;
  const B = j.bidang || [], W = j.wilayah || [];
  if (!B.length) return false;
  if (!(B.includes("semua") || ada(s.bidang, B))) return false;
  if (s.jenis_kerja.length && !ada(s.jenis_kerja, j.jenis_kerja || [])) return false;
  if (s.wilayah.length && !s.wilayah.includes("mana") && W.length && !W.includes("seluruh") && !ada(s.wilayah, W)) return false;
  if (s.tipe.length && !s.tipe.includes(j.tipe || "penuh waktu")) return false;
  return true;
}
function isi(list: Loker[]) {
  const j = list[0];
  if (list.length === 1) return { judul: `${j.perusahaan}: ${j.program}`, isi: [j.deadline ? `Tutup ${fmt(j.deadline)}` : "Tanggal tutup belum diumumkan", j.lokasi].filter(Boolean).join(" · "), url: "#" + j.id, tag: "loker-" + j.id };
  return { judul: `${list.length} loker baru buat kamu`, isi: list.slice(0, 3).map((x) => x.perusahaan).join(", ") + (list.length > 3 ? `, dan ${list.length - 3} lagi` : ""), url: "#loker", tag: "loker-baru" };
}
async function kirim(s: Sub, payload: unknown) {
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400 });
    return "ok";
  } catch (e) {
    const kode = (e as { statusCode?: number }).statusCode;
    if (kode === 404 || kode === 410) { await db.from("langganan_notif").delete().eq("endpoint", s.endpoint); return "dihapus"; }
    console.error("gagal kirim", kode, String(e));
    return "gagal";
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "pakai POST" }, 405);
  const body = await req.json().catch(() => ({}));
  const mode = body.mode || "kirim";
  const { data: kunci } = await db.from("notif_kunci").select("*").maybeSingle();

  if (mode === "init") {
    if (kunci) return json({ vapid_publik: kunci.vapid_publik, baru: false });
    const k = webpush.generateVAPIDKeys();
    const acak = crypto.getRandomValues(new Uint8Array(32));
    const kunci_panggil = Array.from(acak, (b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await db.from("notif_kunci").insert({ id: 1, vapid_publik: k.publicKey, vapid_privat: k.privateKey, kunci_panggil });
    if (error) return json({ error: error.message }, 500);
    return json({ vapid_publik: k.publicKey, baru: true });
  }
  if (!kunci || req.headers.get("x-kunci") !== kunci.kunci_panggil) return json({ error: "ga boleh" }, 401);
  webpush.setVapidDetails(SUBJEK, kunci.vapid_publik, kunci.vapid_privat);

  if (mode === "tes") {
    const { data: s } = await db.from("langganan_notif").select("*").eq("endpoint", body.endpoint || "").maybeSingle();
    if (!s) return json({ error: "endpoint ga ketemu" }, 404);
    const hasil = await kirim(s, { judul: "Notif Get a Job udah nyala", isi: "Nanti loker baru yang cocok buat kamu muncul kayak gini.", url: "#loker", tag: "tes" });
    return json({ hasil });
  }

  const loker: Loker[] = (await (await fetch(LOKER_URL, { cache: "no-store" })).json()).loker;
  const { data: sudah } = await db.from("notif_terkirim").select("loker_id");
  const tercatat = new Set((sudah || []).map((r) => r.loker_id));
  if (!tercatat.size) {
    // pertama kali: catat semua loker yang udah ada biar ga ada yang kebanjiran notif
    await db.from("notif_terkirim").upsert(loker.map((j) => ({ loker_id: j.id })));
    return json({ awal: true, dicatat: loker.length });
  }
  const baru = loker.filter((j) => !tercatat.has(j.id));
  const hitung = { loker_baru: baru.length, pelanggan: 0, ok: 0, dihapus: 0, gagal: 0 };
  if (baru.length) {
    const { data: subs } = await db.from("langganan_notif").select("*");
    for (const s of (subs || []) as Sub[]) {
      hitung.pelanggan++;
      const c = baru.filter((j) => cocok(s, j));
      if (!c.length) continue;
      const h = await kirim(s, isi(c));
      hitung[h === "ok" ? "ok" : h === "dihapus" ? "dihapus" : "gagal"]++;
      if (h === "ok") await db.from("langganan_notif").update({ terakhir_kirim: new Date().toISOString() }).eq("endpoint", s.endpoint);
    }
    await db.from("notif_terkirim").upsert(baru.map((j) => ({ loker_id: j.id })));
  }
  return json(hitung);
});
