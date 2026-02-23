import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
        env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    }
});

const url = `${env.VITE_SUPABASE_URL}/rest/v1/teachers?select=*&id=eq.c329fade-ae4f-4bf2-b8cf-5136b0d4cbb6`;

fetch(url, {
    headers: {
        'apikey': env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'application/vnd.pgrst.object+json'
    }
})
    .then(r => r.text().then(b => ({ status: r.status, body: b })))
    .then(console.log)
    .catch(console.error);
