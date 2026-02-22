/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As variáveis de ambiente do Supabase estão ausentes.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente secundário usado apenas por Professores/Admins para registrar alunos
// O persistSession: false garante que o Supabase não sobrescreva a sessão do Professor local
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'simbio_admin_auth',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});
