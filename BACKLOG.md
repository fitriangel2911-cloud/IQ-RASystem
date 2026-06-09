# IQ-RA System — Project Backlog

Dokumen ini digunakan untuk melacak kemajuan pengembangan IQ-RA System (Platform Keuangan Mikro Syariah berbasis RAG).

> **Status Terkini (4 Juni 2026):** Fase III 100% selesai. Fase IV (UAT & Go-Live) sedang berjalan. Estimasi kemajuan MVP keseluruhan: **~87%**. Seluruh core flow sudah berfungsi (registrasi anggota → AI RAG → DPS audit → pencairan → akuntansi). Terdapat 9 item prioritas sebelum Go-Live yang harus diselesaikan (lihat bagian Fase IV).

---

## Selesai (Completed)

### Fondasi & Infrastruktur
- [x] Inisialisasi Project (Next.js 15+, TypeScript, Tailwind CSS).
- [x] Integrasi Supabase (Auth, Database, Storage, pgvector).
- [x] Setup UI Dashboard Premium (Dark Emerald & Gold Aesthetic, Glassmorphism).
- [x] Konfigurasi Role-Based Access Control (RBAC) — 7 role.
- [x] CI/CD Pipeline: GitHub Actions + SonarCloud Quality Gate.
- [x] Deploy ke Vercel (staging).
- [x] **Infrastruktur IT Super Admin:** UI & Logika CRUD untuk Audit Logs, Diagnostik Sistem, Backup JSON, Manajemen COA Dinamis, dan Ticketing Staf.
- [x] **Audit & Sinkronisasi Tabel Supabase:** 16 tabel dipetakan, diverifikasi, dan dihubungkan ke migration SQL. Tabel `notifications` & `access_rules` dibuat. `SUPABASE_TABLES.md` dan `supabase/tables_map.json` sebagai referensi. `MASTER_PATCH.sql` tersedia untuk patch aman.

### Manajemen Pengguna & Auth
- [x] Sistem Login & Registrasi (Glassmorphism emerald, dikunci).
- [x] Manajemen Profil Pengguna.
- [x] 7 Role: Super Admin, Manager, DPS, AO, Accounting, Teller, Customer Service.
- [x] Fitur Auto-confirm untuk staf (Migration).
- [x] Fix profile fetch error PGRST116 dengan auto-creation fallback (`de91c1a`).

### Antarmuka Dashboard (UI/UX) — Semua Role
- [x] **Dashboard Member (Portal Anggota):** Overview, Rekening, Transaksi, Pembiayaan, Profil, AI Chatbot — Floating App glassmorphism.
- [x] **Dashboard Teller:** 7 Panel (Shift Dashboard, Profil Anggota, Setoran, Penarikan, Angsuran, Buka/Tutup Shift, Disbursement Pencairan).
- [x] **Dashboard Customer Service:** CIF 4-bagian KYC/APU-PPT lengkap.
- [x] **Dashboard Account Officer (AO):** Pipeline prospek, AI RAG analysis, approval, disbursement.
- [x] **Dashboard Manager:** Ringkasan eksekutif, approval berjenjang, analitik.
- [x] **Dashboard Accounting:** Jurnal, buku besar, 4 laporan SAK EP, cetak enterprise.
- [x] **Dashboard DPS (6 Panel):** Shariah Health Score, Audit Split-Screen, Manajemen Akad, ZISWAF Purification, Generator LHPS PDF, RAG Knowledge Manager.
- [x] **Dashboard Super Admin:** Audit Logs, Diagnostik Real-time, Backup JSON, Manajemen COA CRUD, Ticketing Penugasan Staf, Dynamic Parameter Engine.
- [x] Light Mode & Dark Mode via CSS Variables (ThemeContext).
- [x] Standardisasi UI DPS: High-Contrast white cards, gold/green borders, WCAG AA/AAA.

### Keanggotaan & Otomasi Koperasi
- [x] Pendaftaran Anggota Terintegrasi: CIF, profil KYC/APU-PPT, buat akun login otomatis.
- [x] Otomasi pembuatan 3 rekening simpanan: Pokok (11xxxx), Wajib (12xxxx), Wadiah (21xxxx).
- [x] Auto-journaling Double-Entry SAK EP saat registrasi CIF.
- [x] Kode unik 3 digit dari akhiran WhatsApp untuk rekonsiliasi kas.

