Product Requirements Document (PRD)
Nama Produk: IQ-RA System (Platform Keuangan Mikro Syariah Terintegrasi AI)
Versi: 1.4
Tanggal Dokumen: 4 Juni 2026
1. Ringkasan Eksekutif (Executive Summary)
IQ-RA System adalah platform perangkat lunak komprehensif berbasis web dan mobile yang dirancang khusus untuk Koperasi Simpan Pinjam Syariah (KSPS). Sistem ini bertujuan untuk mentransformasi operasional koperasi dari sistem legacy (pihak ketiga) menuju ekosistem digital mandiri yang adaptif, stabil, transparan, dan sesuai syariah.
Nilai jual utama (USPs) dari IQ-RA System adalah integrasi Retrieval-Augmented Generation (RAG) sebagai Smart Decision Support System untuk merekomendasikan kesesuaian akad pembiayaan, serta arsitektur akuntansi bawaan yang secara native mematuhi SAK EP dan regulasi PSAK Syariah terbaru (401-407).
2. Latar Belakang & Pernyataan Masalah
Berdasarkan analisis operasional harian KSPS dan rancangan teknis, IQ-RA System dikembangkan untuk memecahkan masalah berikut:
1.     Subjektivitas & Risiko Pembiayaan: Penentuan jenis akad (Murabahah, Musyarakah, dll) saat ini sangat bergantung pada analisis manual Account Officer (AO). Kesalahan penentuan berisiko menyalahi fiqih muamalah.
2.     Tantangan Kepatuhan Akuntansi (PSAK Baru & SAK EP): Sistem lama (legacy app) kesulitan beradaptasi dengan standar PSAK baru dan kewajiban adopsi SAK EP per 2025, memaksa proses manual di akhir tahun.
3.     Ketergantungan Infrastruktur Pihak Ketiga: Koperasi sering mengalami kendala downtime jaringan/server karena menggunakan sistem sewa penuh (SaaS vendor), menghambat pelayanan anggota.
4.     Isolasi Sistem & Literasi Anggota: Kebutuhan akan satu core system yang menyatukan teller, mobile banking anggota, dan integrasi pihak ketiga (API Transfer antar bank, PPOB) secara lancar dengan pencatatan otomatis (auto-reconciliation).
3. Target Pengguna & Hak Akses (Role-Based Access)
Sistem menerapkan Row-Level Security (RLS) berjenjang sesuai prosedur operasi KSPS:
Peran (Role)
	Tanggung Jawab Utama
	Batasan Akses
	Teller
	Input penerimaan (simpanan) dan pengeluaran kas harian.
	Hanya modul kasir; tidak dapat mengakses/memproses pembiayaan.
	Customer Service
	Pendaftaran anggota baru, pembukaan rekening, cek saldo.
	Manajemen keanggotaan; tidak mengelola kas atau pembiayaan.
	Account Officer (AO)
	Menganalisis kapasitas anggota, input data jaminan, dan verifikasi lapangan.
	Fokus pada modul pipeline pembiayaan & rekomendasi AI.
	Manajer / Komite
	Pengambilan keputusan akhir, approval pencairan pembiayaan.
	Akses dashboard analitik, approval berjenjang.
	Accounting
	Pembukuan internal, jurnal harian, koreksi, dan cetak laporan.
	Verifikasi transaksi; tidak melakukan transaksi fisik.
	Super Admin (IT & Ops)
	Kontrol penuh infrastruktur IT dan akses operasional ke seluruh modul sistem.
	Akses mutlak (Root) ke seluruh fitur teknis, parameter sistem, dan modul operasional staf. Memiliki kendali penuh atas manajemen tema dan pengaturan UI sistem.
	Anggota (Mobile)
	Cek saldo, transfer, bayar tagihan (PPOB), pengajuan awal.
	Hanya melihat data miliknya (Client-facing app).
	4. Fitur Utama & Kebutuhan Fungsional
