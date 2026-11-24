# Aktifkan Live Dashboard Native — Black Owl TA & TM PWA

Dashboard PWA sekarang memiliki kode pembaca **12 KPI, filter periode, Program Spotlight, foto dan update program langsung dari Google Sheets**. Akses tetap menggunakan akun Google staf, bukan publik. Satu langkah admin yang belum bisa dilakukan melalui GitHub adalah membuat **Google OAuth 2.0 Client ID** untuk halaman PWA.

## Sumber data yang sudah terpasang

- TA & TM — MANAGEMENT DATA MART: `1QWwIfAww9d-UuS9UbGFhmhZ3Ai6AShwBaOHiXsOPGKQ`.
  - `00_CONFIG`: periode default dan waktu sync Asana.
  - `02_FACT_HIRING`: date-based request dan filled.
  - `03_EMPLOYER_BRANDING`: published, reach, engagement, applications.
  - `04_PEOPLE_CULTURE`: activity, participation, budget dan cost.
  - `06_EXECUTIVE_SUMMARY`: KPI resmi periode laporan.
- BLACK OWL | TA & TM — Program Planner & Notes: `1xVJcCsnjubEIq8Sy9FcTp7wQV_i_pNnqfMab_Rpcq18`.
  - `Programs`: nama, PIC, workstream, status, progress, waktu update.
  - `Program_Media`: foto, video dan tanggal dokumentasi.

**Penting:** perubahan hanya pada frontend GitHub, tidak ada perubahan pada spreadsheet, Apps Script lama, maupun Team Chat.

## 1 — Buat Google Cloud OAuth Client ID

1. Buka **https://console.cloud.google.com/** lalu pilih project Google Cloud yang Anda kelola, atau buat project khusus, misalnya `Black Owl TA & TM PWA`.
2. Buka **APIs & Services → Library**, aktifkan **Google Sheets API** serta **Google Drive API**.
3. Buka **Google Auth Platform → Branding / Audience**, atur aplikasi dan akun yang berhak menguji atau mengaksesnya. Pilih **Internal** jika seluruh anggota tim memakai domain Google Workspace yang sama. Untuk akun Gmail/campuran, biasanya **External** dengan test users pada tahap pengujian; konfigurasi verifikasi dan masa berlaku authorization mengikuti kebijakan Google.
4. Buka **Google Auth Platform → Clients → Create client → Web application**.
5. Di **Authorized JavaScript origins**, tambahkan tepat:

   `https://boyhcblackowl-coder.github.io`

   **Jangan** menambahkan `/BlackOwl-TATM-PWA` ke JavaScript origin. Domain saja; HTTPS wajib.
6. Simpan. Salin **Client ID** berakhiran `.apps.googleusercontent.com`. Jangan menyalin Client Secret. Client ID boleh berada pada kode frontend; **Client Secret dan token tidak boleh**.

Dokumentasi resmi: https://developers.google.com/workspace/sheets/api/quickstart/js dan https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid

## 2 — Hubungkan Client ID ke GitHub

1. Buka https://github.com/boyhcblackowl-coder/BlackOwl-TATM-PWA/blob/main/config.js
2. Klik ikon pensil untuk edit.
3. Ganti baris `"oauthClientId": "",` menjadi:

   `"oauthClientId": "PASTE_CLIENT_ID.apps.googleusercontent.com",`

4. Commit perubahan ke branch `main`.
5. Pastikan `chatUrl`, `dataMartSheetId`, dan `plannerSheetId` tetap seperti sebelumnya.

## 3 — Bagikan Google Sheets secara terbatas

- Akun anggota yang harus melihat KPI perlu izin **Viewer** pada Management Data Mart. Catatan: viewer dapat melihat seluruh isi sheet sumber, termasuk data yang tidak muncul di Dashboard. Batasi kepada staf yang memang berwenang.
- Untuk menampilkan Planner dan Program Spotlight, berikan izin **Viewer** pada Program Planner & Notes.
- Untuk memuat foto langsung di PWA, berikan akses **Viewer** pada file atau folder dokumentasi Google Drive kepada akun yang sama.
- **Jangan mengubah dokumen menjadi Anyone with link** atau mempublikasikan source spreadsheet.

## 4 — Pengujian langsung

1. Buka https://boyhcblackowl-coder.github.io/BlackOwl-TATM-PWA/?page=overview#overview
2. Jika menggunakan PWA terinstal dan masih versi lama, close-open app; gunakan Chrome Refresh atau Clear site data hanya jika perlu.
3. Klik **Hubungkan Google** lalu setujui izin Google.
4. PWA meminta `spreadsheets.readonly` untuk membaca data dan `drive.readonly` untuk menampilkan foto. Ini izin Google resmi, bukan form login custom.
5. Data yang memiliki akses akan tampil pada 12 KPI dan Update Program. Foto ditampilkan sebagai galeri berganti otomatis bila akses Drive mengizinkan.
6. Pilih filter **Dari** dan **Sampai**, lalu klik **Terapkan periode**. Untuk periode default, angka hiring merujuk pada `06_EXECUTIVE_SUMMARY`. Untuk rentang custom, angka dihitung dari baris yang tanggalnya berada dalam rentang.
7. Data di-refresh ketika diklik dan setiap kurang lebih 2 menit selama tab terbuka. Angka baru mengikuti saat spreadsheet source berubah/sync Asana selesai. Ini **live read dari Google Sheets**, bukan WebSocket/stream detik-per-detik.

## Pemecahan masalah

- **OAuth Client ID belum dikonfigurasi**: nilai `oauthClientId` masih kosong.
- **origin_mismatch / invalid_origin**: masukkan tepat `https://boyhcblackowl-coder.github.io` pada Authorized JavaScript origins.
- **Error 403: Google Sheets API has not been used**: aktifkan Google Sheets API pada Cloud Project dari Client ID.
- **The caller does not have permission**: beri akses Viewer sheet ke akun Google yang sama dengan akun yang mengotorisasi PWA.
- **Foto tidak muncul tetapi KPI bisa**: Drive API belum aktif, belum ada izin viewer Drive, atau browser menolak scope tambahan.
- **Error: redirect_uri_mismatch**: pastikan credential bertipe **Web application** dan origin sudah tepat.
- **Access blocked / unverified app**: atur OAuth consent screen, publishing status, dan test users sesuai kebijakan Google.

## Keamanan dan batasan

- **Tidak ada halaman login buatan sendiri**, tetapi ada popup Google Consent untuk membaca dokumen yang private.
- Browser memperoleh token sementara yang hanya disimpan di memory runtime; jangan menyimpannya di GitHub atau Google Sheets.
- **Tidak ada data HR ditulis ke repository GitHub** dan tidak perlu mempublikasikan spreadsheet.
- Scope Google Drive readonly cukup luas. Jika ingin membatasi ke file tertentu dan mengurangi permintaan izin, tahap berikutnya adalah backend API khusus yang hanya mengembalikan agregat KPI dan thumbnail yang telah diotorisasi.
- Karena semua pembaca yang diberi Viewer pada Data Mart memiliki akses ke seluruh workbook, jangan berikan akses tersebut kepada seluruh karyawan tanpa evaluasi kebutuhan.
- Jika ingin PWA tetap tidak membutuhkan popup OAuth sama sekali, gunakan backend proxy dengan session auth organisasi, bukan API key publik di GitHub Pages.
