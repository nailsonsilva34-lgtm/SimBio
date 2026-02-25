import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config({ path: 'c:/Users/Nailson/Downloads/remix_-símbio---portal-de-biologia/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerTeacher() {
    console.log('Attempting to register teacher...');
    const { data, error } = await supabase.auth.signUp({
        email: 'nailsonsilva34@gmail.com',
        password: 'Noah28-03',
        options: {
            data: {
                name: 'Nailson Silva',
                role: 'teacher'
            }
        }
    });

    if (error) {
        console.error('Registration failed:', error.message, error.status);
        return;
    }

    console.log('User created:', data.user?.id);

    // Wait a moment for trigger to create profile
    await new Promise(r => setTimeout(r, 2000));

    // Insert into teachers table
    if (data.user?.id) {
        const { error: tErr } = await supabase.from('teachers').insert({ id: data.user.id });
        if (tErr) console.error('Error inserting into teachers table:', tErr);
        else console.log('Successfully added to teachers table.');
    }
}

registerTeacher();
