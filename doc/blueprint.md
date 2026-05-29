# Cetak Biru Sistem (Blueprint): IQ-RA System
**Platform Keuangan Mikro Syariah Terintegrasi AI — RAG & SAK EP**

**Versi:** 1.3 | **Diperbarui:** 29 Mei 2026

---

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

> Status: **✅ Selesai (Sprint 29 Mei 2026)** — 6 panel lengkap dengan keyboard shortcut [1]–[6], shared state selectedMember, cetak struk, pop-up otorisasi supervisor, kalkulator denominasi, dan form buka/tutup shift.

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

### 4.3. Siklus Penerimaan Kas (Revenue Cycle)
- Simpanan Wadiah Yad Dhamanah.
- Simpanan khusus (Haji, Umrah).
- Penerimaan angsuran pembiayaan dengan double-entry.

### 4.4. Siklus Pengeluaran Kas (Expenditure Cycle)
- Akad: Murabahah, Mudharabah, Musyarakah, Ijarah, Istishna, Qardhul Hasan.
- Engine perhitungan Nisbah dan margin.

### 4.5. Rekomendasi Syariah (RAG Pipeline)
- Input parameter pembiayaan → Similarity search pgvector → Skor kecocokan akad.
- Knowledge base: Fatwa DSN-MUI, SOP Koperasi, PSAK.

### 4.6. Laporan Keuangan SAK EP & PSAK
- Auto-generate: Neraca, Laba Rugi, Arus Kas, Dana Kebajikan/Zakat.
- Provisioning otomatis untuk pembiayaan macet.

### 4.7. Pusat Kontrol Super Admin
- **Dynamic Parameter Engine:** Ubah nominal Simpanan Pokok/Wajib, Biaya ADM, Infaq, Nisbah secara live.
- **Flat Sidebar:** Navigasi langsung ke sub-modul tanpa menu bertingkat.
- **API Keamanan:** `/api/admin/parameters` dengan validasi sesi ketat.

---

## 5. Perancangan Basis Data

| Tabel | Fungsi |
|---|---|
| `users` | Kredensial & RBAC (7 peran), RLS |
| `members` | CIF anggota, data KYC & APU-PPT |
| `savings_accounts` | Rekening simpanan multi-jenis per anggota |
| `savings_transactions` | Mutasi simpanan (deposit/withdrawal) |
| `journal_entries` | Buku besar double-entry SAK EP |
| `financing_contracts` | Akad, plafon, amortisasi, nisbah |
| `system_parameters` | Parameter dinamis (key-value), akses Super Admin |
| `sharia_knowledge` | Vector embeddings fatwa (pgvector) |
| `teller_shifts` *(planned)* | Log buka/tutup shift teller |

---

## 6. Metodologi RAG Pipeline

1. **Ingesti:** Upload dokumen regulasi (PDF Fatwa DSN-MUI, PSAK).
2. **Transformasi:** Chunking teks agar konteks hukum terjaga.
3. **Vektorisasi:** Konversi ke vector embeddings via model AI generatif.
4. **Retrieval:** Similarity search fragmen teks paling relevan.
5. **Generasi:** Sintesis rekomendasi oleh LLM berdasarkan dokumen hukum.

---

## 7. Rencana Strategis (Roadmap)

| Fase | Lingkup | Status |
|---|---|---|
| **Fase I** | Setup Next.js, Supabase, RLS, SonarCloud | ✅ Selesai |
| **Fase II** | Core Banking: 6 UI Teller, CS, Accounting, COA | ✅ Teller Selesai |
| **Fase III** | LangChain.js RAG, pgvector ingesti, Flip/PPOB API | ⏳ Menunggu |
| **Fase IV** | UAT, Blackbox Testing, Training, Go-Live | ⏳ Menunggu |

**Sprint Aktif:** Integrasi RAG AI Engine & Basis Pengetahuan Syariah.

---

*IQ-RA System | Blueprint Teknis Tugas Akhir 2026*
