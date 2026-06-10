# DOKUMEN USER ACCEPTANCE TESTING (UAT) - IQ-RA SYSTEM
**Sistem Informasi Koperasi Simpan Pinjam Pembiayaan Syariah (KSPPS)**

*   **Versi Aplikasi:** 1.0.0-Staging
*   **Lingkungan Pengujian (UAT):** Vercel Staging Environment (Preview / Production URL)
*   **Koneksi Database:** Supabase Staging Instance
*   **Tanggal Pengujian:** 10 Juni 2026

---

## 1. PENDAHULUAN & ACUAN LINGKUNGAN UAT

Dokumen ini digunakan sebagai panduan bagi para penguji (User/Klien) untuk memverifikasi seluruh fungsi bisnis yang ada pada **IQ-RA System**. 

### Lingkungan UAT (Vercel Deploy Link)
*   **Penyedia Infrastruktur**: Pengujian dilakukan langsung menggunakan **link deployment Vercel** yang terhubung secara otomatis ke repositori Git proyek ini.
*   **Peran AI Agent**: Sebagai asisten koding, saya bertugas memastikan seluruh kode lokal dapat dikompilasi (*build checking*) dengan sukses tanpa eror, menerapkan perbaikan bug, dan mendorong (*commit/push*) kode tersebut. Server Vercel kemudian akan mengambil kode terbaru untuk dibangun menjadi aplikasi web berbasis awan yang siap diuji.
*   **Akses Pengujian**: Link Vercel inilah yang berfungsi sebagai **UAT Environment** karena berjalan di internet, terhubung dengan database Supabase, dan dapat diakses oleh seluruh tim penguji menggunakan gawai (PC/Laptop/Ponsel) masing-masing.

---

## 2. STRUKTUR PERAN DAN CAKUPAN PENGUJIAN

IQ-RA System menggunakan sistem **Role-Based Access Control (RBAC)** berbasis tabel `access_rules`. Berikut adalah peran (roles) yang harus diuji:
1.  **Anggota / Member (Portal Anggota)**
2.  **Customer Service (CS)**
3.  **Teller**
4.  **Account Officer (AO)**
5.  **Accounting (Akuntan)**
6.  **Manager / Supervisor**
7.  **Dewan Pengawas Syariah (DPS)**
8.  **Super Admin (IT Administrator)**

---

## 3. SKENARIO DAN KASUS PENGUJIAN UAT (UAT TEST CASES)

### MODUL 1: PORTAL ANGGOTA (MEMBER PORTAL)
Skenario: Anggota melakukan pendaftaran secara mandiri dan mengisi berkas profil KYC agar bisa mengajukan pembiayaan.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **MEM-01** | Buka halaman login, klik register/daftar akun baru. | Nama Lengkap, Email, Kata Sandi (min. 6 karakter). | Sistem berhasil mendaftarkan akun dan mengarahkan ke dashboard member. | | |
| **MEM-02** | Masuk ke menu profil KYC anggota dan isi berkas KYC lengkap. | NIK (16 digit), No. KK, Nama Ibu Kandung, Pekerjaan, Penghasilan Bulanan, Foto KTP/Selfie. | Data profil berhasil disimpan, status berubah menjadi "Pending Verification". | | |
| **MEM-03** | Klik link WhatsApp Hubungi CS di portal anggota. | Klik tombol WhatsApp. | Tab baru terbuka mengarah ke link chat WA Customer Service dengan templat pesan otomatis. | | |

---

### MODUL 2: CUSTOMER SERVICE (CS)
Skenario: Memverifikasi profil KYC anggota baru dan melakukan verifikasi transfer setoran online.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **CS-01** | Buka antrean verifikasi KYC anggota. | Memilih nama anggota "Pending Verification". | Seluruh detail KYC (NIK, KK, data pendapatan) tampil dengan jelas dan tanpa pemotongan UI. | | |
| **CS-02** | Klik tombol "Approve / Setujui" berkas anggota. | Klik Setujui. | Status anggota berubah menjadi "Active", nomor CIF terbit, dan aksi tercatat di Audit Log. | | |
| **CS-03** | Buka modul Verifikasi Setoran Online (*deposit verifications*). | Pilih bukti transfer setoran anggota. | Detail transfer tampil. CS dapat melakukan approve yang memicu pembuatan jurnal otomatis di accounting. | | |

