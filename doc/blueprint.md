Dokumen Rancangan Sistem: IQ-RA System
Platform Keuangan Mikro Syariah Terintegrasi dengan Mekanisme Retrieval-Augmented Generation (RAG) Sebagai Rekomendasi Akad dan Kepatuhan SAK EP
Spesifikasi Teknologi: Next.js (React), TypeScript, Tailwind CSS, Supabase (PostgreSQL & pgvector), LangChain.js
1.     Ringkasan Eksekutif
IQ-RA System merupakan platform berbasis web komprehensif yang dirancang untuk mentransformasi operasional koperasi syariah menuju ekosistem digital yang adaptif, transparan, dan sesuai syariah. Melalui implementasi arsitektur Full-stack Framework modern, sistem ini menawarkan efisiensi tinggi serta pengetikan statis yang kuat untuk meminimalisasi kesalahan. Integrasi teknologi Kecerdasan Buatan (AI) melalui Retrieval-Augmented Generation (RAG) berfungsi sebagai asisten sistem pendukung keputusan (decision support) interaktif bagi pengelola dalam merekomendasikan kesesuaian akad pembiayaan, sementara standarisasi laporan keuangan dikelola secara otomatis berdasarkan regulasi SAK EP terbaru dan PSAK Syariah (401-407).
Matriks Fitur Utama dan Manfaat Strategis
Fitur Utama
	Deskripsi Manfaat
	Target Pengguna
	Arsitektur Next.js & TypeScript
	Optimalisasi reaktivitas antarmuka dengan keandalan pengetikan statis dan kompleksitas runtime minimal.
	Pengembang & Pengguna Akhir
	Rekomendasi Akad Berbasis RAG
	Penyediaan rekomendasi kesesuaian akad syariah dan konsultasi kepatuhan fatwa secara real-time.
	Pengelola Koperasi / Bendahara
	Automasi Laporan SAK EP & PSAK
	Penyajian laporan keuangan yang presisi sesuai standar akuntansi privat dan syariah terbaru.
	Administrator & Manajemen
	Manajemen Arus Kas Terpadu
	Pengawasan sistematis terhadap siklus penerimaan dan pengeluaran kas (pembiayaan).
	Administrator & Auditor
	Integrasi SonarCloud & Supabase
	Penjaminan kualitas kode, keamanan isolasi data (RLS), dan mitigasi kerentanan perangkat lunak.
	Pengembang
	2.     Analisis Problematika dan Justifikasi Pengembangan
Pengembangan IQ-RA System didasari oleh beberapa tantangan fundamental yang dihadapi oleh institusi koperasi syariah pada era digital, antara lain:
1.     Subjektivitas Rekomendasi Akad: Validasi dan penentuan akad di koperasi syariah seringkali masih berjalan secara manual dan bergantung pada pemahaman subjektif petugas, berisiko menimbulkan ketidaksesuaian dengan prinsip fiqih muamalah.
2.     Kebutuhan Transformasi Akuntansi: Adanya kewajiban bagi entitas privat, termasuk koperasi, untuk melakukan migrasi standar pelaporan akuntansi dari SAK ETAP menuju SAK EP paling lambat pada tahun buku 2025.
3.     Keterbatasan Analisis Sistem Eksisting: Perangkat lunak koperasi saat ini umumnya hanya berfokus pada otomasi pencatatan administrasi dan belum dilengkapi dengan kemampuan smart decision support yang memahami konteks transaksi berdasarkan aturan syariah.
4.     Standarisasi Perangkat Lunak: Kebutuhan akan audit kualitas kode yang berkelanjutan guna memastikan bahwa platform finansial terhindar dari cacat (bug) kritikal dan menjamin integritas data anggota.
5.     Arsitektur Sistem dan Infrastruktur Teknologi
Sistem mengadopsi pendekatan Full-stack Framework modern guna mereduksi latensi komunikasi antar-layanan, mengoptimalkan proses Server-Side Rendering (SSR), serta mempermudah pemeliharaan sistem secara berkelanjutan.
Komponen Teknologi
●      Web Server & Framework: Next.js (React) berperan sebagai fondasi utama untuk arsitektur antarmuka dan pemrosesan logika di sisi peladen (Server-Side).
●      Interaktivitas Antarmuka: Penggunaan Tailwind CSS untuk desain User Interface yang responsif dan modular, dikombinasikan dengan TypeScript untuk keamanan tipe statis (static typing).
●      Manajemen Data: Supabase sebagai platform Backend-as-a-Service (BaaS) dengan kapabilitas database PostgreSQL relasional dan ekstensi pgvector untuk penyimpanan data vektor AI.
●      Mesin Kecerdasan Buatan: LangChain.js beroperasi sebagai orkestrator jalur pipa RAG untuk ekstraksi teks dokumen regulasi, pembuatan embeddings, dan pencarian konteks spesifik.
●      Siklus Pengembangan: Pemanfaatan Vercel untuk deployment berkinerja tinggi serta GitHub Actions yang terintegrasi dengan SonarCloud untuk tinjauan kualitas kode secara otomatis.

