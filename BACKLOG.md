# 📋 IQ-RA System Project Backlog

Dokumen ini digunakan untuk melacak kemajuan pengembangan IQ-RA System (Platform Keuangan Mikro Syariah berbasis RAG).

> **Status Terkini (2 Juni 2026):** Fase III 100% selesai. Semua tabel Supabase telah diaudit, disinkronkan, dan didokumentasikan. Tabel baru (`notifications`, `access_rules`) telah ditambahkan. MASTER_PATCH.sql telah dibuat dan dijalankan di Supabase Studio. Fase IV (UAT & Go-Live) sedang berjalan sebagai prioritas utama.

---

## ✅ Selesai (Completed)
Status fitur yang sudah diimplementasikan dan siap digunakan.

### 🏗️ Fondasi & Infrastruktur
- [x] Inisialisasi Project (Next.js 15+, TypeScript, Tailwind CSS).
- [x] Integrasi Supabase (Auth, Database, Storage).
- [x] Setup UI Dashboard Premium (Dark Emerald & Gold Aesthetic).
- [x] Konfigurasi Role-Based Access Control (RBAC) dasar.
- [x] **Infrastruktur IT Super Admin:** Implementasi UI & Logika CRUD untuk Audit Logs Keamanan, Diagnostik Sistem, Backup Konfigurasi JSON, Manajemen COA Dinamis, dan Ticketing Penugasan Staf.
- [x] **Audit & Sinkronisasi Tabel Supabase:** Semua 16 tabel yang digunakan di kode dipetakan, diverifikasi, dan dihubungkan ke migration SQL. Tabel baru (`notifications`, `access_rules`) dibuat. `SUPABASE_TABLES.md` dan `supabase/tables_map.json` dibuat sebagai referensi linkage. `MASTER_PATCH.sql` tersedia untuk patch aman tanpa reset data.

### 👥 Manajemen Pengguna & Auth
- [x] Sistem Login & Registrasi.
- [x] Manajemen Profil Pengguna.
- [x] Penambahan Role khusus: **Super Admin, Manager, DPS, AO, Accounting, Teller, Customer Service**.
- [x] Fitur Auto-confirm untuk staff (Migration).

### 🖥️ Antarmuka Dashboard (UI/UX)
- [x] Dashboard Manager (Ringkasan Eksekutif).
- [x] Dashboard Accounting (Jurnal & Buku Besar).
- [x] Dashboard AO (Manajemen Nasabah & Akad).
- [x] Dashboard DPS (Pusat Pengawasan Kepatuhan - 6 UI Utama Premium & Ingesti Vektor RAG).
- [x] Dashboard DPS — Standardisasi UI/UX Tema (High-Contrast, Theme-Aware CSS Variables, White Card Light Mode, Gold/Green Borders).
- [x] Dashboard Teller (Transaksi Kas).
- [x] Dashboard Customer Service (Registrasi Anggota).

### 🪙 Otomasi & Keanggotaan Koperasi
- [x] Pendaftaran Anggota Terintegrasi (CIF, Profil Fisik, & Pembuatan Akun Login Otomatis).
- [x] Otomasi Pembuatan Rekening Simpanan Koperasi (Pokok, Wajib, Sukarela/Wadiah) saat Pendaftaran.
- [x] Automasi Jurnal Akuntansi (Double-Entry SAK EP) & Rekam Mutasi untuk Setoran Awal Simpanan.

### 💰 Operasional Keuangan (Siklus Kas Teller)
- [x] Siklus Penerimaan Kas (Simpanan Wadiah/Mudharabah).
- [x] Siklus Pengeluaran Kas (Penarikan Tunai & Penyaluran Pembiayaan).
- [x] Automasi Jurnal Akuntansi Double-Entry (SAK EP).
- [x] Sistem Otorisasi Penarikan Limit Supervisor (> Rp 5.000.000).
- [x] Kalkulator Denominasi Kas Fisik Teller.
- [x] Verifikasi Fisik KTP & Kartu Anggota (Protokol Nomor Kartu Anggota) untuk Kenyamanan Layanan.

### 🤖 Kecerdasan Buatan (AI & RAG)
- [x] Integrasi LangChain.js untuk orkestrasi RAG.
- [x] UI Konsultasi Kepatuhan Syariah (AI Analysis di AO Dashboard).
- [x] Setup pgvector & Endpoint Ingesti Vektor Riil (`/api/ai/ingest`).
- [x] Robustness Patch: Penanganan Rate Limit (429) Google Gemini secara otomatis dengan jeda 3 detik dan 3x Auto-Retry.
- [x] Migrasi Model Vektor: Pembersihan model usang `text-embedding-004` ke model aktif `gemini-embedding-001` dengan slicing/padding otomatis 1536 dimensi.

