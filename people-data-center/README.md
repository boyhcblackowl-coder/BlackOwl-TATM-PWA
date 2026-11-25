# Black Owl People Data Center — PWA

PWA launcher resmi untuk penggunaan internal HCGA & Legal, menggunakan pola instalasi repo BlackOwl-TATM-PWA.

URL setelah GitHub Pages aktif:
https://boyhcblackowl-coder.github.io/BlackOwl-TATM-PWA/people-data-center/

## Install
1. Buka URL PWA menggunakan Chrome/Edge.
2. Pada Hubungkan Web App, tempel alamat /exec Google Apps Script People Data Center (dari akun perusahaan).
3. Klik Simpan Alamat, lalu Buka People Data Center.
4. Gunakan tombol Instal Aplikasi atau menu ⋮ → Install page as app.

## Keamanan
Jangan menaruh data karyawan, CSV, Excel, Seed.html, akses token atau password dalam repository publik ini. Halaman PWA hanya menyimpan URL /exec secara lokal pada perangkat, bukan data HR. Google Apps Script serta Google Sheets masih menyediakan sistem live dan kontrol akses.

## Batasan
Ini PWA launcher, **bukan migrasi seluruh dashboard** ke hosting GitHub. Saat membuka aplikasi utama, tab/window browser lain mungkin muncul. Agar seluruh dashboard berjalan di domain PWA perlu backend API dan autentikasi lintas domain yang aman. Jangan mengubah Google Apps Script untuk mengizinkan iframe publik hanya untuk menyembunyikan URL.

Tidak perlu menjalankan setupDatabase() atau mengimpor ulang data.