3.1. Sistem Desain Antarmuka (Premium Sharia FinTech)
Untuk menjamin kepercayaan pengguna pada platform finansial, IQ-RA System mengadopsi standar estetika "Premium Sharia FinTech" yang ultra-modern, bersih, dan berwibawa:
●      Latar Belakang Animasi Universal (White Papercut Style): Menggunakan pola geometris Islami *3D papercut* putih abu-abu asli yang bergerak mengalir lambat secara diagonal sebagai fondasi visual utama (di-render terpusat pada root layout), memberikan kesan modern, suci, bersih, terang, dan profesional.
●      Glassmorphism Hijau Zamrud Gelap (Dark Emerald Glass): Kontainer utama dan kartu penting didesain melayang menggunakan kaca hijau zamrud gelap pekat dengan transparansi optimal (`rgba(4, 49, 33, 0.75)`) dan efek blur tinggi (`backdrop-filter: blur(24px)`) dengan bingkai emas metalik tebal (`rgba(204, 163, 52, 0.55)`) untuk menjamin kontras teks putih/emas di dalamnya tampil sangat tajam, terang, dan bersinar.
●      Desain Halaman Publik Terkunci (Home, Login, Register - LOCKED):
  * *Halaman Beranda (LOCKED)*: Navbar premium dengan Logo diperbesar (`52px`), Menu Navigasi rapi (`18px` ultra-bold), tombol "Masuk" diperbesar (`20px`), serta hero text berselimut gradasi emas royal premium di atas kontainer kaca hijau zamrud transparan (`rgba(4, 49, 33, 0.75)`).
  * *Halaman Login & Registrasi (LOCKED)*: Menggunakan kontainer kaca hijau zamrud (`rgba(4, 49, 33, 0.75)`) yang sepenuhnya selaras dengan beranda. Semua teks pendukung diubah menjadi Putih Murni (`#ffffff`) berkontras tinggi (AAA) dengan tulisan kata sandi/email di dalam kolom menggunakan Slate Charcoal Modern (`#334155`) di atas kolom input kaca semi-transparan (`rgba(255, 255, 255, 0.08)`).
●      Palet Warna & Keterbacaan Kontras Tinggi:
  * *Dark Emerald Green* (`#043121` / `#084b35`): Digunakan untuk warna teks utama Navbar, judul produk, dan aksen penting syariah untuk keterbacaan tingkat tinggi di atas latar putih.
  * *Slate Arang* (`#334155` / `#1e293b`): Digunakan untuk penjelasan deskripsi agar tidak blur dan sangat nyaman dibaca baik di atas latar putih terang maupun di dalam kontainer zamrud gelap.
  * *Metallic Gold* (`#cca334` / `#f3c653` / `#a67e26`): Aksen kemewahan premium untuk border kontainer, ikon, gradasi teks sorotan, dan metrics angka keuangan.
●      Standardisasi Dasbor: Penggunaan Sidebar dinamis terpadu dengan fitur *Collapsible*. Komponen layanan utama (seperti Layanan Kasir) diberikan penekanan visual (ukuran lebih besar & warna kontras) untuk kemudahan akses operasional.
●      Optimasi Aksesibilitas: Penyesuaian kontras warna tingkat tinggi pada seluruh halaman (Home, Login, Register) untuk memastikan teks tetap terbaca tajam bebas blur.
4.1. Manajemen Keanggotaan dan Data Utama (Cooperative Member Onboarding / CIF Flow)
Modul ini memfasilitasi onboarding terintegrasi anggota baru secara real-time langsung melalui kontrol panel Admin/Customer Service:
1. Pendaftaran CIF & Akun Portal (KYC & APU-PPT Lengkap): Pengelola menginput data demografis yang komprehensif sesuai kepatuhan regulasi APU-PPT dan prinsip kehati-hatian koperasi syariah, terbagi dalam 4 bagian utama:
   - **A. Data Pribadi (Sesuai KTP)**: Nama Lengkap (tanpa singkatan), NIK, Tempat & Tanggal Lahir, Jenis Kelamin, Status Pernikahan, Nama Ibu Kandung, Agama, & Kewarganegaraan (WNI/WNA).
   - **B. Data Kontak & Alamat**: Nomor HP (koneksi WhatsApp), Alamat Email, Alamat KTP, dan Alamat Domisili saat ini (yang dilengkapi dengan **Toggle efisiensi "Sama dengan KTP"** untuk mempercepat input data).
   - **C. Data Pekerjaan & Keuangan (Profil Risiko APU-PPT)**: Jenis Pekerjaan / Profesi, Nama Perusahaan / Bidang Usaha, Estimasi Pendapatan Bulanan, serta **Sumber Dana** wajib.
   - **D. Data Ahli Waris**: Nama Ahli Waris, Hubungan Keluarga, & Kontak WhatsApp Ahli Waris untuk perlindungan hukum saldo simpanan.
   Sistem secara otomatis membuat akun login (Auth & Users Table) dengan peran 'member' dan kata sandi sementara berbasis NIK.
