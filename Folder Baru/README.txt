KW LEARNING — ARENA MATEMATIKA
VERSI PERBAIKAN

Fitur yang sudah diperbaiki:
1. Pilihan "Semua Bab — Soal Random".
2. Semua bank soal dari folder /soal digabung dan diacak.
3. ID soal dibuat unik antar-bab agar tidak terjadi bentrok/pengulangan.
4. Bab asal soal tetap tersedia pada data soal dan ditampilkan pada badge.
5. Mode "Lanjut Otomatis Jika Benar" di Pengaturan Arena.
   - ON: benar langsung ke soal berikutnya.
   - ON: salah tidak dihitung selesai, giliran berpindah dan roda diputar lagi.
   - OFF: perilaku awal tetap dipakai.
6. Konfirmasi Reset dan Ganti Bab/Tim/Waktu memakai modal custom, bukan confirm() browser.
7. Toast tetap dapat dipakai setelah modal konfirmasi ditutup.
8. Pesan "Belum pilih jawaban" tetap menggunakan showToast().
9. Tombol pengaturan disusun vertikal: Ganti Bab/Tim/Waktu, Reset Permainan, lalu Simpan.

STRUKTUR FOLDER YANG DIBUTUHKAN:
index.html
style.css
script.js
soal/
  aljabar.html
  statistika.html
  geometri.html

Jalankan dengan Live Server atau local server. Jangan membuka index.html langsung dengan file:// karena fetch() ke folder /soal dapat diblokir browser.


Pembaruan:
- Mode awal "Lanjut Otomatis Jika Benar" tersedia langsung di halaman setup.
- Pilihan mode awal disimpan di localStorage dan tetap sinkron dengan Pengaturan Arena.
- Tombol ↩️ SELESAI tersedia di halaman setup untuk mencoba menutup aplikasi/tab.