### Operasional Keuangan (Siklus Kas Teller)
- [x] Setoran Tunai dengan Kalkulator Denominasi Kas Fisik.
- [x] Penarikan Tunai dengan Otorisasi Supervisor (> Rp 5.000.000).
- [x] Pembayaran Angsuran (Pokok / Jasa / Denda, opsi bayar sebagian).
- [x] Buka/Tutup Shift dengan rekonsiliasi fisik vs sistem.
- [x] Pencairan Pembiayaan (Disbursement) — Panel 7 Teller, dual-ledger routing (Tunai vs Transfer).
- [x] Verifikasi fisik KTP & Kartu Anggota.
- [x] Distribusi Bagi Hasil EOM (End of Month) — Straight-Through Processing per rekening Mudharabah.
- [x] Pengakuan Margin Angsuran otomatis.

### AI & RAG Engine
- [x] LangChain.js untuk orkestrasi RAG.
- [x] pgvector (1536-dim) + tabel `sharia_knowledge`.
- [x] Model Embedding: `gemini-embedding-001` (migrasi dari `text-embedding-004` yang deprecated).
- [x] Model LLM: `gemini-2.5-flash` (cascade fallback `gemini-1.5-flash`).
- [x] Auto-retry 3x + Exponential Backoff untuk rate limit 429 Google.
- [x] Optimasi konteks RAG: batas 120.000 karakter, fallback similarity search top-30.
- [x] Endpoint `/api/ai/ingest` dengan Server-Side RLS bypass via Service Role Key.
- [x] Endpoint `/api/ai/audit-contract` untuk opini kepatuhan DPS.
- [x] AI Chatbot line-by-line renderer (urutan pesan tidak acak).
- [x] maxOutputTokens dinaikkan ke 4096 untuk jawaban syariah lengkap.
- [x] 5 kategori knowledge base: DSN-MUI, SOP, IAI_PSAK, REGULASI, BUKU_FIKIH.
- [x] Hapus dokumen RAG dengan konfirmasi aman.

### Manajemen Akad & DPS
- [x] Ingesti & vektorisasi dokumen fatwa syariah.
- [x] Audit Pembiayaan Split-Screen (data sistem + dokumen fisik akad).
- [x] Validasi Rukun Akad otomatis oleh AI.
- [x] Pengawasan Dana Non-Halal & Distribusi ZISWAF.
- [x] Generator Laporan Hasil Pengawasan Syariah (LHPS) — ekspor PDF via jsPDF.
- [x] Persetujuan Produk Baru dengan RAG search fatwa.

### Pelaporan SAK EP & Akuntansi
- [x] Laporan Posisi Keuangan (Neraca).
- [x] Laporan Laba Rugi Komprehensif.
- [x] Laporan Arus Kas (Metode Langsung/Tidak Langsung).
- [x] Laporan Perubahan Ekuitas.
- [x] Chart of Accounts (COA) 202 akun SAK EP — di-seed dari CSV ke `coa_accounts`.

---

## Fase IV — UAT, Testing & Go-Live (Prioritas Sekarang)

### KRITIS — Harus Selesai Sebelum Go-Live

- [ ] **[KRITIS] Audit Row-Level Security (RLS) Menyeluruh** — Verifikasi policy RLS di semua 16 tabel untuk 7 role. Cegah cross-role data access. Gunakan Supabase RLS Policy Editor + test manual per role.
- [ ] **[KRITIS] User Acceptance Testing (UAT) — Sesi Formal** — Buat skenario test script tertulis untuk setiap role (Teller, AO, DPS, CS, Manager, Accounting). Lakukan simulasi transaksi harian bersama user asli KSPPS.
- [ ] **[KRITIS] Blackbox Testing End-to-End** — Uji alur lengkap: registrasi anggota → pengajuan pembiayaan → audit DPS → approval Manager → pencairan Teller → pencatatan akuntansi → laporan SAK EP.

