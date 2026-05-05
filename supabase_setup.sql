-- Create the 'musics' table (if it doesn't already exist from previous steps)
CREATE TABLE IF NOT EXISTS public.musics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  file_url text, 
  prompt text,
  duration float,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'GENERATING',
  is_visible boolean default true
);

-- In case the table already exists, add the column if missing
ALTER TABLE public.musics ADD COLUMN IF NOT EXISTS is_visible boolean default true;

-- Enable Row Level Security
ALTER TABLE public.musics ENABLE ROW LEVEL SECURITY;

-- Apply policies for authenticated users
DROP POLICY IF EXISTS "Users can view their own musics" ON public.musics;
DROP POLICY IF EXISTS "Public can view any musics" ON public.musics;
CREATE POLICY "Public can view any musics" ON public.musics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own musics" ON public.musics;
CREATE POLICY "Users can insert their own musics" ON public.musics FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own musics" ON public.musics;
CREATE POLICY "Users can update their own musics" ON public.musics FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own musics" ON public.musics;
CREATE POLICY "Users can delete their own musics" ON public.musics FOR DELETE USING (auth.uid() = user_id);

-- Storage Setup (musics bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('musics', 'musics', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Music files are publicly accessible" ON storage.objects;
CREATE POLICY "Music files are publicly accessible" ON storage.objects 
FOR SELECT USING (bucket_id = 'musics');

DROP POLICY IF EXISTS "Authenticated users can upload music" ON storage.objects;
CREATE POLICY "Authenticated users can upload music" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'musics' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own music files" ON storage.objects;
CREATE POLICY "Users can delete own music files" ON storage.objects 
FOR DELETE USING (bucket_id = 'musics' AND auth.role() = 'authenticated');
