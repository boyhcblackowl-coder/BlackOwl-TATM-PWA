# Black Owl — TA & TM Workspace PWA
Installable Project Hub yang tampil seperti INSPIRE, tanpa halaman login tersendiri.

## URL
Setelah GitHub Pages diaktifkan:
https://boyhcblackowl-coder.github.io/BlackOwl-TATM-PWA/

Install check:
https://boyhcblackowl-coder.github.io/BlackOwl-TATM-PWA/install-check.html

## Aktifkan Pages
Repository Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save.

## Isi
- Home dan Project Hub: 10 shortcut tools TA & TM
- Talent Acquisition, Employer Branding, People Culture: Looker Studio
- Program Planner dan Weekly MoM: mengarahkan ke backend Apps Script yang sudah ada
- Manifest, ikon, splash screen, service worker offline shell
- Mendukung Chrome Android Add to Home Screen/Install app dan desktop

## Batasan
Tidak ada login tambahan di PWA. Akses ke Google/Asana mengikuti hak akses masing-masing sistem.
GitHub Pages hanya host frontend static, **bukan** menggantikan Apps Script atau menyimpan data HR.
Karena repository ini public, jangan memasukkan token Asana, password, API secrets, atau data personal karyawan ke sini.


## Update: Live Overview & Floating Team Chat
- Buka menu **Live Dashboard** atau lihat preview Looker Studio langsung di **Project Team TA & TM**.
- Tiga report tersedia: Talent Acquisition, Employer Branding, People Culture. Source data tetap mengikuti Looker Studio, bukan API KPI native.
- Tombol **Team Chat** tersedia di kanan bawah desktop dan di atas mobile bottom navigation.
- Untuk mengaktifkan chat bersama antar-anggota (bukan sekadar popup UI), deploy Apps Script baru menggunakan `chat-backend/Code.gs` dan `chat-backend/Index.html`. Ikuti [panduan setup Team Chat](./chat-backend/SETUP.md).
- Setelah memperoleh URL chat backend, isikan `chatUrl` pada `config.js`.
- Google Apps Script di iframe pihak ketiga dapat diblokir; gunakan tombol **Buka Chat** sebagai fallback.
- Jangan membuat publik spreadsheet Team Chat. Pengguna perlu akun Google terdaftar pada allowlist.
