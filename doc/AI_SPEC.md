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
- **Knowledge Base (Korpus Data):** Tabel `sharia_knowledge` akan diisi secara berkala oleh Super User dengan literatur utama seperti:
  1. Dokumen resmi Fatwa DSN-MUI (Dewan Syariah Nasional - Majelis Ulama Indonesia).
  2. Standar Operasional Prosedur (SOP) Pembiayaan Koperasi.
  3. Dokumen regulasi PSAK Syariah.

## 3. Alur Pemrosesan (*RAG Pipeline*)

Siklus kerja kecerdasan buatan ini dibagi menjadi lima tahapan sistematis:

1. **Ingesti (Ingestion):** Super User/Administrator mengunggah dokumen referensi syariah berbentuk PDF atau teks.
2. **Transformasi (Chunking):** Dokumen panjang dipecah-pecah (*chunking*) menjadi fragmen-fragmen pendek (misalnya per pasal atau poin fatwa) agar konteks batasannya lebih spesifik.
3. **Vektorisasi (Embedding):** Model embedding mengubah teks tersebut menjadi array angka matriks (*embeddings*) yang kemudian disimpan secara permanen di `pgvector`.
4. **Retrieval (Pencarian Konteks):** Ketika AO menginput data profil pengajuan anggota (contoh kasus: *"Butuh dana 50 juta untuk beli traktor sawah, agunan BPKB"*), LangChain menjalankan *Similarity Search* matematis untuk mencari fatwa atau SOP yang relevan dengan kasus "pembelian alat pertanian beragunan".
5. **Generasi (Synthesis):** Konteks hukum yang didapatkan dari database diserahkan kepada LLM. LLM lalu merangkainya menjadi jawaban yang mudah dibaca oleh manusia.

## 4. Format Input dan Output (*Interface*)

**Input Parameter (dari *Account Officer*):**
- **Tujuan Penggunaan:** Modal Kerja, Investasi Pembangunan, atau Konsumtif.
- **Spesifikasi Objek:** Barang fisik atau jenis usaha yang dibiayai.
- **Kondisi Agunan:** Jenis jaminan (jika ada).

**Output yang Dihasilkan LLM (Tampil di Dashboard AO):**
- **Skor Kecocokan Akad:** Probabilitas bentuk akad yang paling ideal (Contoh visual: *Murabahah - 90%*, *Mudharabah - 30%*).
- **Justifikasi Syariah:** Penjelasan singkat berbasis fatwa mengapa akad tersebut cocok.
- **Syarat Mitigasi Risiko:** Syarat administratif (*compliance notes*) tambahan sebelum pencairan (Contoh: *"Karena menggunakan skema Murabahah (jual-beli), AO wajib menerbitkan surat Wakalah (perwakilan) jika anggota yang ditugaskan membeli traktor tersebut dari supplier, dan nota pembelian fisik wajib diarsip."*).
