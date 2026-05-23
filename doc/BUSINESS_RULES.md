# Aturan Bisnis (Business Rules): IQ-RA System

Dokumen ini menjabarkan aturan bisnis (*business rules*) inti yang berlaku operasional di dalam IQ-RA System. Aturan-aturan ini menjadi landasan logika bisnis (*business logic*) yang harus dipatuhi secara ketat dan diimplementasikan ke dalam kode oleh para pengembang perangkat lunak.

## 1. Manajemen Keanggotaan (CIF)

- **Single Customer Information File (CIF):** Setiap individu/anggota yang terdaftar hanya boleh memiliki tepat satu nomor CIF.
- **Kepatuhan KYC & APU-PPT Mutlak:** CIF wajib mengumpulkan data kependudukan lengkap sesuai KTP, verifikasi alamat domisili, profil finansial (jenis pekerjaan, perusahaan, pendapatan), deklarasi **Sumber Dana (APU-PPT)**, serta pencatatan **Ahli Waris** sebelum keanggotaan disahkan.
- **Multi-Rekening Terpusat:** Melalui satu CIF, anggota dapat membuka serta menautkan banyak sub-rekening sekaligus (Contoh: Buku Simpanan Harian, Tabungan Umrah, dan Buku Tagihan Cicilan Pembiayaan).
- **Prasyarat Pembiayaan:** Modul pengajuan pembiayaan (*pipeline*) akan terkunci dan menolak pengajuan baru apabila status keanggotaan belum "Aktif" (belum melunasi Simpanan Pokok & Wajib awal), terdeteksi memiliki rekam jejak buruk (*Internal PI Checking*), atau data profil KYC tidak lengkap.

## 2. Aturan Siklus Penerimaan Kas

- **Akad Wadiah Yad Dhamanah:** Simpanan umum anggota diperlakukan sebagai titipan yang dapat dikelola oleh Koperasi (dijadikan modal kerja koperasi). Namun, nilai nominal simpanan ini dijamin utuh dan Koperasi dilarang membebankan risiko kerugian usahanya kepada saldo simpanan anggota.
- **Validasi Buka-Tutup Kasir (Open-Close Harian):** Teller wajib menginisiasi proses *Open* sebelum melayani setoran/tarikan, dan wajib melakukan *Close* di akhir sif kerja untuk validasi kesesuaian fisik uang tunai. Transaksi tidak akan terekam jika status terminal teller tertutup.

## 3. Aturan Siklus Penyaluran Pembiayaan

Pencairan dana kredit (pembiayaan) diharamkan sebelum tervalidasi oleh persetujuan berjenjang (AO -> Komite/Manajer). Empat alur utama penyaluran dana:
- **Murabahah (Jual Beli Mayoritas):** Pembiayaan pembelian barang fisik. Margin (keuntungan koperasi) dipatok tetap dan disepakati di awal kontrak. Angsuran bersifat *fixed rate*.
- **Mudharabah & Musyarakah (Bagi Hasil):** Pembiayaan modal kerja/syirkah. Skema pengembaliannya tidak boleh dipatok angkanya, melainkan dihitung secara berfluktuasi berdasarkan *Nisbah* (rasio persentase bagi hasil) dari pendapatan bersih usaha anggota.
- **Qardhul Hasan (Dana Kebajikan):** Pinjaman darurat (misal: pengobatan, musibah). Anggota mengembalikan persis sesuai pokok pinjaman (Margin 0%). Sumber pendanaan wajib diambil dari pos "Dana Kebajikan/ZIS", dilarang mengambil dari kas komersial anggota lain.

## 4. Mekanisme Asisten RAG AI

- Keputusan mutlak pencairan pinjaman sepenuhnya ada pada Manajer/Komite, bukan diputuskan oleh AI.
- Penggunaan AI (RAG Engine) bersifat **Wajib (Mandatory)** di tahap analisis *Account Officer* (AO). Sistem akan menolak meneruskan berkas pembiayaan ke Manajer jika AO belum menjalankan mesin AI untuk mengevaluasi parameter risikonya.
- Mesin AI diprogram untuk mengembalikan skor "Nol (0%)" atau peringatan bahaya (*Red Flag*) jika tujuan pengajuan terdeteksi melanggar koridor Fiqih Muamalah (sebagaimana didikte oleh literatur vektor DSN-MUI).

## 5. Otomasi Akuntansi & Mitigasi NPL

- **Penjurnalan Terlarang (*No Single-Entry*):** Sistem tidak menoleransi pencatatan pembukuan tunggal. Seluruh kejadian finansial mutlak dieksekusi menggunakan prinsip *Double-Entry* (menyeimbangkan minimal satu akun Debit dan satu akun Kredit di dalam *General Ledger*).
- **Auto-Provisioning (CKPN):** Guna mengamankan kesehatan koperasi sesuai regulasi SAK EP, sistem akan otomatis mendebit kerugian cadangan pembiayaan bermasalah (NPL - *Non-Performing Loans*) apabila sistem mendeteksi ada cicilan anggota yang tertunggak melewati rasio kolektibilitas aman (contoh: di atas 90 hari).

## 6. Integrasi Eksternal (Transfer & PPOB)

- **Prinsip Validasi Ketat:** Pemotongan saldo nasabah untuk pembayaran tagihan listrik (PPOB) atau transfer keluar (Flip API) **hanya akan dikomit ke database** apabila server pihak ketiga merespons sukses (*HTTP 200 OK*).
- **Anti Kas Gantung (*Rollback*):** Jika server pihak ketiga terputus, *timeout*, atau gagal di tengah transaksi, sistem wajib menggagalkan otomatis rencana pemotongan saldo anggota, demi menghindari komplain kerugian di pihak anggota.
