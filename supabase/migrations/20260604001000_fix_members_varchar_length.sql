-- Fix varchar(16) errors by altering columns to TEXT
ALTER TABLE public.members 
  ALTER COLUMN nik TYPE TEXT,
  ALTER COLUMN kk_number TYPE TEXT,
  ALTER COLUMN phone_number TYPE TEXT;