---

### MODUL 3: TELLER TERMINAL
Skenario: Mengelola transaksi kas tunai harian (setoran, penarikan, angsuran, pencairan pembiayaan).

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TEL-01** | Buka Shift Kasir (Membuka sesi kas harian). | Nominal Kas Awal (misal: Rp 5.000.000). | Sesi kasir aktif, tercatat kas awal teller, tombol transaksi kas tunai menjadi aktif. | | |
| **TEL-02** | Melakukan Setoran Tunai Anggota. | ID Anggota, Jumlah Setoran (misal: Rp 500.000). | Saldo tabungan anggota bertambah, tercatat di mutasi kas masuk teller. | | |
| **TEL-03** | Melakukan Penarikan Tunai Anggota. | ID Anggota, Jumlah Penarikan (misal: Rp 200.000). | Saldo anggota berkurang, sistem memverifikasi kecukupan saldo sebelum penarikan sukses. | | |
| **TEL-04** | Melakukan Pencairan Pembiayaan (*Disbursement*). | Pilih nomor akad pembiayaan yang disetujui, klik Cairkan. | Dana berhasil ditransfer ke rekening tabungan anggota, status pembiayaan menjadi "Cair/Aktif". | | |
| **TEL-05** | Tutup Shift Kasir (Rekonsiliasi akhir hari). | Input jumlah fisik kas di laci teller. | Sistem mencocokkan saldo sistem dengan fisik kas. Status shift ditutup (*Closed*). | | |

---

### MODUL 4: ACCOUNT OFFICER (AO)
Skenario: Mengelola permohonan pembiayaan baru, penilaian agunan, dan input hasil survei kelayakan.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **AO-01** | Input pengajuan pembiayaan baru anggota. | ID Anggota, Jenis Akad (Murabahah/Mudharabah/Qardhul Hasan), Jumlah Pengajuan. | Permohonan terdaftar di sistem dengan status "Pending Survey". | | |
| **AO-02** | Input data agunan (*collateral metadata*). | Jenis agunan (Sertifikat/BPKB), Taksiran Nilai Jaminan, Dokumen pendukung. | Metadata agunan tersimpan dengan benar di database (tabel `collateral_metadata`). | | |
| **AO-03** | Kirim hasil rekomendasi survei kelayakan. | Skor Kelayakan, Analisis Risiko, Rekomendasi Nominal Pembiayaan. | Status pengajuan naik menjadi "Pending Manager Approval". | | |

---

### MODUL 5: MANAGER / SUPERVISOR
Skenario: Melakukan otorisasi transaksi di atas limit teller dan menyetujui pembiayaan besar.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **MGR-01** | Melakukan approval permohonan pembiayaan anggota. | Buka menu Otorisasi Pembiayaan, klik Approve. | Status pembiayaan berubah menjadi "Approved / Siap Akad". Terbit kontrak akad pembiayaan. | | |
| **MGR-02** | Otorisasi penarikan tunai teller yang melebihi limit otorisasi mandiri. | Pilih transaksi penundaan teller, masukkan PIN/Klik Approve. | Transaksi teller yang tertunda langsung berstatus sukses dan dana keluar didebet. | | |

---

### MODUL 6: DEWAN PENGAWAS SYARIAH (DPS)
Skenario: Melakukan audit kepatuhan syariah pada akad pembiayaan yang berjalan menggunakan bantuan AI Compliance Assistant.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **DPS-01** | Membuka dashboard modul DPS dan melihat daftar akad berjalan. | Klik menu DPS Dashboard. | Tampil 6 modul fungsional DPS dengan layout rapi dan performa yang responsif. | | |
| **DPS-02** | Menjalankan AI Shariah Audit Compliance. | Klik tombol "Mulai Audit AI" pada salah satu akad (misal: Qardhul Hasan). | AI melakukan analisis kepatuhan berdasarkan data riil (bukan asumsi fiktif), memvalidasi kesesuaian dengan Fatwa DSN-MUI terkait. | | |
| **DPS-03** | Menggunakan AI Sharia Assistant untuk bertanya tentang regulasi. | Input pertanyaan (misal: "Apa ketentuan agunan untuk akad mudharabah?"). | AI menjawab dengan menyertakan referensi fatwa yang tepat dan akurat tanpa halusinasi data. | | |

