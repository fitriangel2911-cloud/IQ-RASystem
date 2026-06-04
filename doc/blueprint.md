# Cetak Biru Sistem (Blueprint): IQ-RA System
**Platform Keuangan Mikro Syariah Terintegrasi AI — RAG & SAK EP**

**Versi:** 1.6 | **Diperbarui:** 4 Juni 2026 | **Kemajuan MVP:** ~87%

4.2. Siklus Penerimaan Kas (Revenue Cycle)
Mencakup mekanisme arus kas masuk. Sistem secara otomatis mencatat penerimaan simpanan sukarela (Wadiah Yad Dhamanah) serta merekam angsuran dari produk-produk pembiayaan anggota dengan sistem penjurnalan yang akurat.
4.3. Siklus Pengeluaran Kas (Expenditure Cycle)
Mengatur penyaluran dana untuk pembiayaan anggota (Murabahah, Mudharabah, Musyarakah, Ijarah, Istishna), biaya operasional koperasi, serta perhitungan distribusi bagi hasil (Nisbah) secara otomatis.
4.4. Rekomendasi Kepatuhan Syariah & Dynamic Contract (RAG Pipeline)
Layanan konsultasi dan alat bantu keputusan (decision support) berbasis AI yang mengekstraksi informasi dari korpus dokumen Fatwa DSN-MUI dan regulasi syariah guna merekomendasikan kesesuaian jenis akad pembiayaan secara sistematis sebelum disahkan. 
**Inovasi Dynamic Contract:** Sebagai kelanjutan langsung dari keputusan AI, setelah Account Officer melakukan persetujuan (approval) manual atas rekomendasi AI, sistem secara otomatis melakukan "Pembangkitan Dokumen Akad Legal" (PDF Generation) secara instan di sisi klien (*browser-side processing* menggunakan jsPDF). Inovasi ini menyatukan hasil analisis kepatuhan syariah dengan pembuatan dokumen kontrak hukum yang dinamis, memuat klausa spesifik (seperti Nisbah untuk Mudharabah atau Margin untuk Murabahah), serta meniadakan *human error* pengisian form manual tanpa membebani kinerja server backend.
4.5. Laporan Keuangan Berbasis SAK EP dan PSAK
Generasi otomatis laporan posisi keuangan, laporan laba rugi, laporan perubahan ekuitas, dan laporan arus kas yang memenuhi kriteria SAK EP, termasuk pemisahan akun sesuai ketentuan PSAK Syariah (401-407).

## 1. Ringkasan Eksekutif

IQ-RA System merupakan platform berbasis web komprehensif untuk transformasi operasional koperasi syariah menuju ekosistem digital yang adaptif, transparan, dan sesuai syariah. Sistem mengintegrasikan RAG sebagai decision support interaktif untuk rekomendasi akad pembiayaan, dengan standarisasi laporan keuangan otomatis berdasarkan SAK EP dan PSAK Syariah (401-407).

---

## 2. Matriks Fitur Utama

| Fitur | Deskripsi Manfaat | Target Pengguna |
|---|---|---|
| Rekomendasi Akad Berbasis RAG | Rekomendasi akad syariah & konsultasi fatwa real-time | AO / Manajer |
| Automasi Laporan SAK EP & PSAK | Laporan keuangan presisi sesuai standar akuntansi privat | Accounting / Admin |
| Core Banking Syariah (6 UI Teller) | Layanan kasir harian keyboard-first, padat informasi | Teller |
| CIF Management (KYC & APU-PPT) | Onboarding anggota 4-bagian, satu CIF multi-rekening | Customer Service |
| Dynamic Parameter Engine | Ubah nominal simpanan/biaya tanpa ubah kode | Super Admin |
| Flat Sidebar Super Admin | Navigasi audit langsung ke tugas spesifik | Super Admin |

---

## 3. Sistem Desain Antarmuka (Premium Sharia FinTech)

