-- ==========================================
-- SQL Schema Definition (SAK EP / PSAK Compliance)
-- Matches definitions in blueprints & data specification
-- ==========================================

-- Enable pgvector extension for RAG Pipeline
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. USERS TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('teller', 'customer_service', 'account_officer', 'manager', 'accounting', 'super_user', 'member')) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FINANCING CONTRACTS
CREATE TABLE IF NOT EXISTS financing_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES users(id),
    type TEXT CHECK (type IN ('murabahah', 'mudharabah', 'musyarakah', 'ijarah', 'istishna', 'qardhul_hasan')),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. JOURNAL ENTRIES (Double-Entry / SAK EP)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    reference_no TEXT,
    description TEXT,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    account_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SHARIA KNOWLEDGE BASE (pgvector for AI Semantic Search)
CREATE TABLE IF NOT EXISTS sharia_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536) -- Dimensions matching standard OpenAI / Gemini embeddings
);
