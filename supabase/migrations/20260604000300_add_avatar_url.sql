-- Add avatar_url to members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