### 3.1. Prinsip Visual
- **Latar Belakang Animasi:** Pola geometris Islami 3D papercut putih abu-abu yang bergerak diagonal lambat (via `GlobalSiteBackground.tsx`).
- **Glassmorphism Emerald:** Kontainer utama `rgba(4, 49, 33, 0.75)` + blur `24px` + border gold `rgba(204, 163, 52, 0.55)`.
- **Palet Warna:**
  - Dark Emerald: `#043121` / `#084b35`
  - Metallic Gold: `#cca334` / `#f3c653` / `#a67e26`
  - Slate Arang: `#334155` / `#1e293b`

### 3.2. Halaman DIKUNCI (Final — Tidak Boleh Diubah)

| Halaman | File | Catatan Perubahan Terakhir |
|---|---|---|
| **Beranda** | `src/app/page.tsx` | Logo `56px`, hero padding dikurangi, profil section dinaikkan — *dikunci 24 Mei 2026* |
| **Login** | `src/app/login/` | Glassmorphism emerald, teks putih kontras tinggi |
| **Register** | `src/app/register/` | Desain selaras login |

### 3.3. Standar Dasbor Staff
- Sidebar kolapsibel dinamis dengan CSS Variables.
- Light Mode & Dark Mode via class `.light-mode` di root element.
- **Teller:** Keyboard-first, shortcut `[1]`–`[6]` untuk 6 panel tanpa mouse.

---

## 4. Modul Utama Sistem

### 4.1. Manajemen Keanggotaan (CIF — KYC & APU-PPT)

Onboarding terintegrasi anggota baru melalui formulir 4-bagian:
- **A. Data Pribadi (KTP):** NIK, Tempat/Tgl Lahir, Jenis Kelamin, Status, Nama Ibu, Agama, Kewarganegaraan.
- **B. Data Kontak & Alamat:** WhatsApp, Email, Alamat KTP, Domisili + Toggle "Sama dengan KTP".
- **C. Data Pekerjaan & Keuangan:** Profesi, Perusahaan, Pendapatan, Sumber Dana (APU-PPT).
- **D. Data Ahli Waris:** Nama, Hubungan, Kontak WhatsApp.

**Otomatisasi saat registrasi:**
1. Buat akun login role `member` + password sementara (berbasis NIK).
2. Generate 3 rekening simpanan (Pokok `11xxxx`, Wajib `12xxxx`, Wadiah `21xxxx`).
3. Posting jurnal double-entry SAK EP (parameter dari `system_parameters`).

### 4.2. Layanan Kasir / Teller — 6 UI Utama

> Status: **✅ Selesai** — 7 panel lengkap (Panel 7 Disbursement ditambahkan). Keyboard shortcut [1]–[6], shared state selectedMember, cetak struk, pop-up otorisasi supervisor, kalkulator denominasi, form buka/tutup shift, dan pencairan dana (Disbursement) dengan dual-ledger routing otomatis.

#### Panel 1 — 🏠 Status Shift & Dasbor (Home)
- Badge SHIFT AKTIF / TUTUP + jam mulai.
- Cash on Hand (kas fisik real-time dari Supabase).
- Tabel 5 transaksi terakhir untuk pengecekan cepat.
- Panel shortcut hint: `[1]–[6]`.

#### Panel 2 — 🔍 Profil & Pencarian Anggota (Customer View)
- Search bar (ID / Nama / NIK), keyboard-first.
- Card profil: avatar inisial, status aktif, NIK, email.
- Daftar rekening simpanan dimiliki.
- Sisa plafon / tunggakan pinjaman.
- Shortcut ke panel Setoran/Penarikan/Angsuran untuk anggota yang dipilih.

#### Panel 3 — 💵 Setoran Tunai (Deposit Form)
- Ambil state anggota dari Panel 2 (shared state).
- Pilihan rekening tujuan.
- Input nominal + **Kalkulator Denominasi** (Rp100k, 50k, 20k, 10k, 5k, 2k, 1k).
- Tombol cetak slip.

