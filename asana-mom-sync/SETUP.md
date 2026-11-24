# Weekly MoM native di Black Owl TA & TM PWA

Menu **Weekly MoM** kini menampilkan notulen langsung di halaman GitHub PWA — bukan lagi hanya tombol ke Asana. Data dibaca dari spreadsheet privat yang sama dengan Program Planner.

## Yang sudah dipasang

- Pada spreadsheet `BLACK OWL | TA & TM — Program Planner & Notes` terdapat tab baru **Weekly_MoM**.
- Arsip awal **50 notulen** yang berhasil dibaca dari komentar task Asana sudah ditulis, mencakup 18 November 2025 hingga 17 November 2026.
- Tab memiliki kolom: Story ID, Meeting Date, Created At, Author, Title, Content, Source URL, Synced At.
- PWA membaca tab tersebut melalui Google Sheets API dan OAuth Google yang sudah dikonfigurasi (Client ID di config.js).
- Halaman Weekly MoM menyediakan pencarian, filter bulan, pemilihan tanggal, dan tampilan isi asli komentar. Tidak ada konten notulen yang dipublikasikan sebagai source GitHub.

## Cara membuka di PWA

1. Buka https://boyhcblackowl-coder.github.io/BlackOwl-TATM-PWA/?page=weeklymom#weeklymom
2. Klik **Hubungkan Google**.
3. Pilih akun yang memiliki hak **Viewer** atau **Editor** ke spreadsheet Program Planner.
4. Daftar notulen akan muncul dari versi yang tersimpan di tab Weekly_MoM.
5. Gunakan pencarian atau filter bulan. Klik salah satu notulen untuk melihat teks lengkapnya.
6. Bila baru pertama kali menggunakan OAuth dan muncul pesan Testing/403, tambahkan email akun di Google Cloud Console → Google Auth Platform → Audience → Test users.

## Aktivasi sinkronisasi Asana otomatis (admin)

**Penting:** arsip awal 50 notulen yang sudah ditulis bukan streaming real-time dari Asana. Untuk menampilkan komentar yang ditambahkan berikutnya, install script sinkronisasi. Ini memakai data Asana asli, bukan ringkasan buatan.

1. Buka project Google Apps Script **TA & TM Workspace / Asana MoM** milik admin yang boleh membaca task Asana.
2. Di editor pilih **New file → Script**, beri nama `AsanaMomSync`.
3. Copy seluruh isi file [AsanaMomSync.gs](./AsanaMomSync.gs).
4. Di **Project Settings → Script Properties**, pastikan ada properti:
   - **Property:** `TATM_ASANA_TOKEN`
   - **Value:** token akses Asana (Personal Access Token), dari akun admin Asana yang memiliki akses ke task.
   - **Jangan** menulis token pada source GitHub, chat, Google Sheets, atau kode HTML.
5. Simpan, pilih fungsi `installBlackOwlWeeklyMomSync`, lalu klik **Run** satu kali dan setujui izin Google/Asana yang diminta Apps Script.
6. Lihat Execution Log: harus terlihat jumlah komentar tersinkronisasi dan informasi trigger 30 menit.
7. Setelah itu semua komentar MoM akan disalin dari task Asana ke tab `Weekly_MoM` sekitar setiap 30 menit, selama trigger dan akses Asana tetap aktif.
8. PWA akan membaca cache terbaru ketika tombol **↻ Refresh MoM** diklik.

## Keamanan

- Jangan mengubah spreadsheet menjadi **Anyone with the link**. Cukup share sebagai Viewer kepada anggota tim berwenang.
- Google Sheets API dijalankan menggunakan OAuth akun pengguna. Source GitHub tidak menyimpan isi komentar atau token.
- Link task Asana tetap dilindungi permission Asana, terpisah dari spreadsheet.
- Catatan MoM internal sebaiknya tidak berisi data personal yang tidak boleh dibaca seluruh anggota TA & TM.

## Troubleshooting

- **Belum ada notulen / 403 Google Sheets:** share spreadsheet ke akun Google yang Anda gunakan ketika Hubungkan Google.
- **Access blocked (OAuth testing):** tambahkan akun ke Test users di Google Cloud Audience.
- **Tidak ada komentar baru:** admin belum menjalankan `installBlackOwlWeeklyMomSync`, atau trigger tidak aktif / token Asana sudah kedaluwarsa.
- **Asana API 401:** periksa PAT Asana dan property `TATM_ASANA_TOKEN`.
- **Asana API 403:** pemilik PAT belum diberi akses ke task Asana.
- **Google Sheets API 403:** periksa API Google Cloud dan izin spreadsheet.

**Sumber Asana:** https://app.asana.com/1/1184897653019384/project/1203625569754693/task/1210517627492639?focus=true
