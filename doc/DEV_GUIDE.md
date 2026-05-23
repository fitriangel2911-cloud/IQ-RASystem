# Panduan Pengembangan (Developer Guide): IQ-RA System

Dokumen ini berisi standar teknis, konvensi, dan alur kerja (*workflow*) yang wajib diikuti oleh seluruh pengembang (*developer*) yang berkontribusi dalam repositori IQ-RA System.

## 1. Lingkungan Pengembangan (Development Environment)

### Prasyarat Perangkat Lunak
- **Node.js**: Versi 18.x atau yang lebih baru.
- **Package Manager**: Sesuai dengan konfigurasi proyek (`npm`, `pnpm`, atau `yarn`).
- **Git**: Manajemen versi repositori.
- **Supabase CLI**: Sangat disarankan untuk menjalankan *database* dan manajemen *migrations* secara lokal.

### Tech Stack Utama
- **Frontend Utama**: Next.js (App Router disarankan), React.js.
- **Bahasa Pemrograman**: TypeScript (*Strict Mode* wajib diaktifkan).
- **Styling**: Tailwind CSS.
- **Database & Auth**: Supabase (PostgreSQL, pgvector, GoTrue).
- **Mesin Orkestrasi AI**: LangChain.js.

## 2. Standar Penulisan Kode (Coding Standards)

- **Wajib TypeScript (Type-Safety):** Penggunaan tipe `any` sangat dilarang kecuali dalam keadaan darurat. Semua objek respons *database* (misal: *JournalEntry*, *CIF*, *FinancingContract*) harus memiliki definisi antarmuka (`interface` atau `type`) yang tegas untuk memblokir *bug* sebelum fase *runtime*.
- **Arsitektur React:** Gunakan *Functional Components*. Disarankan untuk mengisolasi logika UI (presentasional) dari logika pengambilan data (*fetching*).
- **Server Components (Next.js):** Manfaatkan *Server Components* sebisa mungkin untuk mengurangi ukuran *bundle* di *client* dan untuk menyembunyikan logika serta *API keys* yang bersifat rahasia.
- **Desain UI & Multi-Theme**:
  - Gunakan standar utilitas Tailwind CSS serta CSS Variables global yang dinamis (`var(--bg-page)`, `var(--text-primary)`, dll.) untuk seluruh komponen dashboard agar mendukung Mode Siang (Light) dan Malam (Dark) secara otomatis.
  - Untuk halaman publik yang bersifat sakral (Beranda, Login, Register), **desain telah dikunci sepenuhnya** menggunakan latar belakang papercut putih murni dan tidak boleh diubah. Pengembang dilarang keras memodifikasi `GlobalSiteBackground.tsx` tanpa menyertakan isolasi rute (`usePathname`) untuk mencegah kebocoran tema dasbor ke halaman publik.
- **Sidebar & Navigasi:** Gunakan komponen `Sidebar` yang mendukung *state management* `isOpen`. Pastikan konten utama menggunakan margin dinamis atau transisi yang halus agar tidak menutupi (*overlap*) elemen navigasi. Khusus untuk dasbor **Super Admin**, navigasi wajib disusun secara **Flat** (akses langsung ke tugas spesifik operasional) tanpa panel kolaps/lipat bertingkat guna mempermudah audit operasional yang cepat dan efisien. Pada area Sidebar Staff, pastikan `ThemeToggle` memiliki margin atas yang cukup agar tidak bertumpukan dengan tombol tutup (✕). Pada portal anggota, tombol `ThemeToggle` diletakkan terpusat pada header atas bersandingan dengan lencana sinkronisasi aktif.
- **Penekanan Visual (Special Props):** Untuk layanan inti operasional (seperti Layanan Kasir), gunakan prop `isSpecial={true}` pada `DashboardMenuButton` untuk memberikan penekanan visual berupa ukuran teks yang lebih besar dan warna *Dark Emerald Green* yang tegas.

## 3. Aturan Manajemen Database (Supabase)

- **Row-Level Security (RLS):** RLS **wajib** berstatus aktif di seluruh tabel operasional. Dilarang keras melakukan *bypass* autentikasi menggunakan *Service Role Key* secara langsung dari sisi klien (Browser/Aplikasi Mobile).
- **Transaksi ACID (*Double-Entry*):** Setiap mutasi yang berkaitan dengan pergerakan saldo kas dan pembuatan jurnal (*General Ledger*) wajib dikemas dalam *Database Transactions* atau fungsi RPC (*Stored Procedures* PostgreSQL). Ini untuk menjamin tidak adanya mutasi "separuh-jalan" yang menyebabkan kebocoran kas saat koneksi API pihak ketiga terputus.
- **Migrasi Database:** Segala modifikasi struktur tabel harus dieksekusi melalui *migration files* menggunakan Supabase CLI, bukan secara manual melalui *dashboard* antarmuka.

## 4. Keamanan & Manajemen Variabel Lingkungan

- **File Rahasia:** File konfigurasi lokal seperti `.env` atau `.env.local` yang menyimpan kredensial Supabase, kunci API Payment Gateway (Flip/PPOB), dan API LLM **wajib dimasukkan** ke `.gitignore` dan tidak boleh di-komit.
- **Eksekusi Server-Side:** Operasi berat atau sensitif (seperti pemrosesan AI via LangChain atau pemanggilan *Service Key* Supabase) harus ditempatkan secara eksklusif pada *API Routes* atau *Server Actions* Next.js.

## 5. Alur Kerja Git & Pipeline CI/CD

- **Strategi Percabangan (*Branching*):**
  - `main`: Kode *production* (*stable*).
  - `staging`: Kode prapeluncuran untuk keperluan *User Acceptance Testing* (UAT).
  - `feature/nama-fitur`: Untuk pengembangan modul baru.
  - `hotfix/nama-bug`: Untuk perbaikan insiden kritis.
- **Audit Otomatis (GitHub Actions & SonarCloud):**
  - Setiap pengajuan *Pull Request* (PR) menuju `main` atau `staging` akan memicu *pipeline* **GitHub Actions** secara otomatis.
  - Pipeline ini terintegrasi dengan **SonarCloud** untuk meninjau secara statis apakah terdapat *code smells*, *bugs*, atau *security vulnerabilities*.
  - PR **tidak diizinkan** untuk di-*merge* jika indikator kualitas (*Quality Gate*) dari SonarCloud menunjukkan status *Failed*.