#### Panel 4 — 💸 Penarikan Tunai (Withdrawal Form)
- Saldo tersedia vs saldo mengendap minimum.
- Verifikasi: field PIN / Catatan Otorisasi.
- **Pop-up Otorisasi Supervisor** jika penarikan > Rp 5.000.000.

#### Panel 5 — 🧾 Pembayaran Angsuran (Loan Payment)
- Daftar kontrak aktif anggota.
- Rincian tagihan: Pokok, Jasa/Bagi Hasil, Denda.
- Opsi metode bayar: Sesuai Tagihan / Bayar Sebagian / Uang Muka.
- Double-entry otomatis COA SAK EP.

#### Panel 6 — 🔑 Buka / Tutup Shift (Opening & Closing)
- Form **Cash-In awal** (modal awal shift).
- Form **rekonsiliasi akhir**: saldo sistem vs hitung fisik.
- Kolom wajib **Keterangan Selisih** jika terjadi perbedaan.
- Log shift hari ini.

#### Panel 7 — 💳 Pencairan Dana (Disbursement)
- Daftar kontrak pembiayaan yang disetujui Manager, siap cair.
- Pilihan metode pencairan: **Tunai** (kredit Kas `101.01`) atau **Transfer ke Rekening Wadiah** (kredit Simpanan `201.01`).
- **On-the-fly Account Creator:** Jika anggota belum memiliki rekening Wadiah, sistem membuatnya otomatis di background saat Teller memilih metode Transfer.
- Double-entry otomatis: Debit akun piutang sesuai jenis akad (Murabahah, Mudharabah, dll), Kredit sesuai metode pencairan.
- Cetak slip pencairan resmi.

### 4.3. Siklus Penerimaan Kas (Revenue Cycle)
- Simpanan Wadiah Yad Dhamanah.
- Simpanan khusus (Haji, Umrah).
- Penerimaan angsuran pembiayaan dengan double-entry.

### 4.4. Siklus Pengeluaran Kas (Expenditure Cycle)
- Akad: Murabahah, Mudharabah, Musyarakah, Ijarah, Istishna, Qardhul Hasan.
- Engine perhitungan Nisbah dan margin.

### 4.5. Pengawasan Syariah & RAG Pipeline (Dewan Pengawas Syariah — 5 UI Utama Premium)

