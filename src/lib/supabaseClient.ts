import { createClient } from '@supabase/supabase-js';

// Requiere variables de entorno provistas por Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
	// Forzar configuración correcta en dev y en Vercel
	throw new Error('[supabaseClient] Faltan variables de entorno: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
