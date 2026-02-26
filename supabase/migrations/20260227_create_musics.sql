-- Phase 2: Create "musics" table
CREATE TABLE IF NOT EXISTS public.musics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'Unknown',
    file_url TEXT,
    duration INT4, -- in seconds
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT, -- user's prompt for generating the music
    status TEXT DEFAULT 'completed', -- generating, completed, failed
    image_url TEXT -- cover art
);

-- Force add columns in case the table existed before but was missing them
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS duration INT4;
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS artist TEXT DEFAULT 'Unknown';

-- Enable RLS
ALTER TABLE public.musics ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can select musics" ON public.musics;
    CREATE POLICY "Authenticated users can select musics"
    ON public.musics FOR SELECT TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Users can insert their own musics" ON public.musics;
    CREATE POLICY "Users can insert their own musics"
    ON public.musics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own musics" ON public.musics;
    CREATE POLICY "Users can update their own musics"
    ON public.musics FOR UPDATE TO authenticated USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own musics" ON public.musics;
    CREATE POLICY "Users can delete their own musics"
    ON public.musics FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;

-- Phase 3: Create "musics" storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('musics', 'musics', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the bucket's objects
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    CREATE POLICY "Public Read Access"
    ON storage.objects FOR SELECT TO public USING (bucket_id = 'musics');

    DROP POLICY IF EXISTS "Users can upload music files" ON storage.objects;
    CREATE POLICY "Users can upload music files"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'musics' AND auth.uid() = owner);

    DROP POLICY IF EXISTS "Users can update their music files" ON storage.objects;
    CREATE POLICY "Users can update their music files"
    ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'musics' AND auth.uid() = owner);

    DROP POLICY IF EXISTS "Users can delete their music files" ON storage.objects;
    CREATE POLICY "Users can delete their music files"
    ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'musics' AND auth.uid() = owner);
END $$;
