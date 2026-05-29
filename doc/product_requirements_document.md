# Product Requirements Document (PRD)
**Nama Produk:** IQ-RA System (Platform Keuangan Mikro Syariah Terintegrasi AI)
**Versi:** 1.2
**Tanggal Dokumen:** 24 Mei 2026

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
| **Super Admin (IT)** | Kontrol penuh infrastruktur & operasional | Akses mutlak seluruh fitur |
| **Anggota (Mobile)** | Cek saldo, transfer, bayar tagihan | Hanya data milik sendiri |

---

## 4. Fitur Utama & Kebutuhan Fungsional

### 4.1. Modul IQ-RA RAG Engine
- Form input parameter pembiayaan (tujuan, profil anggota, jaminan).
- Similarity search ke database vektor fatwa DSN-MUI.
- Output: Skor kecocokan akad, mitigasi risiko, syarat administrasi.

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

### 4.3. Modul Akuntansi SAK EP & PSAK
- Double-entry bookkeeping otomatis dari setiap transaksi Teller.
- Sistem Open-Close harian untuk validasi kas.
- Auto-generate Laporan: Neraca, Laba Rugi, Arus Kas, Dana Kebajikan/Zakat.

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
| **Fase 3** — RAG AI & Integrasi API | Ingesti fatwa DSN-MUI ke pgvector, LangChain, Flip/PPOB | 🔄 Aktif |
| **Fase 4** — Testing, UAT & Go-Live | Blackbox testing, simulasi harian, training, Go-Live | ⏳ Menunggu |

**Pekerjaan Aktif:** RAG AI Engine + LangChain (Fase 3).

> File: `src/components/dashboard/teller/Panel1Dashboard.tsx` s.d. `Panel6Shift.tsx` + `TellerTerminal.tsx` (orchestrator)