2. Pembuatan Rekening Simpanan Koperasi Otomatis: Segera setelah CIF terbuat, sistem secara otomatis menggenerasi tiga jenis rekening simpanan anggota dengan nomor rekening unik 10-digit:
   - Simpanan Pokok (jenis: 'pokok', awalan kode rekening: 11xxxx)
   - Simpanan Wajib (jenis: 'wajib', awalan kode rekening: 12xxxx)
   - Simpanan Sukarela / Wadiah (jenis: 'wadiah', awalan kode rekening: 21xxxx)
3. Integrasi Setoran Awal & Penjurnalan SAK EP: Saat registrasi, setoran awal untuk Simpanan Pokok (default Rp 300.000) dan Simpanan Wajib (default Rp 50.000) langsung diinput. Selain itu, transaksi dikenakan Biaya Administrasi Rp 15.000 dan Infaq & Sedekah Rp 10.000 serta Kode Unik 3 Digit Terakhir yang dimiliki anggota. Nilai-nilai nominal parameter simpanan dasar, biaya admin, dan infaq ini tidak lagi bersifat hardcoded, melainkan ditarik secara dinamis dari tabel konfigurasi sistem di database. Sistem secara otomatis melakukan posting akuntansi double-entry real-time yang mematuhi standar SAK EP dan PSAK Syariah:
   - Debit: Kas di Tangan (COA 101.01) senilai Total Setoran + Biaya + Kode Unik (misal Rp 375.xxx)
   - Kredit: Simpanan Pokok Anggota (COA 301.01) senilai Setoran Pokok (ditarik dari database, default Rp 300.000)
   - Kredit: Simpanan Wajib Anggota (COA 301.02) senilai Setoran Wajib (ditarik dari database, default Rp 50.000)
   - Kredit: Pendapatan Administrasi (COA 401.02) senilai Biaya ADM (ditarik dari database, default Rp 15.000)
   - Kredit: Dana Kebajikan / Infaq & Sedekah (COA 302.01) senilai Infaq (ditarik dari database, default Rp 10.000) + Kode Unik (3 digit belakang no telp)
4. Pencatatan Mutasi Simpanan & Audit Berkas: Sistem mencatat transaksi setoran awal ini secara atomik ke dalam tabel `savings_transactions` sebagai tipe 'deposit'. Selain itu, seluruh berkas data pribadi & keuangan yang dikumpulkan dapat ditinjau dan dievaluasi secara interaktif di **Dasbor Verifikasi Berkas KYC (Dossier Audit)** dan **Floating Profile Card** pada Database Anggota Aktif untuk memastikan validitas data sebelum pengajuan pembiayaan syariah.

4.2. Siklus Penerimaan Kas (Revenue Cycle)
Mencakup mekanisme arus kas masuk. Sistem secara otomatis mencatat penerimaan simpanan sukarela (Wadiah Yad Dhamanah) serta merekam angsuran dari produk-produk pembiayaan anggota dengan sistem penjurnalan yang akurat.
4.3. Siklus Pengeluaran Kas (Expenditure Cycle)
Mengatur penyaluran dana untuk pembiayaan anggota (Murabahah, Mudharabah, Musyarakah, Ijarah, Istishna), biaya operasional koperasi, serta perhitungan distribusi bagi hasil (Nisbah) secara otomatis.
4.4. Rekomendasi Kepatuhan Syariah (RAG Pipeline)
Layanan konsultasi dan alat bantu keputusan (decision support) berbasis AI yang mengekstraksi informasi dari korpus dokumen Fatwa DSN-MUI dan regulasi syariah guna merekomendasikan kesesuaian jenis akad pembiayaan secara sistematis sebelum disahkan.
4.5. Laporan Keuangan Berbasis SAK EP dan PSAK
Generasi otomatis laporan posisi keuangan, laporan laba rugi, laporan perubahan ekuitas, dan laporan arus kas yang memenuhi kriteria SAK EP, termasuk pemisahan akun sesuai ketentuan PSAK Syariah (401-407).

