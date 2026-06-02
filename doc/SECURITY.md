# Kebijakan Keamanan (Security Policy): IQ-RA System

Dokumen ini mendefinisikan kerangka keamanan informasi, pengelolaan akses, dan perlindungan privasi yang diterapkan secara menyeluruh di platform IQ-RA System. Karena platform ini berurusan dengan agregasi dana publik (anggota koperasi) dan privasi data personal (CIF), prinsip *Zero Trust Architecture* menjadi landasan utama.

## 1. Otentikasi & Manajemen Sesi

Platform menjamin perlindungan terhadap akun dan akses sistem:
- **Enkripsi Kredensial (GoTrue):** Seluruh kata sandi pengguna dienkripsi secara sepihak (*hashed and salted*) oleh modul Supabase Auth. Karyawan IT/Super Admin sekalipun tidak dapat melihat *password* asli anggota secara polos.
- **Kedaluwarsa Sesi Otomatis (Auto-Logout):** Sesi pengguna (terutama karyawan koperasi) dikonfigurasi agar tertutup otomatis (*session expiration*) apabila terdeteksi tidak ada aktivitas selama batas waktu tertentu. Ini krusial guna menghindari pembajakan akses fisik.
- **Proteksi API Publik:** API *endpoint* (khususnya untuk integrasi aplikasi *mobile* anggota) dipasangi pembatasan arus kueri (*Rate-Limiting*) guna menahan serangan *Distributed Denial of Service* (DDoS) dan *brute-force*.

## 2. Kendali Akses Berbasis Peran (*Role-Based Access Control*)

Sistem menerapkan prinsip Hak Istimewa Terkecil (*Principle of Least Privilege*). Perlindungan akses data tidak hanya dijaga di ranah UI *frontend*, melainkan digembok di level *database* menggunakan **Row-Level Security (RLS)**:

1. **Teller:** Hanya dapat memanipulasi *endpoint* penerimaan/pengeluaran kas. Teller secara struktural *database* akan ditolak jika memaksa membaca data penilaian/keputusan pembiayaan.
2. **Customer Service (CS):** Hanya memiliki otorisasi (tulis/baca) pada profil anggota baru dan pembuatan buku rekening. CS tidak dapat mengeksekusi jurnal kas.
3. **Account Officer (AO):** Hanya memiliki kewenangan *upload* jaminan, analisis BI Checking, dan eksekusi integrasi *prompt* AI RAG.
4. **Manajer/Komite:** Akses terbatas pada *Approval* akhir terhadap pencairan pinjaman, tidak bisa melakukan input jurnal fisik.
5. **Accounting:** Akses dibatasi pada wilayah "hanya-baca" (*read-only*) untuk memeriksa rekonsiliasi teller, serta otorisasi pembuatan jurnal penyesuaian khusus.
6. **Anggota (Aplikasi Mobile):** Kueri RLS *database* difilter berdasarkan `user_id`. Anggota A dijamin secara arsitektur tidak akan bisa menarik data saldo atau histori pinjaman milik Anggota B.

## 3. Ketahanan Infrastruktur & Audit Log

- **Integritas Mutasi (ACID Compliance):** Untuk menangkal risiko "kas nyangkut" akibat kegagalan jaringan saat menghubungi API Flip/PPOB, IQ-RA System menggunakan mekanisme *Database Transactions*. Jika ada satupun proses integrasi yang *timeout* atau gagal, seluruh mutasi jurnal yang berkaitan akan digagalkan (di-*rollback*) secara atomik.
- **Jejak Audit Otomatis (*Audit Trail*):** Setiap tindakan kritikal (Pembuatan Data Baru, Edit Nilai Transaksi, Pembatalan/Void) otomatis direkam lognya. Catatan audit ini mencakup identitas aktor (*user*), nilai sebelumnya, nilai sesudahnya, serta *timestamp* server yang tidak dapat dimanipulasi (*immutable*).

## 4. Keamanan *Codebase* & Rahasia Infrastruktur

- **Sistem Audit Statis Berkelanjutan:** Pipeline integrasi kontinu (GitHub Actions) disyaratkan untuk mem-parsing kode ke **SonarCloud**. Setiap *Pull Request* yang kedapatan menyimpan kerentanan (*Security Vulnerability*, injeksi SQL, ancaman XSS) wajib ditolak sistem (*Failed Quality Gate*).
- **Proteksi Kredensial Sensitif (*Secrets*):**
  - Kunci akses (*keys*) krusial seperti `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, serta kredensial Payment Gateway dilarang keras dipanggil di area *client-side* (Browser/Aplikasi Mobile). Pemanggilannya eksklusif di wilayah SSR/Backend.
  - Aturan *repository* mengharamkan fail `.env` terunggah. Pelanggaran terhadap poin ini mewajibkan pengembang untuk merotasi ulang (*revoke and re-issue*) kunci-kunci API secara instan.

## 5. Prosedur Pelaporan Insiden (Incident Response)

Jika Anda (pengembang, auditor eksternal, atau pengguna) menemukan celah keamanan dalam aplikasi IQ-RA System:
1. **Dilarang** mempublikasikan rincian eksploitasi di *Issue Tracker* publik.
2. Segera kirimkan pemberitahuan insiden beserta rekam buktinya kepada penanggung jawab IT institusi melalui jalur tertutup (email resmi organisasi).
3. Penerbitan *Hotfix* dilakukan pada *branch* tertutup yang akan langsung di-*merge* ke ranah *production* segera setelah patch perbaikan lolos validasi lokal.
