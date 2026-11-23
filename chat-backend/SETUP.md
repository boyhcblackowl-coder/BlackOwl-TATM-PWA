# Black Owl — TA & TM Team Chat Setup

Mini chat pada PWA sudah terpasang. Agar anggota tim benar-benar bisa mengirim dan membaca pesan bersama, lakukan aktivasi backend berikut.

## 1. Buat backend Google Apps Script baru
1. Buka https://script.google.com/home/projects/create dan buat project **Black Owl — TA & TM Team Chat**.
2. Salin isi `chat-backend/Code.gs` ke file Code.gs di project baru.
3. Tambahkan file HTML bernama **Index** dan salin isi `chat-backend/Index.html`.
4. Simpan, lalu jalankan fungsi `setupTeamChat()` satu kali.
5. Dari Execution log, buka Google Sheet yang dibuat. Berikan akses **Editor** ke seluruh anggota tim yang boleh menggunakan chat.

## 2. Atur daftar akun Google yang boleh mengakses
Di Apps Script, buka **Project Settings → Script properties → Add script property**:
- Property: `BO_CHAT_ALLOWED_EMAILS`
- Value: daftar email Google anggota tim, pisahkan dengan koma, tanpa tanda kurung atau tanda kutip.

Secara default tidak ada email yang diizinkan sampai Anda mengisi daftar ini. Jangan menaruh daftar akun tersebut di kode frontend publik.

## 3. Deploy backend chat
1. Pilih **Deploy → New deployment → Web app**.
2. **Execute as:** `User accessing the web app`.
3. **Who has access:** `Anyone within your organization` jika tim berada di Google Workspace yang sama. Jika berbeda domain, pilih pengaturan Google-account yang sesuai, **tetapi jangan hapus allowlist**.
4. Deploy, izinkan akses Google, dan salin URL `/exec` backend baru.
5. Tiap anggota tim juga perlu memberikan otorisasi Apps Script dan akses ke spreadsheet, sekali pada penggunaan pertama.

## 4. Hubungkan ke PWA GitHub
1. Di repository BlackOwl-TATM-PWA buka file `config.js`.
2. Ganti property `chatUrl` yang masih kosong menjadi URL `/exec` chat yang baru, contohnya:

    `"chatUrl": "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",`

3. Simpan dengan commit.
4. Refresh PWA di Chrome. Klik tombol **Team Chat** di kanan bawah. Jika Google memblokir iframe lintas domain, gunakan tombol **Buka Chat ↗**.

## 5. Cara menguji
- Buka PWA dengan akun anggota pertama, kirim pesan tes.
- Buka PWA dengan akun anggota kedua yang sudah diberikan izin, kemudian buka chat.
- Pesan seharusnya muncul ketika chat polling (sekitar 8–15 detik).
- Coba akun yang tidak ada pada BO_CHAT_ALLOWED_EMAILS untuk memastikan ditolak.

## Batasan penting
- Ini chat tim berbasis satu ruang diskusi umum, belum tersedia direct message 1:1, image/video upload, online presence, read receipts, push notification atau enkripsi end-to-end.
- Pemutakhiran memakai polling 8 detik, bukan WebSocket real-time.
- Google Sheets tidak cocok untuk trafik chat besar dan semua Editor dapat mengubah isi spreadsheet secara langsung.
- Browser tertentu membatasi Apps Script di dalam iframe eksternal. Tautan Buka Chat merupakan fallback yang tetap aman.
- GitHub Pages repository ini publik. Jangan simpan data pribadi karyawan, token, API key rahasia, atau pesan di dalam file source repository.
- Untuk chat enterprise penuh seperti LinkedIn/Messenger, pertimbangkan backend terautentikasi (Google Identity + Cloudflare Worker/D1 atau Firebase), bukan browser-only storage.