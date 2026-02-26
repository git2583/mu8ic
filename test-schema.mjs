const SUPABASE_URL = 'https://kmqldvkjbgdgwlhstuyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcWxkdmtqYmdkZ3dsaHN0dXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDI3MDEsImV4cCI6MjA4NzUxODcwMX0.9kIJNFRbTKoPp-szYHAFGCyIQmtV-anNZZiyTS6QQkg';

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data.definitions.musics, null, 2));
}

run();