---

### MODUL 7: ACCOUNTING (AKUNTANSI)
Skenario: Memelihara bagan akun (COA) dan memastikan pencatatan jurnal keuangan mematuhi SAK EP.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **ACT-01** | Tambah Akun Baru di Chart of Accounts (COA). | Kode Akun (misal: `1.1.01.03`), Nama Akun, Kategori, Saldo Normal (Debit/Kredit). | Akun COA baru tersimpan di database dan langsung tampil pada daftar bagan akun. | | |
| **ACT-02** | Periksa Jurnal Otomatis Pencairan Pembiayaan. | Cek entri jurnal setelah teller mencairkan dana pembiayaan. | Terbentuk jurnal SAK EP: Debet Piutang Pembiayaan (Murabahah/dll) dan Kredit Kas Teller secara presisi. | | |
| **ACT-03** | Buka Neraca Lajur & Laporan Keuangan Koperasi. | Klik menu Laporan Keuangan. | Tampil laporan neraca, laba rugi, dan arus kas dengan angka yang seimbang (balance). | | |

---

### MODUL 8: SUPER ADMIN (IT ADMINISTRATOR)
Skenario: Mengelola konfigurasi akses sistem, memantau log keamanan, dan membackup database.

| ID Tes | Langkah Pengujian | Data Input (Simulasi) | Hasil yang Diharapkan | Status (Pass/Fail) | Catatan |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **ADM-01** | Promosi Peran Staf (*User Role Promotion*). | Pilih salah satu staf, ubah peran dari CS menjadi Teller. | Perubahan peran tersimpan. Hak akses pengguna langsung ter-update secara real-time pada login berikutnya. | | |
| **ADM-02** | Ubah Aturan Hak Akses Scopes (*Access Rules*). | Aktifkan/nonaktifkan scope fitur tertentu pada role tertentu. | Aturan tersimpan pada tabel `access_rules` dan seketika membatasi visibilitas menu sidebar bagi peran terkait. | | |
| **ADM-03** | Periksa Log Audit Keamanan (*Audit Logs*). | Masuk ke menu Audit Logs. | Setiap aksi penting (login, hapus data, otorisasi transaksi) tercatat lengkap dengan identitas aktor, waktu, dan detail aksi. | | |
| **ADM-04** | Pencadangan Sistem (*Backup Configuration*). | Klik tombol Ekspor Cadangan JSON. | File cadangan konfigurasi (COA, parameter sistem, hak akses) sukses terunduh dalam format `.json`. | | |

---

## 4. FORMULIR PENILAIAN & SIGN-OFF UAT

### **Kriteria Kelulusan (Exit Criteria):**
1.  **Critical Bugs (Blocker)**: 0 (Tidak ada eror yang menghentikan proses transaksi keuangan).
2.  **Major Bugs (Fungsional Utama)**: 0 (Seluruh fitur inti CS, Teller, DPS, dan Accounting harus berfungsi penuh).
3.  **Minor/Cosmetic Bugs (Tampilan)**: Maksimal 5 (Masalah estetika minor yang tidak mengganggu jalannya transaksi).

---

### **Pernyataan Persetujuan (UAT Sign-Off)**

Dengan menandatangani dokumen ini, perwakilan penguji menyatakan bahwa sistem **IQ-RA** telah diuji sesuai dengan skenario di atas dan hasilnya dinyatakan:

`[  ]` **DITERIMA SEPENUHNYA (SIAP GO-LIVE)**
`[  ]` **DITERIMA DENGAN PERBAIKAN MINOR**
`[  ]` **DITOLAK (BUTUH PENGERJAAN/PERBAIKAN BESAR)**

**Penguji Utama (User/Klien):**

___________________________  
Nama:  
Jabatan:  
Tanggal:  

**Project Manager / Developer Representative:**

___________________________  
Nama:  
Jabatan:  
Tanggal:  
