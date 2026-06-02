# Panduan Pengembangan (Developer Guide): IQ-RA System

Dokumen ini berisi standar teknis, konvensi, dan alur kerja (*workflow*) yang wajib diikuti oleh seluruh pengembang yang berkontribusi dalam repositori IQ-RA System.

**Versi:** 1.2 | **Diperbarui:** 24 Mei 2026

---

## 1. Lingkungan Pengembangan

### Prasyarat Perangkat Lunak
- **Node.js**: Versi 18.x atau lebih baru.
- **Package Manager**: `npm` (sesuai konfigurasi proyek).
- **Git**: Manajemen versi repositori.
- **Supabase CLI**: Disarankan untuk manajemen *migrations* lokal.

### Tech Stack Utama
- **Frontend:** Next.js (App Router), React.js, TypeScript (*Strict Mode*).
- **Styling:** Tailwind CSS + CSS Variables global.
- **Database & Auth:** Supabase (PostgreSQL, pgvector, GoTrue).
- **AI Orchestration:** LangChain.js.

### Perintah Dasar
```bash
npm run dev      # Jalankan dev server (localhost:3000)
npm run build    # Build produksi (hanya jika diminta)
npm run lint     # Cek linting TypeScript
```

---

## 2. Standar Penulisan Kode

### TypeScript
- Penggunaan `any` dilarang kecuali darurat. Semua objek dari Supabase wajib memiliki `interface` atau `type` yang jelas.
- Gunakan *Functional Components* untuk semua komponen React.
- Manfaatkan *Server Components* Next.js semaksimal mungkin untuk menyembunyikan API keys.

### Desain UI & Tema
- Gunakan **CSS Variables** global (`var(--bg-page)`, `var(--text-primary)`, dll.) untuk semua komponen dashboard agar mendukung Light/Dark Mode otomatis.
- Palet warna resmi:
  - Dark Emerald: `#043121` / `#084b35`
  - Metallic Gold: `#cca334` / `#f3c653` / `#a67e26`
  - Slate Arang: `#334155` / `#1e293b`
- **Aturan Emas Pembersihan Emoji ("Sistem, Bukan Mainan")**: Dilarang keras menggunakan emoji dekoratif atau ikon informal pada antarmuka sistem (terutama di bagian pengawasan syariah DPS, asisten AI, dan laporan resmi). Gunakan tipografi yang bersih, variabel border semantik CSS, atau SVG formal jika penanda visual diperlukan.

---

## 3. ⚠️ Halaman yang DIKUNCI (LOCKED PAGES)

Halaman berikut **TIDAK BOLEH diubah** dalam kondisi apapun tanpa persetujuan eksplisit:

| File | Alasan Kunci |
|---|---|
| `src/app/page.tsx` | Homepage publik — desain final disetujui 24 Mei 2026 |
| `src/app/login/` | Halaman login — desain glassmorphism final |
| `src/app/register/` | Halaman register — desain final |
| `src/components/dashboard/GlobalSiteBackground.tsx` | Background papercut — dilarang dimodifikasi tanpa isolasi rute |

**Perubahan homepage yang sudah dikunci:**
- Logo navbar diperbesar: `size={56}`, `fontSize="28px"`
- Padding HeroSection dikurangi: `pt-2 pb-8 md:pt-4 md:pb-16`
- Padding ProfilSection dikurangi: `pt-4 pb-16 md:pt-6 md:pb-20`

---

## 4. Konvensi Sidebar & Navigasi

- Komponen `Sidebar` mendukung state `isOpen` dengan transisi halus.
- Konten utama gunakan `marginLeft` dinamis saat sidebar terbuka.
- **Super Admin:** Navigasi wajib **Flat** (akses langsung ke tugas) tanpa panel kolaps bertingkat.
- **Teller Terminal:** Navigasi 6 panel via keyboard shortcut `[1]`–`[6]`. Setiap item menu menampilkan hint shortcut kecil.
- Prop `isSpecial={true}` pada `DashboardMenuButton` untuk layanan inti (mis. Layanan Kasir).

---

## 5. Konvensi Modul Teller (6 UI Utama)

Panel navigasi di `src/app/teller/page.tsx`:

| Key | Panel | Shortcut |
|---|---|---|
| `dashboard` | Status Shift & Dasbor | `[1]` |
| `member` | Profil & Pencarian Anggota | `[2]` |
| `deposit` | Setoran Tunai | `[3]` |
| `withdrawal` | Penarikan Tunai | `[4]` |
| `payment` | Pembayaran Angsuran | `[5]` |
| `shift` | Buka / Tutup Shift | `[6]` |

**State yang di-share antar panel** (disimpan di `page.tsx`):
- `selectedMember` — anggota yang sedang aktif dilayani
- `balance` — saldo anggota terpilih
- `shiftStatus` — status shift aktif/tutup

**Limit otorisasi:** Penarikan > Rp 5.000.000 wajib memicu pop-up otorisasi supervisor.

---

## 6. Aturan Manajemen Database (Supabase)

- **RLS wajib aktif** di seluruh tabel operasional. Dilarang bypass via Service Role Key dari sisi klien.
- **Transaksi ACID (Double-Entry):** Mutasi saldo dan jurnal wajib dikemas dalam Database Transactions atau RPC.
- **Migrasi Database:** Modifikasi struktur tabel hanya via Supabase CLI migration files.

---

## 7. Keamanan & Variabel Lingkungan

- File `.env` / `.env.local` wajib masuk `.gitignore`.
- Operasi sensitif (LangChain, Supabase Service Key) hanya di API Routes atau Server Actions Next.js.

---

## 8. Alur Kerja Git & CI/CD

### Strategi Branching
- `main` — Kode production (stable).
- `staging` — Prapeluncuran untuk UAT.
- `feature/nama-fitur` — Pengembangan modul baru.
- `hotfix/nama-bug` — Perbaikan insiden kritis.

### Pipeline Otomatis
- Setiap PR ke `main` atau `staging` memicu GitHub Actions.
- Terhubung SonarCloud untuk deteksi *code smells* & *vulnerabilities*.
- PR tidak diizinkan merge jika Quality Gate SonarCloud *Failed*.
