# Panduan Kepatuhan (Compliance Guidelines): IQ-RA System

Dokumen ini menjelaskan kerangka kerja kepatuhan (*compliance framework*) yang tertanam secara bawaan (*native*) di dalam platform IQ-RA System. Tujuannya adalah untuk menjamin bahwa seluruh operasional Koperasi Simpan Pinjam Syariah (KSPS) sejalan dengan standar regulasi nasional dan prinsip-prinsip syariah secara *end-to-end*.

## 1. Kepatuhan Standar Akuntansi Nasional (SAK EP)

Berakhirnya masa berlaku SAK ETAP dan berlakunya kewajiban adopsi **SAK EP (Standar Akuntansi Keuangan Entitas Privat)** per tahun buku 2025 mengharuskan adanya penyesuaian kerangka pencatatan di Indonesia. IQ-RA System memastikan kepatuhan ini melalui:
- **Buku Besar Terpusat (General Ledger):** Proses penjurnalan ganda (*double-entry bookkeeping*) dieksekusi secara otomatis di latar belakang setiap kali transaksi terjadi di sisi Teller.
- **Standarisasi Laporan:** Memfasilitasi pembuatan secara otomatis (auto-generate) komponen wajib pelaporan akhir tahun: Laporan Posisi Keuangan (Neraca), Laporan Laba Rugi, dan Laporan Arus Kas tanpa perlunya proses rekap manual.
- **Pencadangan Kerugian (Provisioning):** Implementasi mitigasi risiko kredit dengan melakukan pencadangan otomatis terhadap status pembiayaan macet.

## 2. Kepatuhan Akuntansi Syariah (PSAK Seri 400)

Sebagai entitas berbadan hukum syariah, perlakuan pencatatan transaksi dan pemisahan pos-pos akun keuangan wajib mengikuti panduan **PSAK Syariah (401-407)**.
- **Akuntansi Murabahah (Jual Beli):** Sistem otomatis menangani pengakuan piutang, pengakuan margin tangguhan, dan amortisasi pendapatan margin secara bulanan.
- **Akuntansi Mudharabah & Musyarakah (Bagi Hasil):** Pencatatan porsi pembiayaan syirkah dan otomatisasi *engine* perhitungan distribusi bagi hasil (*Nisbah*) setiap bulannya.
- **Pemisahan Dana Kebajikan (ZISWAF):** Otomasi penyusunan Laporan Sumber dan Penyaluran Dana Kebajikan/Zakat secara independen agar tidak bercampur dengan aset komersial operasi koperasi.

## 3. Kepatuhan Fiqih Muamalah (AI Decision Support)

Tantangan utama di lapangan adalah tingginya subjektivitas petugas (Account Officer) yang sering kali berujung pada pemilihan jenis akad pinjaman yang tidak sesuai peruntukannya secara Islam. IQ-RA System menanggulanginya dengan *AI Engine*:
- **Knowledge Base DSN-MUI:** Menggunakan teknologi AI berjenis *Retrieval-Augmented Generation* (RAG) yang terhubung ke *database* vektor literatur otentik seperti **Fatwa DSN-MUI** dan **SOP Koperasi**.
- **Validasi dan Rekomendasi Akad:** AI bertugas mengekstraksi parameter pembiayaan yang diajukan (tujuan, aset, jaminan). Sistem lalu mengeluarkan persentase kecocokan akad beserta panduan syariahnya (Misal: *"Pembiayaan ini 90% cocok menggunakan Murabahah, dengan syarat administratif kuitansi pembelian aset fisik harus dilampirkan"*).

## 4. Keamanan Sistem & Audit Internal

- **Row-Level Security (RLS) di Database:** Pembatasan akses berbasis peran memastikan integritas operasional. (Contoh: Karyawan Teller secara fisik dan sistem tidak memiliki otorisasi untuk mengakses fitur penentu kelulusan pembiayaan yang dipegang Komite/Manajer).
- **Jejak Audit Otomatis (Audit Log):** Sistem memiliki kapabilitas perekaman aktivitas pengguna. Setiap modifikasi data, pembatalan (*void*), atau koreksi jurnal harian terekam identitas penggunanya beserta tanggal kejadian (*timestamp*) untuk mempermudah proses pemeriksaan oleh auditor independen.

## 5. Kepatuhan APU-PPT & Standar KYC Keanggotaan (CIF)

Untuk memitigasi risiko Tindak Pidana Pencucian Uang dan Pencegahan Pendanaan Terorisme (APU-PPT), pendaftaran keanggotaan (Customer Information File - CIF) di IQ-RA System telah diperluas dengan field kepatuhan ketat:
- **Demografi KYC Lengkap:** Identifikasi mendalam meliputi Nama Lengkap (tanpa singkatan), NIK, Tempat/Tanggal Lahir, Jenis Kelamin, Status Pernikahan, Agama, dan Kewarganegaraan (WNI/WNA).
- **Kesesuaian Domisili:** Verifikasi alamat KTP fisik yang disandingkan dengan Alamat Domisili tinggal saat ini dengan fungsionalitas efisiensi "Sama dengan KTP".
- **Kepatuhan Profil Risiko Keuangan:** Pencatatan Jenis Pekerjaan, Nama Perusahaan/Instansi Bidang Usaha, Estimasi Pendapatan Bulanan, serta deklarasi wajib **Sumber Dana** keanggotaan.
- **Perlindungan Hak Waris Koperasi:** Integrasi data nama ahli waris, hubungan keluarga, serta nomor kontak aktif ahli waris guna pemenuhan ketentuan operasional koperasi simpan pinjam syariah.