### 📜 Manajemen Akad & Kepatuhan
- [x] Modul Ingesti & Vektorisasi Dokumen Fatwa Syariah.
- [x] Refaktor Kategori Dasbor RAG: Pemisahan Regulasi Pemerintah dari PSAK, penyatuan IAI/PSAK, serta penambahan kategori Sumber Buku / Kitab Fikih.
- [x] Penghapusan Dokumen RAG: Ditambahkan tombol Hapus dokumen di dasbor dengan konfirmasi aman.
- [x] Server-Side RLS Bypass: Mengintegrasikan `SUPABASE_SERVICE_ROLE_KEY` pada api /api/ai/ingest untuk kelancaran penulisan data vektor.
- [x] Validasi Akad Otomatis & Split-Screen Document Viewer pada DPS.
- [x] Generate & Cetak Laporan Hasil Pengawasan Syariah Resmi RAT (PDF).

### 📊 Pelaporan Standar SAK EP
- [x] Laporan Posisi Keuangan (Neraca).
- [x] Laporan Laba Rugi Komprehensif.
- [x] Laporan Arus Kas (Metode Langsung/Tidak Langsung).
- [x] Laporan Perubahan Ekuitas.
- [x] **Seeding Data COA:** Impor penuh 202 akun standar SAK EP dari CSV ke basis data untuk digunakan seluruh modul akuntansi.

---

## 🚧 Rencana Berikutnya (Up Next — Fase IV)
Fitur dan tugas yang menjadi prioritas pada fase deployment dan pengujian.

### 🧪 Pengujian & Validasi
- [ ] **User Acceptance Testing (UAT)** — Simulasi transaksi harian bersama user asli (Teller, AO, DPS, CS).
- [ ] **Blackbox Testing** — Pengujian alur lengkap dari registrasi anggota → pengajuan pembiayaan → audit DPS → pencairan → pencatatan akuntansi.
- [ ] **Pengujian Beban (Load Testing)** — Stress test paralel untuk sistem RAG dan endpoint AI.
- [ ] **Audit Row-Level Security (RLS)** — Verifikasi kebijakan akses data antar-role di semua tabel Supabase.

### 🚀 Deployment & Go-Live
- [ ] **Deployment Produksi ke Vercel** — Build produksi Next.js dengan optimasi image, caching, dan environment secrets.
- [ ] **Konfigurasi Domain & SSL** — Setup custom domain KSPPS + sertifikat HTTPS produksi.
- [ ] **Migrasi Data Awal (Data Seeding)** — Melengkapi import data anggota & akad aktif dari sistem lama ke Supabase produksi jika ada.
- [ ] **Training Pengguna** — Sesi pelatihan singkat untuk setiap role staf operasional.

### 🔮 Rencana Jangka Panjang (Fase V — Post Go-Live)
- [ ] **Integrasi Payment Gateway (Flip API)** — Transfer antar bank real-time.
- [ ] **Integrasi PPOB** — Pulsa, token PLN, e-wallet.
- [ ] **IQ-RA Mobile Gateway** — API untuk anggota mengakses data mandiri.
- [ ] **Notifikasi Otomatis (Push/WhatsApp)** — Notifikasi jatuh tempo angsuran, saldo masuk, dan laporan berkala.
- [ ] **Dashboard Anggota (Member Portal)** — Versi ringkas cek saldo, mutasi, dan riwayat pembayaran angsuran mandiri.

---

## 📝 Catatan Perubahan Terbaru

- **2026-06-02 (Finalisasi Super Admin IT & Data Seeding COA)**:
    - **UI CRUD IT Administrator**: Mengeksekusi pembuatan fungsionalitas UI secara penuh untuk 5 panel Super Admin: Tabel Log Audit, Status Diagnostik Real-time, Ekspor JSON Backup, Manajemen COA interaktif, dan Grid Penugasan Staf (Ticketing).
    - **Global Audit Trailing**: Mengintegrasikan `logSuperAdminAction` di semua titik perubahan konfigurasi dan peran sistem, memastikan setiap mutasi terekam dengan jelas ke tabel `audit_logs`.
    - **Data Seeding Ekstensif**: Membaca file `coa.csv` secara otomatis dan melakukan *upsert* terhadap seluruh 202 akun COA ke tabel `coa_accounts`, lengkap dengan resolusi otomatis untuk konflik duplikasi sandi akun. Sistem akuntansi kini sepenuhnya ditenagai oleh bagan akun riil.