4.1. Modul IQ-RA RAG Engine (Asisten Rekomendasi Akad)
●      Deskripsi: AI yang menganalisis input dari AO (tujuan, profil anggota, jaminan) dan memberikan rekomendasi akad berbasis knowledge base (Fatwa DSN-MUI, SOP Koperasi).
●      Fitur:
○      Form input parameter pembiayaan (tujuan modal kerja/konsumtif/investasi).
○      Similarity search ke database vektor hukum syariah.
○      Output: Skor kecocokan akad (misal: 90% Murabahah, 40% Mudharabah), mitigasi risiko, dan syarat administrasi tambahan.
○      Otomasi Dokumen Legal (Dynamic Contract PDF): Pembangkitan dokumen akad legal secara instan di sisi klien (browser) sesaat setelah rekomendasi AI disetujui secara manual oleh pengurus, mencakup klausul dinamis berdasarkan jenis akad (Bagi Hasil/Jual Beli) tanpa membebani server backend.
4.2. Modul Core Banking Syariah
●      Manajemen Keanggotaan (CIF - KYC & APU-PPT Lengkap): Satu CIF untuk multi-rekening (simpanan & pembiayaan). Terintegrasi dengan fitur cek rekam jejak kredit (PI Checking internal). Pendaftaran anggota dikemas dalam formulir premium 4 bagian:
  1. **A. Data Pribadi (Sesuai KTP)**: NIK, Tempat/Tgl Lahir, Jenis Kelamin, Status Pernikahan, Nama Ibu Kandung, Agama, & Kewarganegaraan (WNI/WNA).
  2. **B. Data Kontak & Alamat**: WhatsApp, Email, Alamat KTP, dan Alamat Domisili saat ini (yang dilengkapi dengan **Toggle efisiensi "Sama dengan KTP"**).
  3. **C. Data Pekerjaan & Keuangan (APU-PPT)**: Jenis Pekerjaan / Profesi, Nama Perusahaan / Bidang Usaha, Estimasi Pendapatan Bulanan, serta deklarasi wajib **Sumber Dana**.
  4. **D. Data Ahli Waris**: Nama Ahli Waris, Hubungan Keluarga, & Kontak WhatsApp Ahli Waris untuk perlindungan saldo simpanan.
●      Siklus Penerimaan Kas: * Simpanan umum (Wadiah Yad Dhamanah).
○      Simpanan khusus (Haji, Umrah).
○      Penerimaan angsuran pembiayaan.
●      Siklus Pengeluaran Kas (Pembiayaan):
○      Dukungan untuk akad: Murabahah (Jual Beli - mayoritas), Musyarakah, Mudharabah, dan Qardhul Hasan (Kesehatan/Pendidikan).
○      Engine perhitungan Nisbah (bagi hasil) dan margin.
4.3. Modul Akuntansi SAK EP & PSAK (Otomasi Laporan)
●      Deskripsi: Buku besar (General Ledger) yang real-time dengan standar PSAK Syariah terbaru.
●      Fitur:
○      Double-entry bookkeeping otomatis dari setiap transaksi Teller.
○      Sistem Open-Close harian untuk validasi kas.

---

## 1. Ringkasan Eksekutif

IQ-RA System adalah platform perangkat lunak komprehensif berbasis web yang dirancang khusus untuk Koperasi Simpan Pinjam Syariah (KSPS). Nilai jual utama (USPs) adalah integrasi RAG sebagai Smart Decision Support System dan arsitektur akuntansi yang secara native mematuhi SAK EP dan PSAK Syariah (401-407).

---

## 2. Latar Belakang & Pernyataan Masalah

1. **Subjektivitas & Risiko Pembiayaan:** Penentuan akad bergantung analisis manual AO, berisiko menyalahi fiqih muamalah.
2. **Tantangan Kepatuhan Akuntansi:** Kewajiban adopsi SAK EP per 2025.
3. **Ketergantungan Infrastruktur Pihak Ketiga:** Downtime sistem sewa SaaS menghambat pelayanan.
4. **Isolasi Sistem:** Kebutuhan satu core system yang menyatukan teller, CS, AO, dan mobile banking.

---

## 3. Target Pengguna & Hak Akses (RBAC)

| Peran | Tanggung Jawab | Batasan Akses |
|---|---|---|
| **Teller** | Input penerimaan & pengeluaran kas harian via 6 UI Utama | Hanya modul kasir |
| **Customer Service** | Pendaftaran anggota, pembukaan rekening, cek saldo | Manajemen keanggotaan |
| **Account Officer (AO)** | Analisis kapasitas anggota, verifikasi lapangan | Modul pembiayaan & AI |
| **Manajer / Komite** | Approval pencairan pembiayaan | Dashboard analitik, approval |
| **Accounting** | Pembukuan, jurnal, koreksi, cetak laporan | Verifikasi; tidak transaksi fisik |
| **Super Admin (IT)** | Kontrol penuh infrastruktur, audit keamanan, backup, manajemen COA, dan delegasi tugas | Akses mutlak seluruh fitur |
| **Anggota (Mobile)** | Cek saldo, transfer, bayar tagihan | Hanya data milik sendiri |

---

## 4. Fitur Utama & Kebutuhan Fungsional

### 4.1. Modul IQ-RA RAG Engine
- Form input parameter pembiayaan (tujuan, profil anggota, jaminan) dan antarmuka tanya-jawab syariah interaktif.
- Similarity search ke database vektor fatwa DSN-MUI menggunakan model `gemini-embedding-001`.
- Output: Skor kecocokan akad, mitigasi risiko, syarat administrasi, serta respons penjelasan syariah yang lengkap (kapasitas output s/d 4096 token) dan runut.
- Optimasi Latensi & Keandalan: Pembatasan Unified Context RAG ke 120.000 karakter untuk mengeliminasi downtime akibat timeout koneksi Next.js, dipadukan dengan parser line-by-line pada UI Chatbot untuk mencegah teracaknya pesan.

