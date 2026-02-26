import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmqldvkjbgdgwlhstuyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcWxkdmtqYmdkZ3dsaHN0dXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDI3MDEsImV4cCI6MjA4NzUxODcwMX0.9kIJNFRbTKoPp-szYHAFGCyIQmtV-anNZZiyTS6QQkg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Testing select...');

  // We can't query information_schema from REST API usually, but we can try to select 1 row
  const { data, error } = await supabase.from('musics').select('*').limit(1);

  console.log('Response:', { data, error });
}

run();
