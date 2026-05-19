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

### 🪙 Otomasi & Keanggotaan Koperasi
- [x] Pendaftaran Anggota Terintegrasi (CIF, Profil Fisik, & Pembuatan Akun Login Otomatis).
- [x] Otomasi Pembuatan Rekening Simpanan Koperasi (Pokok, Wajib, Sukarela/Wadiah) saat Pendaftaran.
- [x] Automasi Jurnal Akuntansi (Double-Entry SAK EP) & Rekam Mutasi untuk Setoran Awal Simpanan.

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
- **2026-05-19 (Sesi Malam - Pendaftaran CIF Terintegrasi & Otomasi Simpanan Koperasi)**:
    - **Otomasi Onboarding Terpadu**: Mengintegrasikan pembuatan akun login portal anggota secara otomatis saat Customer Service atau Super Admin melakukan registrasi fisik CIF. Sandi sementara diatur menggunakan NIK.
    - **Parameter Keuangan & Biaya Tambahan Baru**: Menetapkan default Simpanan Pokok menjadi Rp 300.000 dan Simpanan Wajib menjadi Rp 50.000, serta otomatisasi pengenaan Biaya Administrasi Rp 15.000 (COA `401.02`) dan Infaq & Sedekah Rp 10.000 (COA `302.01`) di setiap pendaftaran CIF maupun pembayaran angsuran.
    - **Kode Unik 3 Digit Terakhir**: Otomatis menghasilkan kode unik 3 digit dari akhiran nomor WhatsApp/HP anggota, ditambahkan pada infaq pokok dan didebit ke Kas untuk kepresisian pencocokan kas masuk.
    - **Generasi Rekening Otomatis**: Setiap pendaftaran anggota baru memicu pembuatan otomatis tiga jenis rekening simpanan koperasi: Simpanan Pokok (11xxxx), Simpanan Wajib (12xxxx), dan Simpanan Sukarela/Wadiah (21xxxx).
    - **Auto-journaling Double-Entry SAK EP**: Mengotomatiskan penjurnalan setoran awal beserta biaya operasional langsung ke Buku Besar Akuntansi dengan seimbang: Debit Kas di Tangan (`101.01`), Kredit Simpanan Pokok (`301.01`), Kredit Simpanan Wajib (`301.02`), Kredit Pendapatan ADM (`401.02`), dan Kredit Dana Kebajikan (`302.01`).
    - **Penyelarasan Modular Super Admin**: Memastikan navigasi Super Admin mengarah langsung secara modular ke fungsionalitas tanpa ada batasan filter per-role sebelumnya.
    - **Visual Breakdown interaktif di Teller**: Menambahkan form breakdown rincian pembayaran interaktif di TellerTerminal.tsx.

- **2026-05-19 (Sesi Pagi - Finalisasi Standarisasi UI & Akses)**:
    - **Standardisasi Layout Staf (LOCKED)**: Mengimplementasikan sidebar toggle yang seragam dan stabil (anti-squish) di seluruh modul Staf Operasional (Manager, Accounting, AO, DPS, Teller, CS). Mengunci gaya pewarnaan aktif menu ke gaya monokromatik (putih/hitam) tanpa efek neon untuk kesan super admin yang rapi.
    - **Otomasi Direct Routing Auth (LOCKED)**: Merevisi alur logika autentikasi pada `login/page.tsx` sehingga pengguna langsung diarahkan ke rute dasbor spesifik peran mereka segera setelah sesi tervalidasi, sepenuhnya mem-bypass transisi "dashboard sementara".
    - **Portal Anggota "Floating App" (LOCKED)**: Membedakan UI Member Dashboard dari panel staf melalui perombakan layout menjadi *Floating App*. Menerapkan Sidebar Kapsul yang mengambang dan Konten Utama berbasis Glassmorphism transparan (tint emas lembut) agar menyatu dengan animasi latar belakang situs.

- **2026-05-17 (Sesi Siang - Modernisasi Visual & Penguncian Desain Halaman Publik)**:
    - **Penyempurnaan Halaman Beranda (LOCKED)**: Penguncian penuh desain Beranda dengan pembesaran Logo, Menu Navigasi (`18px` ultra-bold), tombol "Masuk" (`20px`), serta hero text berselimut gradasi emas royal premium di atas kontainer kaca hijau zamrud transparan (`rgba(4, 49, 33, 0.75)`) berbingkai emas mewah di atas latar belakang papercut putih geometris.
    - **Penyempurnaan Halaman Login & Registrasi (LOCKED)**: Penguncian penuh antarmuka Login dan Registrasi menggunakan kontainer kaca hijau zamrud (`rgba(4, 49, 33, 0.75)`) yang sepenuhnya selaras dengan beranda. Semua teks pendukung diubah menjadi Putih Murni (`#ffffff`) berkontras tinggi (AAA) dengan tulisan kata sandi/email di dalam kolom menggunakan Slate Charcoal Modern (`#334155`) di atas kolom input kaca semi-transparan (`rgba(255, 255, 255, 0.08)`).
    - **Konsistensi Desain Global**: Standardisasi typography, keterbacaan, dan kontras visual tingkat tinggi di seluruh gerbang publik iQ-RA System.

- **2026-05-16 (Sesi Sore - Multi-Theme Support)**:
    - **Theme Engine**: Implementasi `ThemeContext` berbasis React Context API untuk manajemen state Mode Terang/Gelap di seluruh aplikasi.
    - **UI Theme Switcher**: Penambahan komponen `ThemeToggle` di Sidebar untuk perpindahan tema instan dengan persistensi `localStorage`.
    - **Refaktor CSS Global**: Konversi seluruh pewarnaan *hardcoded* menjadi variabel CSS dinamis di `globals.css`.
    - **Standardisasi Dokumentasi**: Pembaruan `blueprint.md` dan `DEV_GUIDE.md` untuk mencakup standar desain multi-tema.

- **2026-05-16 (Standarisasi UI & Dokumentasi)**:
    - **UI Teller**: Penyeragaman halaman Teller dengan standar Dashboard Admin premium (Sidebar border emas, Header aksen kiri emas, dan tema Emerald Glassmorphism).
    - **Komponen Terminal**: Upgrade visual pada `TellerTerminal` termasuk gradasi emas premium pada tombol aksi dan optimasi tabel riwayat.
    - **Dokumentasi Teknis**: Pembaruan `blueprint.md` dan `DEV_GUIDE.md` untuk mencantumkan standar desain "Premium Sharia FinTech" sebagai pedoman pengembangan masa depan.

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
