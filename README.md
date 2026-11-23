# Loker Fresh Graduate

Rekap lowongan fresh graduate semua jurusan di Indonesia: management trainee, graduate program, magang, dan posisi entry level.

- Halaman: https://aryaanstt.github.io/get-a-job/
- Data: `data/loker.json`. Tambah atau ubah lowongan cukup di file ini.

Tiap lowongan dicek ke sumber resmi. Yang belum ketemu sumber resminya diberi status `perlu dicek`.
Selalu cek ulang di link resmi sebelum melamar.

## Survei dan "Buat kamu"

Pengunjung baru dapet survei 4 pertanyaan (jurusan, jenis kerja, lokasi, tipe kerja). Jawabannya disimpan di localStorage perangkat itu aja, lalu tab "Buat kamu" nampilin loker yang cocok. Survei bisa diulang lewat tombol Profilku.

Pencocokannya pakai 4 field opsional di tiap loker:

| Field | Isi |
| --- | --- |
| `bidang` | Jurusan yang diterima: `semua`, `teknik`, `it`, `data`, `sains`, `bisnis`, `akuntansi`, `kesehatan`, `hukum`, `komunikasi`, `pertanian`, `sosial`. Kosong = jurusan belum disebut. |
| `jenis_kerja` | `mt`, `analis`, `teknik`, `admin`, `sales`, `riset`, atau `lainnya` |
| `tipe` | `penuh waktu`, `kontrak`, atau `magang` |
| `wilayah` | `jabodetabek`, `jabar`, `jateng`, `jatim`, `bali`, `sumatera`, `kalimantan`, `sulawesi`, `seluruh`. Kosong = lokasi belum disebut. |

Field ini diisi otomatis dari teks `untuk`, `syarat`, `program`, `jalur`, dan `lokasi` pakai aturan di `data/aturan-klasifikasi.json`:

```
python alat/isi_bidang.py          # isi loker yang belum punya field ini
python alat/isi_bidang.py --cek    # liat hasilnya aja, ga nulis file
python alat/isi_bidang.py --ulang  # hitung ulang semua (nimpa koreksi manual)
```

Field yang udah ada ga ditimpa, jadi koreksi manual aman. Kalau ada loker baru yang belum diisi, halaman ngitung sendiri pakai aturan yang sama.

## Mode tamu (data di perangkat)

Lamaranku, checklist berkas, Pilah, Kalender, target mingguan, dan ekspor/impor jalan tanpa akun. Semua disimpan di localStorage dengan awalan `gaj-` (kode di `fase1.js`), ga ada yang dikirim ke server.

## Notif loker (opsional)

`notif.js` + `sw.js` + `manifest.json`. Kalau pengguna nyalain notif, alamat langganan push dan pilihan survei disimpan di Supabase (`langganan_notif`, lewat RPC `langganan_simpan` / `langganan_hapus`). Edge Function `kirim-notif-loker` (kode di `supabase/functions/`) dipanggil abis loker.json diperbarui, pakai header `x-kunci` dari tabel `notif_kunci`. Kunci VAPID privat cuma ada di database.
