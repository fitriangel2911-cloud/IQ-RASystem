Product Requirements Document (PRD)
Nama Produk: IQ-RA System (Platform Keuangan Mikro Syariah Terintegrasi AI)
Versi: 1.0
Tanggal Dokumen: 11 Mei 2026
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
4.2. Modul Core Banking Syariah
●      Manajemen Keanggotaan (CIF): Satu CIF untuk multi-rekening (simpanan & pembiayaan). Terintegrasi dengan fitur cek rekam jejak kredit (PI Checking internal).
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

○      Auto-generate Laporan: Posisi Keuangan (Neraca), Laba Rugi, Arus Kas, dan Laporan Dana Kebajikan/Zakat.
○      Pencadangan kerugian (provisioning) otomatis untuk pembiayaan macet guna mitigasi risiko.
4.4. Integrasi Third-Party & Mobile Interface
●      Integrasi API Transfer: Koneksi ke payment gateway (misal: Flip API) untuk transfer ke bank umum (BSI, BCA, dll) langsung dari core system.
●      Integrasi PPOB: Konektivitas sistem untuk melayani pembelian pulsa, token PLN, e-wallet (OVO, Gopay).
●      IQ-RA Mobile Gateway: API khusus untuk menghubungkan aplikasi Mobile Banking anggota dengan database core system secara real-time.
5. Arsitektur Teknis & Infrastruktur
Sistem dibangun dengan arsitektur Full-stack Serverless untuk keandalan dan efisiensi biaya:
●      Frontend Web: Next.js (React), TypeScript (untuk type-safety/menghindari error), Tailwind CSS, dan sistem tema dinamis (CSS Variables).
●      Desain UI/UX: Mengadopsi standar **Premium Sharia FinTech** dengan spesifikasi:
       ○      **Staff Dashboard**: Navigasi Sidebar kolapsibel Edge-to-Edge dengan kontainer lebar kaku (*anti-squish*) dan estetika monokrom tingkat tinggi.
       ○      **Member Portal**: Arsitektur *Floating App* berbalut Glassmorphism eksklusif agar animasi pola geometris interaktif terlihat (*bleed through*).
       ○      Dioptimalkan secara penuh untuk peralihan instan antara **Mode Terang (Light Mode)** dan **Mode Gelap (Dark Mode)** di seluruh peran pengguna.
●      Backend & Database: Supabase (PostgreSQL relasional untuk data keuangan + ekstensi pgvector untuk penyimpanan knowledge base AI).
●      AI Engine: LangChain.js untuk orkestrasi pemrosesan Prompt dan ekstraksi RAG.
●      Keamanan & Audit Kode: * Row-Level Security (RLS) di database.
○      Pipeline CI/CD menggunakan GitHub Actions.
○      Code-review otomatis dengan SonarCloud.
6. Kebutuhan Non-Fungsional (NFR)
1.     Ketersediaan (Availability): Sistem harus dirancang toleran terhadap gangguan dengan SLA 99.9%. Infrastruktur cloud (Vercel & Supabase) menggantikan ketergantungan pada server fisik tunggal.
2.     Keamanan (Security): Enkripsi password, perlindungan API dari DDoS, auto-logout sesi, dan audit log (merekam jejak "siapa mengubah apa dan kapan").
3.     Integritas Data: Penggunaan transaksi database (ACID compliance) untuk menghindari status transfer gantung/nyangkut saat terjadi gangguan koneksi ke pihak ketiga.
7. Peta Jalan Implementasi (Roadmap)
●      Fase 1: Fondasi & Migrasi (Bulan 1-2)
○      Setup arsitektur Next.js & Supabase. Konfigurasi RLS dan SonarCloud.
○      Pemetaan dan migrasi data awal anggota dari sistem lama (INVA).
●      Fase 2: Core Banking & Akuntansi (Bulan 3-4)
○      Pengembangan modul Teller, Customer Service, dan Accounting.
○      Penerapan aturan SAK EP & PSAK pada bagan akun (COA).
●      Fase 3: RAG AI & Integrasi API (Bulan 5-6)
○      Ingesti dokumen fatwa DSN-MUI ke pgvector.
○      Pembuatan antarmuka rekomendasi untuk Account Officer menggunakan LangChain.
○      Integrasi API Flip & PPOB.
●      Fase 4: Testing, UAT & Peluncuran (Bulan 7)
○      Blackbox testing, simulasi Open-Close harian.
○      Pelatihan (Training) berbasis sistem baru untuk CS, AO, dan Teller.
○      Go-Live operasional purna.
