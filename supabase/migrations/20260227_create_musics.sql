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

-- Enable RLS
ALTER TABLE public.musics ENABLE ROW LEVEL SECURITY;

-- Select Policy: All authenticated users can view
CREATE POLICY "Authenticated users can select musics"
ON public.musics
FOR SELECT
TO authenticated
USING (true);

-- Insert Policy: Users can only insert their own musics
CREATE POLICY "Users can insert their own musics"
ON public.musics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update Policy: Users can only update their own musics
CREATE POLICY "Users can update their own musics"
ON public.musics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Delete Policy: Users can only delete their own musics
CREATE POLICY "Users can delete their own musics"
ON public.musics
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Phase 3: Create "musics" storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('musics', 'musics', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the bucket's objects
-- Storage Select Policy: Publicly readable since bucket is public
CREATE POLICY "Public Read Access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'musics');

-- Storage Insert Policy: Users can upload their own files
CREATE POLICY "Users can upload music files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'musics' AND auth.uid() = owner);

-- Storage Update Policy: Users can update their own files
CREATE POLICY "Users can update their music files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'musics' AND auth.uid() = owner);

-- Storage Delete Policy: Users can delete their own files
CREATE POLICY "Users can delete their music files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'musics' AND auth.uid() = owner);