- **2026-06-02 (Purifikasi Estetika Dewan Pengawas Syariah & Perbaikan Chatbot)**:
    - **Purifikasi Estetika Institusional (Sistem Bukan Mainan)**: Menghapus total seluruh emoji dekoratif dan simbol visual informal dari komponen `DPSDashboard.tsx`, `AIKnowledgeManager.tsx`, `RAGPipelineView.tsx`, dan `AIChatbot.tsx`. Semua visualisasi dan penanda digantikan dengan desain berbasis teks formal dan layout monokromatik/theme-aware.
    - **Pencegahan Jawaban Chatbot Terpotong**: Meningkatkan `maxOutputTokens` pada inisialisasi Gemini di `ai.service.ts` menjadi 4096 token agar jawaban penjelasan syariah yang panjang dapat tercetak secara utuh.
    - **Optimasi Ukuran Konteks RAG**: Menurunkan ambang batas Unified Context dari 600.000 ke 120.000 karakter di `ai.service.ts`. Apabila basis data besar (seperti kitab fiqih muamalah kontemporer), sistem secara otomatis menggunakan similarity search berdensitas tinggi (top 30 chunk) alih-alih memuat seluruh DB, meningkatkan kecepatan respons secara drastik (dari 15 detik menjadi 2-4 detik) dan mencegah timeout koneksi Next.js.
    - **Penyelarasan Urutan Render Chatbot**: Membangun ulang markdown renderer `renderMessageText` di `AIChatbot.tsx` agar memproses teks secara baris-demi-baris (*line-by-line*) untuk menjaga keutuhan urutan pesan, daftar bullet/numbered, dan heading agar tidak teracak.

- **2026-05-31 (Standardisasi UI/UX DPS — Tema & Aksesibilitas Visual)**:
    - **Kontainer Putih Bersih Light Mode**: Mengganti seluruh kontainer berwarna hijau yang mengganggu di Mode Terang menjadi kartu putih murni (`#ffffff`) agar tampak bersih, premium, dan sangat mudah dibaca.
    - **Token Border Semantik Baru**: Menambahkan 4 token CSS border khusus di `globals.css`: `--border-success` (hijau zamrud `#047857`), `--border-warning` (emas `#cca334`), `--border-danger` (merah bata `#b91c1c`), `--border-info` (biru royal `#1d4ed8`) — masing-masing diterapkan ke panel yang sesuai di `DPSDashboard.tsx`.
    - **Huruf Hitam Pekat (High Contrast)**: Warna teks sekunder di Mode Terang diperbarui menjadi hitam murni (`#000000`) untuk memastikan keterbacaan maksimal sesuai standar aksesibilitas WCAG AA/AAA.
    - **Penyelarasan Menyeluruh DPS (6 Tab)**: Seluruh elemen hardcoded hex color di Audit Tab, Product Approval Tab, ZISWAF/Purification Tab, LHPS Report Tab, dan global class `.glass-dark` telah dikonversi sepenuhnya ke variabel CSS semantik tema-agnostik.
    - **Verifikasi Browser Otomatis**: Pengujian visual dengan *browser subagent* otonom mengkonfirmasi seluruh elemen UI sangat mudah dibaca, formal, dan berwibawa di kedua mode (Terang & Gelap).

- **2026-05-30 (Sesi Malam — Finalisasi AI Chatbot & DPS Audit Infrastructure)**:
    - **Multi-Model Gemini Cascade**: Implementasi sistem *cascade* model AI (gemini-2.5-flash → gemini-1.5-flash) untuk menghindari ketergantungan model tunggal dan mencegah halusinasi.
    - **DPS Audit Endpoint**: Finalisasi `/api/ai/audit-contract/route.ts` dengan integrasi Supabase service role dan RAG context retrieval berbasis jenis akad.
    - **Dossier Portofolio Debitur**: Penyempurnaan tampilan dossier debitur (jaminan, kelayakan bisnis, dan DSCR) yang terpicu oleh pilihan kontrak di tab Audit Pembiayaan.
    - **Konfigurasi Gemini API Key Terbaru**: Validasi dan penggantian API key format `AQ.` yang aktif di `.env.local` untuk memastikan kelancaran koneksi ke Google AI Studio.

