# IQ-RA System (Platform Keuangan Mikro Syariah Terintegrasi AI)

IQ-RA System adalah platform perangkat lunak komprehensif berbasis web dan mobile yang dirancang khusus untuk Koperasi Simpan Pinjam Syariah (KSPS). Sistem ini bertujuan untuk mentransformasi operasional koperasi menuju ekosistem digital mandiri yang adaptif, stabil, transparan, dan sesuai syariah.

## Fitur Utama & Keunggulan (USPs)

1. **Rekomendasi Akad Berbasis RAG (AI)**
   Integrasi *Retrieval-Augmented Generation* (RAG) sebagai asisten pembuat keputusan (*Smart Decision Support System*) untuk menganalisis parameter pembiayaan dan merekomendasikan kecocokan akad berdasarkan *knowledge base* seperti Fatwa DSN-MUI.
2. **Kepatuhan Akuntansi SAK EP & PSAK Syariah (401-407)**
   Arsitektur buku besar (*General Ledger*) real-time yang secara bawaan mendukung penjurnalan ganda (*double-entry*) otomatis, serta kemampuan auto-generate Laporan Posisi Keuangan, Laba Rugi, dan Arus Kas sesuai regulasi SAK EP terbaru.
3. **Core Banking Syariah**
   Mendukung manajemen keanggotaan terpusat (satu CIF untuk multi-rekening), siklus simpanan kas, serta penyaluran dana (pembiayaan) dengan dukungan algoritma perhitungan bagi hasil (Nisbah) dan margin untuk akad Murabahah, Musyarakah, Mudharabah, dan Qardhul Hasan.
4. **Integrasi Mobile & Pihak Ketiga**
   Konektivitas siap pakai (*out-of-the-box*) untuk gerbang pembayaran (Flip API), layanan PPOB, serta IQ-RA Mobile Gateway yang melayani transaksi *mobile banking* anggota.

## Target Pengguna & Hak Akses Berjenjang

Sistem menerapkan Row-Level Security (RLS) di level *database* untuk berbagai entitas:
- **Teller**: Transaksi penerimaan dan pengeluaran kas harian.
- **Customer Service**: Registrasi anggota dan pembukaan rekening.
- **Account Officer (AO)**: Analisis pembiayaan, interaksi RAG AI.
- **Manajer / Komite**: *Approval* pencairan pembiayaan dan pemantauan dasbor analitik.
- **Accounting**: Verifikasi jurnal harian dan pencetakan laporan.
- **Super User (IT)**: Konfigurasi sistem penuh.
- **Anggota (Aplikasi Mobile)**: Akses hanya-baca untuk saldo pribadi dan transaksi transfer/PPOB.

## Arsitektur Teknologi

Dibangun menggunakan arsitektur *Full-stack Serverless* untuk memaksimalkan efisiensi performa dan redundansi:
- **Antarmuka (Frontend):** Next.js (React), TypeScript, Tailwind CSS.
- **Backend & Database:** Supabase (PostgreSQL relasional) dilengkapi ekstensi **pgvector** untuk *database* vektor AI.
- **Mesin AI (Orchestrator):** LangChain.js untuk pemrosesan NLP (Natural Language Processing) dan ekstraksi informasi hukum syariah.
- **Keamanan & Kualitas:** Pipeline CI/CD GitHub Actions terintegrasi SonarCloud.

## Peta Jalan Implementasi (Roadmap)

1. **Fase 1 (Bulan 1-2):** Inisialisasi arsitektur Next.js & Supabase, konfigurasi RLS, migrasi data anggota.
2. **Fase 2 (Bulan 3-4):** Modul Core Banking (Teller/CS) dan otomasi Akuntansi.
3. **Fase 3 (Bulan 5-6):** Ingesti dokumen vektor Fatwa DSN-MUI (RAG AI) dan integrasi API pihak ketiga.
4. **Fase 4 (Bulan 7):** UAT (User Acceptance Testing), simulasi sistem harian, dan rilis penuh (*Go-Live*).