### TINGGI — Target Sebelum Go-Live

- [ ] **[TINGGI] Notifikasi Real-time (UI)** — Tabel `notifications` sudah ada di database. Perlu dibuat: trigger/insert otomatis saat event penting (transaksi besar, approval, jatuh tempo) dan UI notifikasi bell icon di semua dashboard.
- [ ] **[TINGGI] Auto-Provisioning CKPN (NPL)** — Implementasi logika pencadangan otomatis untuk pembiayaan macet >90 hari sesuai business rules & SAK EP. Debit COA CKPN, Kredit Cadangan Piutang.
- [ ] **[TINGGI] Deployment Domain & SSL Produksi** — Setup custom domain KSPPS + sertifikat HTTPS produksi di Vercel. Konfigurasi environment secrets produksi.
- [ ] **[TINGGI] Migrasi Data Awal (Data Seeding)** — Import data anggota & akad aktif dari sistem lama ke Supabase produksi (jika ada data historis).
- [ ] **[TINGGI] Load Testing / Stress Test** — Uji performa paralel sistem RAG dan endpoint AI di bawah beban pengguna simultan.

### SEDANG — Bisa Dilakukan Paralel atau Pasca Go-Live Awal

- [ ] **[SEDANG] Modul Simpanan Khusus (Haji/Umrah)** — Tambah jenis rekening bertujuan khusus di CS Dashboard (Simpanan Haji, Simpanan Umrah) dengan COA terpisah.
- [ ] **[SEDANG] PI Checking Internal (Blacklist Anggota)** — Mekanisme flagging/blacklist anggota bermasalah di CIF. Cegah pengajuan pembiayaan baru jika ada tunggakan macet.
- [ ] **[SEDANG] Laporan ZISWAF Terpisah (Accounting)** — Tab laporan khusus "Sumber & Penyaluran Dana Kebajikan/Zakat" di Accounting Dashboard, terpisah dari laporan aset komersial.
- [ ] **[SEDANG] Training Pengguna** — Sesi pelatihan singkat + SOP digital per role staf operasional.

---

## Fase V — Post Go-Live (Jangka Panjang)

- [ ] **Integrasi Payment Gateway (Flip API)** — Transfer antar bank real-time.
- [ ] **Integrasi PPOB** — Pulsa, token PLN, e-wallet.
- [ ] **IQ-RA Mobile Gateway** — API untuk anggota mengakses data mandiri via mobile.
- [ ] **Notifikasi Push/WhatsApp** — Notifikasi jatuh tempo angsuran, saldo masuk, laporan berkala.
- [ ] **Dashboard Anggota Mobile** — Versi ringkas cek saldo, mutasi, riwayat angsuran mandiri.

---

## Catatan Perubahan Terbaru

- **2026-06-09 (UI Polishing & Vercel Sync)**:
    - Memperbaiki isu "Tampilan Lama" untuk role `anggota` pada portal members. Memastikan pengalihan rute (redirect) dashboard untuk akun lama (role `anggota` dan `member`) mengarah ke UI portal anggota yang baru.
    - Sinkronisasi build Vercel. Mengatasi diskrepansi antara *localhost* dan Vercel dengan sinkronisasi rute dan perbaikan role mapping.
    - Dokumentasi `doc/` dan `BACKLOG.md` disesuaikan dengan progres.

- **2026-06-08 (Penyempurnaan Modul UAT & Maker-Checker)**:
    - **Teller Maker-Checker Workflow:** Penyempurnaan alur otorisasi penarikan. Penarikan di atas limit wajib disetujui Manager, namun eksekusi kas dan penjurnalan dipusatkan di Teller.
    - **Data Parity CS ke AO:** Sinkronisasi FPP (Formulir Pengajuan Pembiayaan) dan dossier dokumen KYC/APU-PPT. Menjamin data pekerjaan, objek akad, dan agunan tersambung sempurna dari Customer Service ke modal CIF di dashboard AO.
    - **Akuntansi STP:** Perbaikan *Straight-Through Processing* akuntansi di dashboard Manager dan Accounting.

