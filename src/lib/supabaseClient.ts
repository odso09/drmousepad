import { createClient } from '@supabase/supabase-js';

// Variables de entorno (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fallback (no secreto; el anon key ya estaba en el repo). Recomendado configurar .env o variables en Vercel.
const FALLBACK_URL = 'https://xhgwavkigwjbtvkyrxis.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZ3dhdmtpZ3dqYnR2a3lyeGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjczNzcsImV4cCI6MjA3MjM0MzM3N30.vTQlkgDVQgWJmEo6BCG6fG7KLatAXV3zEUo8XUGqAqY';

const url = supabaseUrl || FALLBACK_URL;
const key = supabaseAnonKey || FALLBACK_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn('[supabaseClient] Usando credenciales de fallback. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para configuraciones por entorno.');
}

export const supabase = createClient(url, key);