- **2026-05-30 (Sesi Pagi - Pemantapan Pipeline AI RAG, Gemini 429 Auto-Retry, & Manajemen Kategori)**:
    - **Resolusi Gemini API & Deprekasi Model**: Migrasi total dari model usang `text-embedding-004` yang telah dimatikan Google ke model aktif `gemini-embedding-001`. Berhasil memverifikasi konektivitas kunci API format baru `AQ.` di peramban dan server Next.js.
    - **Penyembuhan Otomatis Kuota (Rate Limit 429)**: Memasang mekanisme *Exponential Backoff* & *Auto-Retry* selama 3 detik (hingga 3x percobaan) di `ai.service.ts` untuk mengatasi penolakan kuota gratisan per menit dari Google secara senyap di latar belakang.
    - **Refaktor Kategori Dasbor RAG**: Menata ulang kategori RAG untuk memisahkan Regulasi Pemerintah dengan PSAK, menyatukan IAI & PSAK menjadi satu kategori `IAI_PSAK` (Standar Akuntansi & PSAK (IAI)), serta menambahkan kategori baru **Sumber Buku / Kitab Fikih**.
    - **Pembersihan Basis Data Otomatis**: Menambahkan fitur penghapusan dokumen secara aman dengan dialog konfirmasi untuk membuang dokumen usang atau zero-vector dari database.
    - **Bypass RLS Ingesti Sisi Server**: Memperbarui `/api/ai/ingest/route.ts` agar mendukung penggunaan `SUPABASE_SERVICE_ROLE_KEY` secara aman untuk melewati Row Level Security (RLS) di sisi server, menyelesaikan galat *permission denied* saat memproses vektor baru.
    - **Auto-Migration Data Kategori**: Menjalankan migrasi otomatis di peramban untuk memindahkan seluruh dokumen kategori lama `REGULASI` dan `IAI` ke kategori terpadu `IAI_PSAK` secara aman dan instan tanpa kehilangan data fatwa yang telah terbentuk sebelumnya.
- **2026-05-29 (Sesi Malam - Perluasan Dashboard DPS & Integrasi Riil RAG Ingestion)**:
    - **Penyelesaian 5 UI Utama DPS**: Membangun 5 modul visual premium: Shariah Health Score Dashboard, Audit Pembiayaan Split-Screen, Manajemen Akad & Produk baru, Pengawasan Pendapatan Non-Halal, dan Generator Laporan RAT.
    - **Integrasi Vektorisasi Riil (RAG Ingestion)**: Mengganti simulasi (mock) ingesti dengan endpoint riil `/api/ai/ingest` yang memproses OpenAI Embeddings dan menyimpannya ke database pgvector `sharia_knowledge`.
    - **Split-Screen Viewer**: Membuat visualisasi dokumen fisik akad syariah bergaya kertas klasik dengan penyorotan (highlight) klausul sensitif secara otomatis oleh AI.
    - **Ekspor PDF Laporan RAT**: Mengintegrasikan library `jsPDF` untuk menghasilkan dan mengunduh dokumen resmi Laporan Hasil Pengawasan Syariah ber-kop surat resmi dan bertanda tangan elektronik secara klien-side.
- **2026-05-29 (Sesi Sore - Finalisasi Modul Teller Terminal & Standardisasi Readability)**:
    - **Penyelesaian & Sinkronisasi Sif Kasir**: Shift Teller sekarang terintegrasi penuh ke database Supabase `teller_shifts`, mendukung auto-resume shift aktif saat masuk sistem.
    - **Protokol Verifikasi Fisik KTP & Kartu Anggota**: Mengubah alur penarikan dari PIN rahasia ke pencocokan fisik KTP & Kartu Anggota oleh Teller dengan input Nomor Kartu Anggota (tercatat jelas di Buku Jurnal dan struk penarikan).
    - **Laporan Keuangan Konsolidasi & Mutasi Normatif Anggota**: Tabulasi interaktif Simpanan, Utang Pembiayaan aktif, Neraca Bersih, dan tombol Cetak Laporan Konsolidasi Normatif berformat formal syariah.
    - **Kalkulator Denominasi Kas Fisik**: Mengintegrasikan kalkulator pecahan lembaran uang tunai di panel Setoran untuk kenyamanan input kas.
    - **Standardisasi Skala Typography Laptop**: Memperbesar ukuran teks input, nominal, penjelasan akad syariah, status keaktifan rekening, dan total saldo hingga skala `13px` - `36px` tebal agar sangat terbaca di layar laptop teller.
    - **Pembersihan Visual Baku Koperasi**: Menghapus seluruh emoji informal dan ikon dekorasi non-profesional dari seluruh panel dan struk, digantikan dengan status modern berbasis CSS.

- **2026-05-22 (Sesi Malam - Finalisasi Pelaporan SAK EP & Integrasi COA)**:
    - **Pembaruan Basis COA**: Memigrasi referensi Chart of Accounts (COA) dari *hardcoded* statis ke pemetaan komprehensif berdasarkan spreadsheet Koperasi standar (Kode 1-7).
    - **Otomatisasi Laporan Keuangan**: Menyelesaikan seluruh modul laporan SAK EP (Neraca, Laba Rugi Komprehensif, Perubahan Ekuitas, dan Arus Kas Metode Tidak Langsung) yang berjalan dinamis secara real-time berdasarkan entri jurnal di `AccountingDashboard.tsx`.
    - **Fitur Cetak Enterprise**: Mengimplementasikan logika *print-ready* CSS (Hitam-Putih murni, resolusi masalah *cut-off* dengan *overflow override*, dan garis tata letak akuntansi klasik) untuk mengekspor Laporan Keuangan SAK EP setara *software enterprise*.
    
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