4.6. Pusat Kontrol Super Admin (Dynamic Parameter Engine & Flat Sidebar)
Modul administrasi IT terintegrasi untuk mengendalikan jalannya operasional koperasi syariah secara dinamis:
1. Konfigurasi Parameter Terpusat: Super Admin dibekali dasbor kendali bertema Emerald Glassmorphic untuk memodifikasi nominal Simpanan Pokok, Simpanan Wajib, Biaya ADM, Infaq, Nisbah Mudharabah, minimal skor Syariah AI, dan endpoint API WhatsApp Gateway secara instan tanpa menyentuh kode program.
2. API Keamanan Lapis Peran: Perubahan parameter diproses melalui endpoint aman `/api/admin/parameters` dengan validasi sesi dan pemblokiran ketat bagi aktor non-admin.
3. Sidebar Flat Berorientasi Tugas: Navigasi Super Admin dirombak menjadi flat (langsung ke intinya) sehingga seluruh sub-modul operasional (seperti form pendaftaran CIF, kasir, jurnal, dan laporan keuangan) terpampang langsung secara horizontal di sidebar utama, mem-bypass menu kategori yang lambat dan meningkatkan kecepatan audit/pengawasan.

5.     Perancangan Basis Data dan Keamanan Informasi
Struktur Data Keuangan (Relasional)
●      users: Menyimpan kredensial terenkripsi dan otoritas peran pengguna dengan Row-Level Security (RLS).
●      system_parameters: Penyimpanan terpusat parameter operasional koperasi syariah berbasis key-value dengan pengawasan keamanan RLS (hanya Super Admin yang dapat menulis/mengedit).
●      journal_entries: Pencatatan riwayat transaksi ganda (double-entry) yang merupakan fondasi fundamental pelaporan keuangan SAK EP.
●      financing_contracts: Dokumentasi rinci parameter akad, plafon pinjaman, rasio margin/bagi hasil, dan jadwal amortisasi angsuran.
Struktur Data Pengetahuan (Vektor)
●      sharia_knowledge: Menyimpan representasi numerik (embedding vector) teks fatwa DSN-MUI dan standar akuntansi untuk proses pencarian semantik pada sistem AI.
Protokol Keamanan Kode
●      Implementasi manajemen rahasia terpusat dan file .gitignore yang ketat untuk mencegah kebocoran kunci API dan konfigurasi sensitif pada repositori publik.
●      Analisis statis berkala melalui SonarCloud untuk mendeteksi kerentanan (vulnerability) dan baris kode bermasalah (code smells).
6.     Metodologi RAG Pipeline
Implementasi RAG dilakukan melalui beberapa tahapan sistematis:
1.     Ingesti: Pengunggahan dokumen regulasi (seperti PDF Fatwa DSN-MUI, SOP Koperasi, dokumen PSAK) oleh administrator.
2.     Transformasi: Fragmentasi teks (chunking) untuk memastikan informasi hukum syariah dipertahankan dalam konteks batasan karakter yang ideal.
3.     Vektorisasi: Konversi fragmen teks tersebut menjadi representasi numerik (vector embeddings) melalui model AI generatif.
4.     Retrieval: Pencarian kesamaan (similarity search) guna menemukan fragmen teks regulasi yang paling memiliki relevansi semantik terhadap kasus pengajuan pembiayaan dari anggota.
5.     Generasi: Sintesis rekomendasi dan jawaban komprehensif oleh Large Language Model (LLM) berdasarkan referensi dokumen hukum yang ditarik.
6.     Rencana Strategis Implementasi (Roadmap)
Fase I: Inisialisasi infrastruktur pengembangan, konfigurasi Next.js dan Supabase, serta pengaktifan instrumen SonarCloud pada ekosistem repositori.
Fase II: Pengembangan modul inti operasional koperasi, mencakup Siklus Penerimaan dan Siklus Pengeluaran kas.
Fase III: Implementasi jalur pipa orkestrasi LangChain.js untuk RAG dan integrasi basis data vektor.
Fase IV: Validasi pelaporan keuangan berbasis SAK EP, User Acceptance Testing (UAT) di lapangan, dan penyempurnaan aspek keamanan data secara menyeluruh.
IQ-RA System | Laporan Teknis Tugas Akhir 2026