### 4.2. Modul Core Banking Syariah

#### 4.2.1. Manajemen Keanggotaan (CIF — KYC & APU-PPT)
Formulir pendaftaran premium 4 bagian:
1. **A. Data Pribadi (KTP):** NIK, Tempat/Tgl Lahir, Jenis Kelamin, Status Pernikahan, Nama Ibu Kandung, Agama, Kewarganegaraan.
2. **B. Data Kontak & Alamat:** WhatsApp, Email, Alamat KTP, Domisili (Toggle "Sama dengan KTP").
3. **C. Data Pekerjaan & Keuangan (APU-PPT):** Profesi, Perusahaan/Bidang Usaha, Pendapatan Bulanan, Sumber Dana.
4. **D. Data Ahli Waris:** Nama, Hubungan, Kontak WhatsApp.

#### 4.2.2. Layanan Kasir / Teller — 6 UI Utama *(Selesai)*

> Prinsip Desain: Padat informasi, bersih, keyboard-first navigation (shortcut 1–6), responsif untuk layanan loket cepat.

| # | Panel | Komponen Utama | Status |
|---|---|---|---|
| 1 | **🏠 Status Shift & Dasbor** | Badge Shift Aktif/Tutup, Cash on Hand real-time, 5 Transaksi Terakhir | ✅ Selesai |
| 2 | **🔍 Profil & Pencarian Anggota** | Search bar (ID/Nama/NIK), foto avatar inisial, status aktif, rekening simpanan, sisa plafon/tunggakan | ✅ Selesai |
| 3 | **💵 Setoran Tunai** | Pilihan rekening tujuan, input nominal, Kalkulator Denominasi (Rp100k/50k/20k/10k/5k/2k/1k), cetak slip | ✅ Selesai |
| 4 | **💸 Penarikan Tunai** | Saldo tersedia vs mengendap, verifikasi PIN/Catatan, Pop-up Otorisasi Supervisor (> Rp 5.000.000) | ✅ Selesai |
| 5 | **🧾 Pembayaran Angsuran** | Daftar kontrak aktif, rincian tagihan (Pokok/Jasa/Denda), opsi bayar (Sesuai/Sebagian/Uang Muka) | ✅ Selesai |
| 6 | **🔑 Buka / Tutup Shift** | Form Cash-In awal, rekonsiliasi akhir (sistem vs fisik), kolom Keterangan Selisih, log shift harian | ✅ Selesai |
| 7 | **💳 Pencairan Dana (Disbursement)** | Daftar kontrak siap cair, metode pencairan (Tunai/Transfer), On-the-fly Account Creator, dual-ledger routing otomatis | ✅ Selesai |

### 4.3. Modul Akuntansi SAK EP & PSAK
- Double-entry bookkeeping otomatis dari setiap transaksi Teller.
- Sistem Open-Close harian untuk validasi kas.
- Auto-generate Laporan: Neraca, Laba Rugi, Arus Kas, Dana Kebajikan/Zakat.
- Menggunakan data *Chart of Accounts* (COA) dinamis yang bersumber dari tabel `coa_accounts` (Telah di-seed 200+ akun SAK EP resmi).

### 4.4. Infrastruktur IT (Super Admin)
Pusat kendali tata kelola TI untuk memastikan stabilitas dan keamanan platform:
- **Manajemen Akses & Auth**: Otorisasi pembuatan akun staf dengan enkripsi *role-based*.
- **Log Audit Keamanan**: Rekam jejak *immutable* (`audit_logs`) dari setiap perubahan sistem, konfigurasi, dan penugasan role.
- **Diagnostik Real-time**: Monitoring status koneksi Supabase, PING latensi, dan model AI.
- **Manajemen Konfigurasi Sistem**: UI CRUD untuk mengubah parameter AI (Context, Token) dan batas nominal otorisasi keuangan secara *live*.
- **Pencadangan Sistem (Backup)**: Fungsionalitas ekspor parameter dan COA ke dalam fail JSON ber-timestamp.
- **Manajemen COA Dinamis**: Antarmuka CRUD untuk memanipulasi pos-pos akuntansi tanpa harus intervensi database manual.
- **Penugasan Staf (Ticketing)**: Kanban-style task delegation untuk instruksi operasional internal antar staf.

### 4.4. Integrasi Third-Party & Mobile
- API Payment Gateway (Flip API) untuk transfer antar bank.
- Integrasi PPOB (pulsa, token PLN, e-wallet).
- IQ-RA Mobile Gateway untuk anggota.

---

## 5. Desain UI/UX — Standar Premium Sharia FinTech

