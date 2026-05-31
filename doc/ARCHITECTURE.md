# Arsitektur Sistem: IQ-RA System

Dokumen ini menguraikan arsitektur tingkat tinggi dari IQ-RA System.

**Versi:** 1.3 | **Diperbarui:** 31 Mei 2026

---

## 1. Pendekatan Arsitektur Utama

IQ-RA System mengadopsi arsitektur **Full-stack Serverless**:
- **Skalabilitas & Ketersediaan Tinggi:** Target SLA 99.9% tanpa server fisik.
- **Efisiensi Pemeliharaan:** Reduksi beban manajemen infrastruktur backend.
- **Eksekusi Cepat:** Latensi minimal antara antarmuka, logika server, dan database.

---

## 2. Diagram Arsitektur (High-Level)

```mermaid
graph TD
    subgraph User Layer
        U1[Browser Karyawan\nTeller/CS/AO/Manajer/Accounting/SuperAdmin]
        U2[Aplikasi Mobile\nAnggota Koperasi]
    end

    subgraph Application Layer
        FE["Next.js App\n(React + TypeScript + Tailwind CSS)"]
        API_Gateway[IQ-RA Mobile Gateway\nEndpoints]
    end

    subgraph AI & Orchestration Layer
        LC[LangChain.js\nRAG Pipeline]
    end

    subgraph Backend & Data Layer - Supabase
        DB_Relational[(PostgreSQL\nData Keuangan & Jurnal SAK EP)]
        DB_Vector[(pgvector\nKnowledge Base Syariah)]
        RLS{Row-Level Security\nRBAC 7 Peran}
    end

    subgraph Third-Party Services
        TP1[Payment Gateway\nFlip API]
        TP2[Layanan PPOB]
    end

    U1 -->|Akses Web HTTPS| FE
    U2 -->|Konsumsi REST API| API_Gateway

    FE -->|Data Akses/Mutasi| RLS
    API_Gateway -->|Akses Read-Only/Limited| RLS
    RLS --> DB_Relational

    FE -->|Input Parameter Pembiayaan| LC
    LC -->|Similarity Search| DB_Vector
    LC -->|Output Skor Rekomendasi Akad| FE

    FE -->|Auto-Reconciliation| TP1
    FE -->|Transaksi Tagihan| TP2
```

---

## 3. Struktur Direktori Aplikasi

```
src/
├── app/
│   ├── page.tsx              ← Homepage publik (LOCKED)
│   ├── login/                ← Halaman login (LOCKED)
│   ├── register/             ← Halaman register (LOCKED)
│   ├── dashboard/            ← Super Admin dashboard
│   ├── teller/               ← Layanan Kasir (6 UI Utama — Aktif)
│   ├── customer-service/     ← Dashboard CS
│   ├── ao/                   ← Dashboard Account Officer
│   ├── accounting/           ← Dashboard Accounting
│   ├── manager/              ← Dashboard Manager
│   ├── dps/                  ← Dashboard DPS
│   ├── members/              ← Portal Anggota
│   └── api/                  ← API Routes (Server-side only)
├── components/
│   ├── brand/BrandLogo.tsx
│   └── dashboard/
│       ├── TellerTerminal.tsx        ← Komponen transaksi teller
│       ├── CSDashboard.tsx
│       ├── AccountingDashboard.tsx
│       ├── GlobalSiteBackground.tsx  ← Background papercut (LOCKED)
│       └── ...
├── lib/
│   ├── supabase/             ← Klien Supabase
│   └── constants/coa.ts      ← Chart of Accounts (COA SAK EP)
└── services/
    └── accounting.service.ts ← Logika double-entry
```

---

## 4. Komponen Teknologi

### 4.1. Frontend Web
- **Framework:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS + CSS Variables (`var(--bg-page)`, `var(--gold-bright)`, dll.).
- **Tema:** Light/Dark Mode via `ThemeContext` dan class `.light-mode`.

### 4.2. Backend & Database (Supabase)

| Tabel | Fungsi |
|---|---|
| `users` | Kredensial & RBAC (7 peran) dengan RLS |
| `members` | Data CIF anggota (KYC & APU-PPT) |
| `savings_accounts` | Rekening simpanan (pokok/wajib/wadiah) |
| `savings_transactions` | Mutasi setoran & penarikan harian |
| `journal_entries` | Buku besar double-entry SAK EP |
| `financing_contracts` | Akad pembiayaan, amortisasi, nisbah, `audit_metadata` (JSONB) |
| `prospects` | Pipeline pengajuan calon debitur (AO workflow) |
| `purifications` | Riwayat alokasi dana non-halal ke sektor sosial (ZISWAF) |
| `teller_shifts` | Log buka/tutup shift kasir harian |
| `system_parameters` | Parameter dinamis operasional koperasi |
| `sharia_knowledge` | Vector embeddings fatwa DSN-MUI (pgvector, 1536-dim) |

### 4.3. Modul RAG (AI Engine)
- **LangChain.js:** Orkestrator prompt & pipeline RAG.
- **pgvector:** Similarity search knowledge base syariah (1536-dim).
- **Model Embedding:** `gemini-embedding-001` (Google AI) — dengan auto-retry 429, zero-padding/slicing otomatis.
- **Model LLM:** `gemini-2.5-flash` (cascade fallback ke `gemini-1.5-flash`).
- **Alur Audit DPS:** Kontrak dipilih → `/api/ai/audit-contract` → RAG context → Opini + Compliance Score → DPS checklist.

### 4.4. Chart of Accounts (COA SAK EP)
Defined in `src/lib/constants/coa.ts`:
- `101.01` — Kas di Tangan (CASH_ON_HAND)
- `301.01` — Simpanan Pokok (SAVINGS_WADIAH)
- `401.01` — Piutang Murabahah (RECEIVABLE_MURABAHAH)
- `401.02` — Pendapatan Administrasi (INCOME_SERVICE_FEE)
- `302.01` — Dana Kebajikan / Retained Earnings

---

## 5. Arsitektur UI Teller (6 Panel)

```mermaid
graph LR
    Sidebar -->|[1]| P1[Dasbor Shift]
    Sidebar -->|[2]| P2[Profil Anggota]
    Sidebar -->|[3]| P3[Setoran Tunai]
    Sidebar -->|[4]| P4[Penarikan Tunai]
    Sidebar -->|[5]| P5[Angsuran]
    Sidebar -->|[6]| P6[Buka/Tutup Shift]

    P2 -.->|shared state selectedMember| P3
    P2 -.->|shared state selectedMember| P4
    P2 -.->|shared state selectedMember| P5
```

---

## 6. Keamanan & Deployment Pipeline

- **RLS:** Seluruh tabel dilindungi RLS berdasarkan peran login.
- **ACID Compliance:** Transaksi double-entry tidak boleh separuh-jalan.
- **CI/CD:** GitHub Actions + SonarCloud untuk setiap PR ke `main`/`staging`.
- **Secrets:** `.env.local` masuk `.gitignore`, API keys hanya di server-side.
