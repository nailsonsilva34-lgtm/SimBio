import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
        env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nailsonsilva@gmail.com',
        password: 'Noah28-03'
    });

    if (error) {
        console.error("Login Error:", error.message);
        return;
    }

    console.log("Logged in UID:", data.user.id);

    const teacherRes = await supabase
        .from('teachers')
        .select('*')
        .eq('id', data.user.id)
        .single();

    console.log("Teacher Response:", JSON.stringify(teacherRes, null, 2));
}

test();
