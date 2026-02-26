async function run() {
  const res = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'make a tropical house music' })
  });
  console.log('Status', res.status);
  const text = await res.text();
  console.log('Body', text);
}

run();
