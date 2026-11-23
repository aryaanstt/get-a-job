"""Isi otomatis field bidang, jenis_kerja, tipe, dan wilayah di data/loker.json.

Aturannya di data/aturan-klasifikasi.json (dipakai juga oleh index.html sebagai cadangan).
Field yang udah ada ga ditimpa, jadi koreksi manual aman. Pakai --ulang buat hitung ulang semuanya.

    python alat/isi_bidang.py            # isi yang kosong aja
    python alat/isi_bidang.py --ulang    # hitung ulang semua loker
    python alat/isi_bidang.py --cek      # cuma tampilin hasil, ga nulis file

Bisa juga di-import: from isi_bidang import muat_aturan, klasifikasi
"""
import json
import re
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
DATA = AKAR / "data" / "loker.json"
ATURAN = AKAR / "data" / "aturan-klasifikasi.json"
FIELD = ("bidang", "jenis_kerja", "tipe", "wilayah")


def muat_aturan(path=ATURAN):
    a = json.loads(Path(path).read_text(encoding="utf-8"))
    for grup in ("bidang", "jenis_kerja", "tipe", "wilayah"):
        for d in a[grup]["daftar"]:
            d["_re"] = re.compile(d["pola"], re.I)
            d["_rek"] = re.compile(d["pola_kapital"]) if d.get("pola_kapital") else None
    a["bidang"]["_semua"] = re.compile(a["bidang"]["semua"], re.I)
    for grup in ("bidang", "jenis_kerja", "tipe", "wilayah"):
        a[grup]["_saring"] = {k: re.compile(p, re.I) for k, p in a[grup].get("saring_baris", {}).items()}
    return a


def _teks(j, grup):
    bagian = []
    for k in grup["sumber"]:
        v = j.get(k)
        baris = [str(x) for x in v] if isinstance(v, list) else [str(v)] if v else []
        s = grup.get("_saring", {}).get(k)
        bagian.extend(b for b in baris if not s or s.search(b))
    return " ; ".join(bagian)


def _cocok(daftar, teks):
    kecil = teks.lower()
    return [d["id"] for d in daftar if d["_re"].search(kecil) or (d["_rek"] and d["_rek"].search(teks))]


def klasifikasi(j, a):
    """Balikin dict field baru buat satu loker."""
    tb = _teks(j, a["bidang"])
    bidang = _cocok(a["bidang"]["daftar"], tb)
    if a["bidang"]["_semua"].search(tb.lower()):
        bidang = ["semua"] + bidang
    jenis = _cocok(a["jenis_kerja"]["daftar"], _teks(j, a["jenis_kerja"])) or ["lainnya"]
    tipe = (_cocok(a["tipe"]["daftar"], _teks(j, a["tipe"])) or [a["tipe"]["bawaan"]])[0]
    wilayah = _cocok(a["wilayah"]["daftar"], _teks(j, a["wilayah"]))
    return {"bidang": bidang, "jenis_kerja": jenis, "tipe": tipe, "wilayah": wilayah}


def isi(loker, a, ulang=False):
    n = 0
    for j in loker:
        hasil = klasifikasi(j, a)
        for k in FIELD:
            if ulang or k not in j:
                if j.get(k) != hasil[k]:
                    n += 1
                j[k] = hasil[k]
    return n


def main():
    ulang, cek = "--ulang" in sys.argv, "--cek" in sys.argv
    a = muat_aturan()
    d = json.loads(DATA.read_text(encoding="utf-8"))
    if cek:
        for j in d["loker"]:
            h = klasifikasi(j, a)
            print(f"{j['id']:<45} bidang={','.join(h['bidang']) or '-'} | jenis={','.join(h['jenis_kerja'])} | {h['tipe']} | wilayah={','.join(h['wilayah']) or '-'}")
        return
    n = isi(d["loker"], a, ulang)
    DATA.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(d['loker'])} loker dicek, {n} field diisi atau diubah.")


if __name__ == "__main__":
    main()
