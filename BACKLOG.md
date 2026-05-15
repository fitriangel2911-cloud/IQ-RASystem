# 📋 IQ-RA System Project Backlog

Dokumen ini digunakan untuk melacak kemajuan pengembangan IQ-RA System (Platform Keuangan Mikro Syariah berbasis RAG).

---

## ✅ Selesai (Completed)
Status fitur yang sudah diimplementasikan dan siap digunakan.

### 🏗️ Fondasi & Infrastruktur
- [x] Inisialisasi Project (Next.js 15+, TypeScript, Tailwind CSS).
- [x] Integrasi Supabase (Auth, Database, Storage).
- [x] Setup UI Dashboard Premium (Dark Emerald & Gold Aesthetic).
- [x] Konfigurasi Role-Based Access Control (RBAC) dasar.

### 👥 Manajemen Pengguna & Auth
- [x] Sistem Login & Registrasi.
- [x] Manajemen Profil Pengguna.
- [x] Penambahan Role khusus: **Super Admin, Manager, DPS, AO, Accounting, Teller, Customer Service**.
- [x] Fitur Auto-confirm untuk staff (Migration).

### 🖥️ Antarmuka Dashboard (UI/UX)
- [x] Dashboard Manager (Ringkasan Eksekutif).
- [x] Dashboard Accounting (Jurnal & Buku Besar).
- [x] Dashboard AO (Manajemen Nasabah & Akad).
- [x] Dashboard DPS (Pengawasan Syariah & RAG Pipeline View).
- [x] Dashboard Teller (Transaksi Kas).
- [x] Dashboard Customer Service (Registrasi Anggota).

---

## 🚧 Sedang Dikerjakan (In Progress)
Fitur yang dalam tahap pengembangan aktif atau integrasi.

### 🤖 Kecerdasan Buatan (AI & RAG)
- [x] Integrasi LangChain.js untuk orkestrasi RAG.
- [x] UI Konsultasi Kepatuhan Syariah (AI Analysis di AO Dashboard).
- [x] Setup pgvector untuk penyimpanan basis pengetahuan syariah.

### 💰 Operasional Keuangan
- [x] Siklus Penerimaan Kas (Simpanan Wadiah/Mudharabah).
- [x] Siklus Pengeluaran Kas (Penyaluran Pembiayaan).
- [x] Automasi Jurnal Akuntansi (Double-entry).

---

### 📜 Manajemen Akad & Kepatuhan
- [x] Modul Ingesti Dokumen (Upload PDF Fatwa DSN-MUI & PSAK).
- [x] Validasi Akad Otomatis oleh AI sebelum pengesahan DPS.
- [ ] Generate Dokumen Akad Otomatis (PDF).

### 📊 Pelaporan Standar SAK EP
- [ ] Laporan Posisi Keuangan (Neraca).
- [ ] Laporan Laba Rugi Komprehensif.
- [ ] Laporan Arus Kas (Metode Langsung/Tidak Langsung).
- [ ] Laporan Perubahan Ekuitas.

### 🛡️ Keamanan & Optimasi
- [ ] Audit Row-Level Security (RLS) di semua tabel Supabase.
- [ ] Pengujian Beban (Load Testing) untuk sistem RAG.
- [ ] User Acceptance Testing (UAT) dengan user asli.
- [ ] Deployment Produksi ke Vercel dengan optimasi build.

---

## 📝 Catatan Perubahan Terbaru
- **2026-05-15 (Sesi Pagi - UI/UX Standardization)**:
    - **Visual & Estetika**: Penyeragaman tema *Emerald Glassmorphism* (hijau kaca) pada keseluruhan panel Dashboard Nasabah dan seluruh halaman Staf.
    - **Latar Belakang Global**: Implementasi animasi partikel `GlobalSiteBackground` agar aktif secara universal melintasi semua tipe pengguna (Member & Staff/Super Admin).
    - **Optimasi Kontras**: Menyetel transparansi `rgba(4, 49, 33, 0.75)` dengan `backdropFilter: blur(24px)` untuk menjamin keterbacaan teks dan nuansa premium tanpa kesan *washed-out*.

- **2026-05-14 (Sesi Malam - Final Compliance & DPS Flex)**:
    - **Knowledge Management**: Implementasi modul Ingesti Dokumen bagi Super Admin & DPS untuk melatih AI.
    - **DPS Flexibility**: Penambahan kotak saran opsional bagi DPS dan fitur input rujukan syariah mandiri.
    - **AI Audit Assistant**: DPS kini memiliki asisten AI untuk memvalidasi kepatuhan akad secara independen.

- **2026-05-14 (Sesi Malam - Ops & Disbursement)**:
    - **Penyaluran Pembiayaan**: Implementasi fitur pencairan dana otomatis (Disbursement) di Dashboard AO.
    - **Otomasi Jurnal Pengeluaran**: Sistem otomatis mendebit Piutang dan mengkredit Kas saat dana dicairkan.
    - **Integrasi Kontrak**: Otomasi perubahan status prospek menjadi kontrak aktif sesuai standar operasional.
- **2026-05-14 (Sesi Malam - Update AI)**:
    - **iQ-RA AI Engine**: Berhasil mengintegrasikan AI berbasis RAG ke dalam Dashboard AO.
    - **Analisis Akad Otomatis**: AI kini bisa merekomendasikan jenis akad (Murabahah/Mudharabah) berdasarkan Fatwa DSN-MUI secara instan.
    - **Infrastruktur Vektor**: Mengaktifkan `pgvector` dan tabel `sharia_knowledge` untuk menyimpan literatur hukum syariah.
    - **UI/UX AO**: Penambahan antarmuka analisis yang premium dengan indikator skor kecocokan dan justifikasi syariah.
- **2026-05-14 (Sesi Malam - Ops)**:
    - **Modul Keanggotaan (CIF)**: Upgrade formulir pendaftaran anggota dengan data KYC lengkap.
    - **Modul Kasir (Teller)**: Implementasi otomasi penjurnalan ganda (**Double-Entry**).
    - **Integrasi Database**: Menambahkan kolom `member_id` pada tabel `journal_entries`.

- **2026-05-13**: Implementasi role DPS dan perbaikan stabilitas build Vercel.

> **Tips**: Gunakan file ini sebagai panduan setiap kali memulai sesi pengerjaan kode.
