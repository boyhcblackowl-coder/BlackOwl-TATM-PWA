# Program Planner & Notes — Native PWA

Menu **Program Planner & Notes** di GitHub PWA sekarang membaca dan menyimpan data langsung ke **Google Sheets Program Planner & Notes** — tanpa harus mengunjungi Google Apps Script untuk melihat atau mengubah teks program.

## Fitur yang sudah terpasang

- List dan Board program, pencarian, filter status, filter workstream.
- Ringkasan total program, planning, berjalan, dan terlambat.
- Detail & Edit Program: title, workstream, PIC, status, prioritas, tanggal, progress 0–100%, brief, action plan, next steps, resources dan catatan.
- Buat program baru dengan ID otomatis dan versioning.
- Quick Notepad berdasarkan workstream; simpan langsung ke tab **Quick_Notes**.
- Detail foto dan video yang sudah tercatat di tab **Program_Media**; foto diambil dari Drive jika akun memiliki akses.
- Setiap simpan program/catatan menambahkan catatan tindakan di **Change_Log** (best effort).
- Tombol Refresh Live, plus refresh otomatis tiap ~90 detik saat halaman terbuka, tidak sedang mengedit modal atau catatan yang belum disimpan.
- Tidak ada data HR disimpan pada kode GitHub. Autentikasi memakai Google OAuth yang sudah dikonfigurasi.

## Persiapan admin

1. Di Google Cloud project OAuth Black Owl, pastikan **Google Sheets API** dan **Google Drive API** aktif.
2. Pastikan akun setiap anggota yang akan menggunakan PWA ada dalam **OAuth Test users** jika OAuth masih pada status Testing.
3. Bagikan spreadsheet **BLACK OWL | TA & TM — Program Planner & Notes** kepada anggota tim.
   - **Viewer:** membaca Program Planner dan Quick Notes saja.
   - **Editor:** membuat, mengedit, menyimpan program dan notepad, serta mencatat ke Change_Log.
4. Beri akun yang sama izin Drive untuk melihat foto/video dokumentasi; jangan mengaktifkan akses publik bila tidak diperlukan.
5. Buka https://boyhcblackowl-coder.github.io/BlackOwl-TATM-PWA/?page=planner#planner lalu klik **Hubungkan Google**.
6. Izinkan akses Google Sheets dan Google Drive yang diminta (izin edit Sheets diperlukan untuk simpan program dan notes).

## Penggunaan

### Program baru
- Klik **+ Program Baru**, isi nama, PIC, workstream, tanggal dan brief, lalu **Simpan Program**.
- Program ditambahkan ke tab **Programs** pada spreadsheet lama, dengan version 1 dan Change_Log.

### Edit program
- Klik **Detail & Edit** pada salah satu kartu, ubah informasi, lalu klik **Simpan Program**.
- PWA akan memeriksa ID dan version terbaru sebelum mengubah baris; jika versi berubah karena orang lain mengedit, refresh dahulu.
- Perubahan oleh PWA langsung terbaca oleh Workspace lama karena memakai spreadsheet yang sama.

### Quick Notepad
- Pilih tab **Quick Notepad**, pilih workstream, tulis catatan, lalu klik **Simpan Catatan**.
- Data disimpan pada tab **Quick_Notes**. Jangan meninggalkan catatan belum disimpan; auto-refresh dilewati ketika teks sedang diubah.

### Foto & Video
- Foto/video yang sudah diupload lewat Workspace lama ditampilkan dari catatan **Program_Media**.
- **Upload media baru** sementara tetap menggunakan tombol **Upload Media via Workspace Asli** untuk menjaga struktur folder Drive, izin akses, dan alur backend lama. Upload langsung dari GitHub PWA belum tersedia.

## Keterbatasan

- Pengguna harus mengotorisasi Google pada tiap sesi OAuth baru. Ini bukan halaman login buatan sendiri; akses Google diperlukan karena sheet privat.
- Token Google hanya tersimpan di memory tab PWA (tidak ditulis di localStorage maupun GitHub).
- Penulisan langsung Sheets API tidak sepenuhnya atomik; versi dicek sebelum update tetapi perubahan bersamaan dalam waktu sangat dekat masih dapat bertabrakan. Untuk workflow persetujuan kompleks gunakan backend terpusat.
- User yang memiliki akses Editor ke spreadsheet dapat mengubah seluruh workbook, tidak hanya satu baris. Gunakan hanya untuk tim yang dipercaya.
- Jika muncul **403 insufficient permissions**, akun Google belum memiliki Editor atau scope baru belum disetujui.
- Jika muncul **Access blocked**, tambahkan akun ke OAuth Test users.
- Jika tampil **This app isn't verified**, aplikasi OAuth Testing dengan scope yang lebih luas mungkin memerlukan pengaturan/approval sesuai ketentuan Google.

## Sumber data

- Spreadsheet ID: `1xVJcCsnjubEIq8Sy9FcTp7wQV_i_pNnqfMab_Rpcq18`
- Tabs: `Programs`, `Quick_Notes`, `Program_Media`, `Change_Log`.
- GitHub source: `planner-live.js` (native CRUD), `app.js` (UI route), `styles.css` (visual).
