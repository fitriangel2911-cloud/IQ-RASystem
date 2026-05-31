# IQ-RA System (Platform Keuangan Mikro Syariah Terintegrasi AI)

IQ-RA System adalah platform perangkat lunak komprehensif berbasis web yang dirancang khusus untuk Koperasi Simpan Pinjam Syariah (KSPS). Sistem ini bertujuan untuk mentransformasi operasional koperasi menuju ekosistem digital mandiri yang adaptif, stabil, transparan, dan sesuai syariah.

---

## Status Pengembangan (Per 31 Mei 2026)

| Modul | Status | Keterangan |
|---|---|---|
| **Homepage Publik** | ✅ SELESAI & DIKUNCI | Navbar, Hero, Profil, Produk, Laporan, AI Section, Footer |
| **Halaman Login** | ✅ SELESAI & DIKUNCI | Glassmorphism emerald, autentikasi Supabase |
| **Halaman Register** | ✅ SELESAI & DIKUNCI | Form pendaftaran awal |
| **Super Admin Dashboard** | ✅ Selesai | Flat sidebar, parameter engine, CIF registration |
| **Customer Service (CS)** | ✅ Selesai | Pendaftaran anggota 4-bagian KYC/APU-PPT, auto-journaling |
| **Account Officer (AO)** | ✅ Selesai | Pipeline pembiayaan, rekomendasi AI |
| **Accounting** | ✅ Selesai | Jurnal double-entry, laporan SAK EP |
| **Manager Dashboard** | ✅ Selesai | Approval, analitik |
| **DPS Dashboard** | ✅ SELESAI | 6 Panel Pengawasan Syariah AI-RAG, audit split-screen, ZISWAF, LHPS PDF, UI/UX terstandarisasi (theme-aware) |
| **Layanan Kasir / Teller** | ✅ SELESAI | 100% fungsional, 6 UI Utama, Denominasi Calc, Otorisasi Supervisor, Verifikasi Fisik KTP & Kartu Anggota, Cetak Laporan Konsolidasi Normatif |

---

## Fitur Utama & Keunggulan (USPs)

1. **Rekomendasi Akad Berbasis RAG (AI)**
   Integrasi *Retrieval-Augmented Generation* (RAG) sebagai asisten pembuat keputusan (*Smart Decision Support System*) untuk menganalisis parameter pembiayaan dan merekomendasikan kecocokan akad berdasarkan *knowledge base* Fatwa DSN-MUI.

2. **Kepatuhan Akuntansi SAK EP & PSAK Syariah (401-407)**
   Arsitektur buku besar (*General Ledger*) real-time yang secara bawaan mendukung penjurnalan ganda (*double-entry*) otomatis, serta kemampuan auto-generate Laporan Posisi Keuangan, Laba Rugi, dan Arus Kas.

3. **Core Banking Syariah & KYC APU-PPT**
   Satu CIF untuk multi-rekening dengan formulir pendaftaran 4-bagian (Data KTP, Kontak & Domisili, Pekerjaan & Sumber Dana, Data Ahli Waris). Didukung siklus simpanan kas dan penyaluran dana (pembiayaan).

4. **Integrasi Mobile & Pihak Ketiga**
   Konektivitas untuk gerbang pembayaran (Flip API), layanan PPOB, dan IQ-RA Mobile Gateway.

5. **Modul Super Admin Terpusat & Flat Sidebar**
   Navigasi flat langsung untuk mempercepat audit operasional, didukung mesin parameter dinamis (`system_parameters`).

---

## Target Pengguna & Hak Akses Berjenjang

Sistem menerapkan Row-Level Security (RLS) di level *database*:
- **Teller**: Transaksi kas harian — 6 UI Utama (Dasbor Shift, Profil Anggota, Setoran, Penarikan, Angsuran, Buka/Tutup Shift).
- **Customer Service**: Registrasi anggota dan pembukaan rekening.
- **Account Officer (AO)**: Analisis pembiayaan, interaksi RAG AI.
- **Manajer / Komite**: Approval pencairan dan pemantauan dasbor analitik.
- **Accounting**: Verifikasi jurnal harian dan pencetakan laporan.
- **Super Admin (IT)**: Konfigurasi parameter sistem secara penuh dengan Flat Sidebar.
- **Anggota (Aplikasi Mobile)**: Akses hanya-baca untuk saldo pribadi.

---

## Arsitektur Teknologi

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL + pgvector)
- **Mesin AI:** LangChain.js (RAG Pipeline)
- **Keamanan & Kualitas:** CI/CD GitHub Actions + SonarCloud

---

## Peta Jalan Implementasi (Roadmap)

| Fase | Periode | Status |
|---|---|---|
| **Fase 1** — Fondasi & Migrasi | Bulan 1-2 | ✅ Selesai |
| **Fase 2** — Core Banking & Akuntansi | Bulan 3-4 | ✅ Selesai |
| **Fase 3** — RAG AI, DPS & Standarisasi | Bulan 5-6 | ✅ Selesai |
| **Fase 4** — UAT & Go-Live | Bulan 7 | 🟡 Aktif |
| **Fase 5** — Integrasi & Mobile | Bulan 8+ | ⏳ Menunggu |

### Pekerjaan Aktif Saat Ini (Fase 4)
- **User Acceptance Testing (UAT)** — Simulasi transaksi harian bersama user asli per role.
- **Audit RLS Supabase** — Verifikasi kebijakan Row-Level Security di semua tabel.
- **Deployment ke Vercel** — Build produksi dengan environment secrets & optimasi.

### Pekerjaan Berikutnya (Fase 5)
- Integrasi Payment Gateway (Flip API) untuk transfer antar bank real-time.
- Integrasi PPOB (pulsa, token PLN, e-wallet).
- IQ-RA Mobile Gateway untuk portal mandiri anggota.
- Notifikasi otomatis (Push/WhatsApp) jatuh tempo angsuran.
