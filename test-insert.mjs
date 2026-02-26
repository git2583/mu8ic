import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmqldvkjbgdgwlhstuyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcWxkdmtqYmdkZ3dsaHN0dXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDI3MDEsImV4cCI6MjA4NzUxODcwMX0.9kIJNFRbTKoPp-szYHAFGCyIQmtV-anNZZiyTS6QQkg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Testing insert...');

  // Try inserting without auth first, will fail on RLS But we can see if table exists
  const { data, error } = await supabase.from('musics').insert({
    title: 'Test',
    user_id: '00000000-0000-0000-0000-000000000000',
    prompt: 'test prompt',
    status: 'generating'
  }).select();

  console.log('Response:', { data, error });
}

run();