- **Halaman Publik (DIKUNCI):** Homepage, Login, Register — tidak boleh diubah.
  - Homepage: Navbar + Logo `56px`, Hero glassmorphism emerald, jarak navbar–kontainer diperkecil.
  - Kontainer utama: `rgba(4, 49, 33, 0.75)`, border gold `rgba(204, 163, 52, 0.55)`.
- **Dashboard Staff:** Sidebar kolapsibel, CSS Variables `var(--bg-page)`, Light/Dark Mode.
- **Teller Terminal:** Keyboard-first, shortcut `[1]`–`[6]` untuk navigasi panel tanpa mouse.

---

## 6. Kebutuhan Non-Fungsional

1. **Ketersediaan:** SLA 99.9% via Vercel + Supabase.
2. **Keamanan:** Enkripsi password, anti-DDoS, auto-logout, audit log.
3. **Integritas Data:** ACID compliance, transaksi database untuk double-entry.

---

## 7. Peta Jalan Implementasi (Roadmap)

| Fase | Lingkup | Status |
|---|---|---|
| **Fase 1** — Fondasi & Migrasi | Setup Next.js, Supabase, RLS, SonarCloud, migrasi data awal | ✅ Selesai |
| **Fase 2** — Core Banking & Akuntansi | Modul Teller (6 UI), CS, Accounting, COA SAK EP | ✅ Selesai |
| **Fase 3** — RAG AI, DPS & Standarisasi | Ingesti fatwa DSN-MUI ke pgvector, LangChain, 6 Panel DPS, Standarisasi UI/UX Tema | ✅ Selesai |
| **Fase 4** — Testing, UAT & Go-Live | UAT formal, Blackbox testing, RLS Audit, Notifikasi UI, CKPN NPL, Domain Produksi, Data Migration | 🟡 Aktif (~87% MVP) |
| **Fase 5** — Integrasi & Mobile | Payment Gateway (Flip API), PPOB, IQ-RA Mobile Gateway, Push Notification, Simpanan Haji/Umrah | ⏳ Menunggu |

**Sprint Aktif:** RLS Audit Menyeluruh, UAT Formal bersama staf KSPPS, Implementasi Notifikasi UI, Auto-Provisioning CKPN, dan Setup Domain Produksi (Fase 4).

> **Lihat:** `BACKLOG.md` untuk daftar lengkap 9 item gap yang harus diselesaikan sebelum Go-Live.

> File utama yang harus diperhatikan: `src/components/dashboard/DPSDashboard.tsx`, `src/app/globals.css`, `src/app/api/ai/audit-contract/route.ts`

---

## 8. Catatan Inovasi Arsitektur (Pengembangan End-to-End)

Dokumen ini mencatat berbagai inovasi teknis dan alur bisnis (*business logic*) yang berhasil ditemukan dan diimplementasikan selama proses penyempurnaan sistem:

1. **On-the-fly Account Creator (Pembuatan Rekening Instan):** Pada Modul Pencairan Dana (Disbursement) di Terminal Teller, sistem dapat mendeteksi apakah nasabah sudah memiliki Rekening Simpanan Wadiah. Jika belum, dan Teller memilih metode pencairan "Transfer ke Rekening", sistem otomatis membuatkan nomor rekening baru di latar belakang (*background*) dalam hitungan milidetik, tanpa memaksa Teller pindah ke menu Customer Service.
2. **Straight-Through Processing (STP) pada Distribusi EOM:** Distribusi Bagi Hasil (End of Month) tidak lagi sekadar entri agregat. Algoritma kini menarik seluruh data rekening Mudharabah, mengkalkulasi porsi bagi hasil (*Nisbah*) proporsional, dan secara riil menambahkan nominal uang ke dalam tabel `savings_accounts` milik setiap anggota beserta riwayat transaksinya, sebelum mem-posting jurnal agregat ke Buku Besar.
3. **Seamless CIF Pipeline (Siklus Pengajuan Tanpa Celah):** Form Prospek Pembiayaan Account Officer (AO) menggunakan Dropdown Berbasis CIF (Customer Information File). Ini menjamin bahwa parameter `member_id` selalu terikat kuat sejak tahap AI RAG hingga Otorisasi Manajer, sehingga Teller dapat langsung menemukan tagihan pencairan dana berdasarkan nama anggota tanpa celah logika.
4. **Dynamic Dual-Ledger Routing:** Saat melakukan pencairan pembiayaan (*Disbursement*), algoritma akuntansi mem-bypass destinasi akun Kredit berdasarkan metode: "Uang Tunai" mengkredit Kas (`101.01`), sedangkan "Transfer" mengkredit Simpanan Wadiah (`201.01`). Sisi Debit otomatis memetakan COA yang sesuai dengan hukum syariah (Murabahah, Qardh, dll).