> Status: **✅ Selesai (Sprint 31 Mei 2026)** — 6 panel lengkap Dewan Pengawas Syariah (DPS) dengan visualisasi makro Shariah Health Score, audit pembiayaan split-screen (Visual Dokumen Fisik Akad + Penyorotan AI), manajemen produk baru terintegrasi pencarian RAG Fatwa, form pembersihan dana non-halal (ta'zir/giro) ke sektor sosial, generator laporan RAT dengan ekspor PDF dinamis (`jsPDF`), dan ingesti basis pengetahuan pgvector secara riil via API `/api/ai/ingest`.
>
> **UI/UX Terstandarisasi (31 Mei 2026):** Seluruh 6 tab DPS menggunakan variabel CSS semantik tema-agnostik (`--bg-card`, `--text-gold`, `--border-success`, dll.) — menjamin keterbacaan tinggi, kontras WCAG AA/AAA, dan estetika formal di Mode Terang maupun Gelap.

#### Panel 1 — 🕋 Dasbor Ringkasan Kepatuhan (Shariah Health Score)
- **Gauge SVG Interaktif:** Visualisasi persentase makro kepatuhan syariah global (contoh: `98.6%`).
- **Metric Cards:** Menampilkan Kepatuhan Score, Total Plafon Diaudit, Saldo Dana Kebajikan, dan Saldo Dana Non-Halal.
- **Akad Distribution Chart:** Visualisasi persentase proporsi penggunaan akad syariah (Murabahah, Mudharabah, Musyarakah, Ijarah).
- **AI Compliance Alert:** Banner pemberitahuan dini untuk potensi anomali akad dari RAG scanning.

#### Panel 2 — 🛡️ Audit Pembiayaan (Sampling & Review)
- **Split-Screen Viewer:**
  - **Sisi Kiri:** Data sistem pembiayaan nasabah, status analisis AI RAG, Checklist Rukun Akad (Objek Aset, Transparansi Harga Beli/Margin, Urutan Serah Terima Awal, Bebas Riba), dan Form Keputusan/Catatan DPS.
  - **Sisi Kanan:** Simulasi visual Dokumen Fisik Akad asli terunggah bergaya kertas klasik dengan stempel/tanda tangan dan penyorotan (highlight) otomatis klausul sensitif oleh AI.

#### Panel 3 — 📖 Manajemen Akad & Persetujuan Produk Baru
- **Product Proposals Ledger:** Menampilkan daftar draf produk baru yang diajukan oleh tim manajemen.
- **Fiqh Clause Editor:** Menampilkan detail hak, kewajiban, biaya, dan risiko produk.
- **RAG Search Fatwa DSN-MUI:** Input pencarian fatwa syariah yang melakukan similarity query langsung ke database pgvector `sharia_knowledge`.
- **Action Otorisasi:** Tombol "Setujui (Halal)", "Butuh Revisi", atau "Tolak".

#### Panel 4 — 💸 Pengawasan Dana Non-Halal & ZISWAF (Purification)
- **Ledger Non-Halal:** Rekapitulasi dana mengendap dari sumber denda keterlambatan (ta'zir) atau bunga bank konvensional.
- **Form Pembersihan Dana:** Distribusi dana ke sektor sosial (Sanitasi Desa, Sembako Yatim, Ponpes Air Bersih) dengan jaminan sistem anti-leakage (tidak masuk keuntungan inti koperasi).
- **Riwayat Penyaluran:** Tabel penelusuran dana mutasi sosial syariah.

#### Panel 5 — 🧾 Generator Laporan Pengawasan Syariah (RAT)
- **Report Editor:** Pembuatan draf Laporan Hasil Pengawasan Syariah (LHPS) berkala.
- **Cetak PDF Dinamis:** Menggunakan library `jsPDF` untuk menghasilkan berkas surat pengesahan resmi ber-kop surat, ringkasan metrik audit, opini syariah, dan tanda tangan digital DPS.

#### Panel 6 — 🤖 Saluran Ingesti Pengetahuan AI RAG
- **AI Knowledge Manager:** Antarmuka pengunggahan manual dokumen fatwa syariah dengan pemanggilan API `/api/ai/ingest` untuk membuat vector embeddings riil melalui model Google Gemini (`gemini-embedding-001`).
- **RAG Ingest Pipeline:** Integrasi visual sinkronisasi folder dan *chunking* naskah.

### 4.6. Laporan Keuangan SAK EP & PSAK
- Auto-generate: Neraca, Laba Rugi, Arus Kas, Dana Kebajikan/Zakat.
- Provisioning otomatis untuk pembiayaan macet.

### 4.7. Pusat Kontrol Super Admin (IT Administrator)
- **Modul Keamanan & Audit**: Log Audit Keamanan untuk melacak perubahan parameter dan hak akses (`audit_logs`).
- **Modul Infrastruktur**: Diagnostik Sistem (Ping/Koneksi) dan Pencadangan & Pemulihan Database (Ekspor/Impor JSON).
- **Modul Akuntansi & Operasional**: Manajemen dinamis Chart of Accounts (COA) untuk penjurnalan SAK EP dan Panel Penugasan/Delegasi Staf (`system_tasks`).
- **Dynamic Parameter Engine**: Ubah batas nominal otorisasi supervisor (`supervisor_approval_limit`), parameter AI (`max_output_tokens`, `unified_context_threshold`), Simpanan Pokok/Wajib, Biaya ADM, Infaq, Nisbah secara live.
- **Flat Sidebar**: Navigasi langsung ke sub-modul tanpa menu bertingkat.
- **API Keamanan**: `/api/admin/parameters` dengan validasi sesi ketat.

---

## 5. Perancangan Basis Data

| Tabel | Fungsi |
|---|---|
| `users` | Kredensial & RBAC (7 peran), RLS |
| `members` | CIF anggota, data KYC & APU-PPT |
| `savings_accounts` | Rekening simpanan multi-jenis per anggota |
| `savings_transactions` | Mutasi simpanan (deposit/withdrawal) |
| `journal_entries` | Buku besar double-entry SAK EP |
| `financing_contracts` | Akad, plafon, amortisasi, nisbah, `audit_metadata` (JSONB) |
| `prospects` | Data pengajuan calon debitur (AO pipeline) |
| `purifications` | Riwayat alokasi dana non-halal ke sektor sosial |
| `system_parameters` | Parameter dinamis (key-value), akses Super Admin |
| `sharia_knowledge` | Vector embeddings fatwa (pgvector, 1536-dim, `gemini-embedding-001`) |
| `teller_shifts` | Log buka/tutup shift teller harian |
| `audit_logs` | Jejak audit keamanan sistem, mutasi parameter & role (Super Admin) |
| `coa_accounts` | Chart of Accounts (COA) dinamis untuk penjurnalan SAK EP |
| `system_tasks` | Sistem tiket pendelegasian tugas dari Super Admin ke Staf |

---

## 6. Metodologi RAG Pipeline

1. **Ingesti:** Upload dokumen regulasi (PDF Fatwa DSN-MUI, PSAK) via API `/api/ai/ingest`.
2. **Transformasi:** Chunking teks agar konteks hukum terjaga.
3. **Vektorisasi:** Konversi ke vector embeddings via model **`gemini-embedding-001`** (1536-dim, auto-retry 429 handling, zero-padding/slicing otomatis).
4. **Retrieval:** Similarity search fragmen teks paling relevan dari `sharia_knowledge`.
5. **Generasi:** Sintesis rekomendasi oleh LLM (**Gemini 2.5 Flash** / cascade **Gemini 1.5 Flash**) berdasarkan dokumen hukum yang diambil. Menggunakan konfigurasi `maxOutputTokens: 4096` untuk menjamin kelengkapan teks jawaban syariah.
6. **Optimasi Latensi & Rendering:** Ambang batas Unified Context disetel ke 120.000 karakter untuk mencegah timeout koneksi pada API Next.js dengan mengaktifkan fallback otomatis ke similarity search (top 30 chunk) ketika basis data dokumen besar. Jawaban di sisi UI dirender secara baris-demi-baris oleh parser pesan untuk menjaga urutan teks/daftar agar tidak teracak.
7. **Audit DPS:** AI RAG menghasilkan opini kepatuhan + skor match terhadap kontrak pembiayaan aktif via `/api/ai/audit-contract`.

---

## 7. Rencana Strategis (Roadmap)

| Fase | Lingkup | Status |
|---|---|---|
| **Fase I** | Setup Next.js, Supabase, RLS, SonarCloud | ✅ Selesai |
| **Fase II** | Core Banking: 7 UI Teller (+ Disbursement), CS, Accounting, COA | ✅ Selesai |
| **Fase III** | LangChain.js RAG, pgvector ingesti riil, 6 Panel DPS, Standardisasi UI/UX | ✅ Selesai |
| **Fase IV** | UAT, RLS Audit, Notifikasi UI, CKPN NPL, Domain Produksi, Data Migration | 🟡 Aktif (~87% MVP) |
| **Fase V** | Integrasi Flip API, PPOB, Mobile Gateway, Push Notification, Simpanan Haji/Umrah | ⏳ Menunggu |

**Sprint Aktif:** RLS Audit Menyeluruh, UAT Formal bersama staf KSPPS, Implementasi Notifikasi UI, Auto-Provisioning CKPN, dan Setup Domain Produksi (Fase IV).

> **Lihat:** `BACKLOG.md` untuk daftar lengkap 9 item gap yang harus diselesaikan sebelum Go-Live.

---

*IQ-RA System | Blueprint Teknis Tugas Akhir 2026*
