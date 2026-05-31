# Spesifikasi AI (Artificial Intelligence): IQ-RA RAG Engine

Dokumen ini memuat spesifikasi teknis dan fungsional dari mesin kecerdasan buatan (*Artificial Intelligence*) yang digunakan dalam IQ-RA System. Fokus utama AI pada platform ini adalah sebagai **Smart Decision Support System** yang memanfaatkan arsitektur *Retrieval-Augmented Generation* (RAG).

## 1. Tujuan dan Ruang Lingkup AI

Implementasi AI pada sistem ini dirancang **bukan** untuk menyetujui pembiayaan secara otonom, melainkan berfungsi murni sebagai **Asisten Rekomendasi** bagi *Account Officer* (AO) dan Komite. 
Ruang lingkup kemampuan AI meliputi:
- Menganalisis parameter pengajuan pembiayaan secara tekstual.
- Mencocokkan kasus pembiayaan riil dengan literatur hukum syariah yang diizinkan.
- Memberikan skor probabilitas kecocokan (*match score*) untuk menentukan jenis akad pembiayaan terbaik (Murabahah, Mudharabah, Musyarakah, Ijarah, Qardh).

## 2. Arsitektur Teknis RAG Engine

Sistem menggunakan kerangka kerja RAG untuk menekan angka halusinasi (*hallucination*) pada *Large Language Model* (LLM). Dengan RAG, AI "dipaksa" menjawab hanya berdasarkan basis pengetahuan otentik yang disediakan oleh sistem, bukan dari internet secara bebas.

- **AI Orchestrator:** **LangChain.js** digunakan untuk mengatur rantai proses (*chaining*), merakit *prompt*, dan menjembatani komunikasi antara LLM dengan *database*.
- **Vector Database:** Ekstensi **pgvector** di dalam PostgreSQL (via Supabase) bertugas menyimpan dan mencari representasi numerik (*vector embeddings*) dari fragmen teks hukum.
- **Knowledge Base (Korpus Data):** Tabel `sharia_knowledge` akan diisi secara berkala oleh Super Admin dengan literatur utama seperti:
  1. Dokumen resmi Fatwa DSN-MUI (Dewan Syariah Nasional - Majelis Ulama Indonesia).
  2. Standar Operasional Prosedur (SOP) Pembiayaan Koperasi.
  3. Dokumen Standar Akuntansi & PSAK (IAI) - Kategori `IAI_PSAK`.
  4. Regulasi Pemerintah / Undang-Undang - Kategori `REGULASI`.
  5. Sumber Buku / Kitab Fikih - Kategori `BUKU_FIKIH`.

## 3. Alur Pemrosesan (*RAG Pipeline*)

Siklus kerja kecerdasan buatan ini dibagi menjadi lima tahapan sistematis:

1. **Ingesti (Ingestion):** Administrator mengunggah dokumen referensi syariah berbentuk teks atau dokumen fisik.
2. **Transformasi (Chunking):** Dokumen panjang dipecah-pecah (*chunking*) menjadi fragmen-fragmen pendek agar konteks batasannya lebih spesifik.
3. **Vektorisasi (Embedding):** Model embedding mengubah teks tersebut menjadi array angka matriks (*embeddings*) berdimensi 1536 yang kemudian disimpan secara permanen di database `pgvector` (`sharia_knowledge`).
4. **Retrieval (Pencarian Konteks):** Ketika AO menginput data profil pengajuan anggota, LangChain menjalankan *Similarity Search* matematis untuk mencari fatwa atau referensi syariah terdekat.
5. **Generasi (Synthesis):** Konteks hukum yang didapatkan dari database diserahkan kepada LLM untuk merangkainya menjadi jawaban komprehensif.

## 4. Format Input dan Output (*Interface*)

**Input Parameter (dari *Account Officer*):**
- **Tujuan Penggunaan:** Modal Kerja, Investasi Pembangunan, atau Konsumtif.
- **Spesifikasi Objek:** Barang fisik atau jenis usaha yang dibiayai.
- **Kondisi Agunan:** Jenis jaminan (jika ada).

**Output yang Dihasilkan LLM (Tampil di Dashboard AO):**
- **Skor Kecocokan Akad:** Probabilitas bentuk akad yang paling ideal (Contoh: *Murabahah - 90%*, *Mudharabah - 30%*).
- **Justifikasi Syariah:** Penjelasan singkat berbasis fatwa mengapa akad tersebut cocok.
- **Syarat Mitigasi Risiko:** Syarat administratif (*compliance notes*) tambahan sebelum pencairan.

## 5. Spesifikasi Teknis Integrasi & Keandalan (*Robustness*)

Untuk menjamin keandalan sistem pada level produksi, IQ-RA RAG Engine dilengkapi dengan mekanisme pertahanan mandiri berikut:

- **Model Vektor Aktif (`gemini-embedding-001`)**: Migrasi penuh dari model lama `text-embedding-004` (dimatikan Google sejak Januari 2026) ke model handal `gemini-embedding-001`.
- **Adaptasi Dimensi Otomatis (1536-dim)**: Dilengkapi modul *slicing* (pemotongan) dan *zero-padding* otomatis untuk menjamin semua output model embedding Google diselaraskan secara presisi ke tipe data database `vector(1536)`.
- **Auto-Retry & Exponential Backoff (429 handling)**: Sistem secara otomatis menunda eksekusi selama 3 detik dan mencoba kembali hingga 3 kali jika mendeteksi batas kuota gratisan per menit dari Google terlampaui (*429 Resource Exhausted*).
- **Server-Side RLS Bypass**: Jalur penulisan database pada `/api/ai/ingest` mendukung penggunaan kunci `SUPABASE_SERVICE_ROLE_KEY` secara aman di sisi server untuk kelancaran penyimpanan korpus data tanpa terhambat oleh kebijakan Row Level Security (RLS) pada tabel.
- **Auto-Migration Skema Data**: Terintegrasi penyelarasan dinamis saat dasbor dibuka untuk secara otomatis merapikan dokumen lama ke struktur kategori terbaru tanpa merusak data asli.