- **2026-06-04 (Audit Kemajuan)**:
    - **Audit menyeluruh** dilakukan terhadap seluruh modul, route, komponen, dan dokumentasi.
    - **Estimasi kemajuan MVP: ~87%** dari target Fase I–IV.
    - **9 gap teridentifikasi** sebelum Go-Live: RLS audit, UAT formal, notifikasi UI, CKPN, domain produksi, data migration, load testing, simpanan khusus, PI checking.
    - **Panel 7 Teller (Disbursement)** dikonfirmasi sudah ada (`Panel7Disbursement.tsx`) — backlog diperbarui.
    - Seluruh dokumentasi `doc/` dan `BACKLOG.md` diperbarui agar selaras dengan kondisi aktual kode.

- **2026-06-02 (Finalisasi Super Admin IT & Data Seeding COA)**:
    - UI CRUD lengkap 5 panel Super Admin: Audit Logs, Diagnostik Real-time, Backup JSON, COA CRUD, Grid Ticketing Staf.
    - Global Audit Trailing via `logSuperAdminAction` ke tabel `audit_logs`.
    - Data Seeding 202 akun COA dari `coa.csv` ke tabel `coa_accounts`.

- **2026-06-02 (Purifikasi Estetika DPS & Perbaikan Chatbot)**:
    - Hapus total emoji dari DPSDashboard, AIKnowledgeManager, RAGPipelineView, AIChatbot.
    - `maxOutputTokens` dinaikkan ke 4096 di `ai.service.ts`.
    - Ambang batas Unified Context turun dari 600.000 ke 120.000 karakter.
    - Parser chatbot dibangun ulang line-by-line untuk urutan pesan yang benar.

- **2026-05-31 (Standardisasi UI/UX DPS)**:
    - White card Light Mode menggantikan kontainer hijau.
    - 4 token border semantik CSS baru: `--border-success`, `--border-warning`, `--border-danger`, `--border-info`.
    - Teks hitam pekat (`#000000`) untuk kontras WCAG AA/AAA di Light Mode.

- **2026-05-30 (Finalisasi AI Chatbot & DPS Audit Infrastructure)**:
    - Multi-model Gemini cascade (gemini-2.5-flash → gemini-1.5-flash).
    - Finalisasi `/api/ai/audit-contract/route.ts` dengan RAG context audit DPS.
    - Dossier portofolio debitur (jaminan, DSCR) di tab Audit Pembiayaan.

- **2026-05-30 (Pemantapan Pipeline AI RAG)**:
    - Migrasi model embedding: `text-embedding-004` → `gemini-embedding-001`.
    - Auto-retry 429 + Exponential Backoff 3 detik, 3x percobaan.
    - Refaktor 5 kategori knowledge base RAG.
    - Bypass RLS ingesti server-side via `SUPABASE_SERVICE_ROLE_KEY`.

- **2026-05-29 (Finalisasi 5 UI DPS & Ingesti RAG Riil)**:
    - 5 modul visual DPS premium dibangun.
    - Endpoint riil `/api/ai/ingest` menggantikan mock.
    - Split-Screen Viewer dokumen fisik akad.
    - Ekspor PDF LHPS via `jsPDF`.

- **2026-05-29 (Finalisasi Teller Terminal)**:
    - Shift Teller integrasi penuh ke `teller_shifts` Supabase.
    - Verifikasi fisik KTP & Kartu Anggota pada penarikan.
    - Kalkulator Denominasi Kas Fisik di panel Setoran.

- **2026-05-22 (Finalisasi Pelaporan SAK EP)**:
    - 4 laporan SAK EP dinamis real-time berdasarkan entri jurnal.
    - Print-ready CSS (B/W) untuk ekspor setara software enterprise.

- **2026-05-19 (Pendaftaran CIF & Otomasi Simpanan)**:
    - Auto-create akun login role `member` saat registrasi fisik CIF.
    - Auto-generate 3 rekening simpanan (Pokok/Wajib/Wadiah).
    - Auto-journaling Double-Entry SAK EP untuk setoran awal + biaya ADM + infaq.

> **Panduan Sesi Baru:** Gunakan file ini bersama `doc/blueprint.md` sebagai referensi utama sebelum memulai setiap sesi pengembangan.
