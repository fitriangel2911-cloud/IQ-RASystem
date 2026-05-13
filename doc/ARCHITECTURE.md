# Arsitektur Sistem: IQ-RA System

Dokumen ini menguraikan arsitektur tingkat tinggi (*High-Level Architecture*) dari IQ-RA System, sebuah platform keuangan mikro syariah yang terintegrasi dengan teknologi AI (*Retrieval-Augmented Generation*).

## 1. Pendekatan Arsitektur Utama

IQ-RA System mengadopsi arsitektur **Full-stack Serverless**. Pendekatan ini dipilih untuk memastikan:
- **Skalabilitas & Ketersediaan Tinggi (High Availability):** Target SLA 99.9% tercapai tanpa ketergantungan pada perawatan server fisik tunggal secara manual.
- **Efisiensi Pemeliharaan:** Reduksi beban manajemen infrastruktur backend.
- **Kenyamanan Eksekusi Cepat:** Komunikasi yang sangat minim latensi antara antarmuka pengguna, logika server, dan basis data.

## 2. Diagram Arsitektur (High-Level)

```mermaid
graph TD
    %% Lapisan Pengguna
    subgraph User Layer
        U1[Browser Karyawan<br>Teller/AO/Manajer]
        U2[Aplikasi Mobile<br>Anggota Koperasi]
    end

    %% Lapisan Aplikasi
    subgraph Application Layer
        FE[Next.js App<br>React + Tailwind CSS]
        API_Gateway[IQ-RA Mobile Gateway<br>Endpoints]
    end

    %% Lapisan Layanan AI
    subgraph AI & Orchestration Layer
        LC[LangChain.js<br>RAG Pipeline]
    end

    %% Lapisan Data & Backend
    subgraph Backend & Data Layer (Supabase)
        DB_Relational[(PostgreSQL<br>Data Keuangan & Jurnal SAK EP)]
        DB_Vector[(pgvector<br>Knowledge Base Syariah)]
        RLS{Row-Level Security}
    end

    %% Lapisan Pihak Ketiga
    subgraph Third-Party Services
        TP1[Payment Gateway<br>API Transfer]
        TP2[Layanan PPOB]
    end

    %% Relasi Alur Kerja
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

## 3. Komponen Teknologi

### 3.1. Frontend Web (Client-Side & SSR)
- **Framework Utama:** **Next.js (React)** digunakan untuk merender antarmuka pengguna dengan dukungan penuh terhadap *Server-Side Rendering* (SSR) yang optimal untuk performa.
- **Bahasa Pemrograman:** **TypeScript** diimplementasikan untuk menjamin keamanan pengetikan (*type-safety*) demi meminimalisasi *bug* tidak terduga pada saat *runtime*.
- **Styling:** **Tailwind CSS** untuk perancangan UI (User Interface) yang cepat, modular, dan responsif terhadap berbagai ukuran layar.

### 3.2. Backend & Database
IQ-RA System memanfaatkan **Supabase** sebagai *Backend-as-a-Service* (BaaS):
- **PostgreSQL Relasional:** Berfungsi sebagai *Core Banking Engine* utama untuk menyimpan data anggota tersentralisasi (satu CIF), jurnal akuntansi otomatis (*double-entry bookkeeping*), dan riwayat mutasi kas harian.
- **pgvector:** Sebuah ekstensi PostgreSQL khusus untuk menyimpan *vector embeddings* (representasi numerik matematika dari dokumen teks, seperti PDF Fatwa DSN-MUI). Ini memampukan proses *Semantic Search* pada mesin AI.

### 3.3. Mesin Rekomendasi (Modul RAG)
- **LangChain.js:** Berfungsi sebagai *Orchestrator* AI yang bertugas memformat *Prompt* dari Account Officer (AO) dan memproses jawaban akhir.
- **Alur RAG Pipeline:** Bertugas mengekstraksi parameter pembiayaan yang diajukan (tujuan modal, profil anggota, jaminan), mencocokkannya ke *database* vektor hukum syariah, lalu memunculkan skor kecocokan akad beserta catatan mitigasi risikonya.

### 3.4. Integrasi Layanan (Third-Party APIs)
- **API Payment Gateway:** Untuk rekonsiliasi transfer antar bank umum (BCA, BSI, dll) langsung dari antarmuka teller tanpa harus membuka sistem *banking* eksternal.
- **PPOB (Payment Point Online Bank):** Menyediakan layanan tambahan bagi koperasi untuk melayani transaksi pembayaran listrik, dompet digital, dan telekomunikasi.

## 4. Keamanan & *Deployment Pipeline*

- **Row-Level Security (RLS):** Mekanisme keamanan bawaan di level *database* (Supabase). Ini menjamin bahwa setiap data dilindungi berdasarkan profil login pengakses. Teller tidak akan bisa mengakses tombol atau *query* pencairan pembiayaan milik Manajer.
- **Integritas Data (ACID Compliance):** Sistem menggunakan prinsip database transaksional untuk menghindari masalah seperti *"dana menggantung"* (terpotong di sistem tapi gagal di gerbang pembayaran) ketika terjadi latensi jaringan pihak ketiga.
- **CI/CD:** Menggunakan **GitHub Actions** untuk menjalankan pengujian secara berkelanjutan setiap kali ada perubahan kode.
- **Code Audit Otomatis:** Terhubung langsung dengan **SonarCloud** untuk memastikan tidak adanya *vulnerability* (celah keamanan) dan menjaga agar tidak terjadi *code smells*.
