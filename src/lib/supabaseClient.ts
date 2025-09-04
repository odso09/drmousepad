import { createClient } from '@supabase/supabase-js';

// Lee de variables de entorno provistas por Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn('[supabaseClient] Variables de entorno faltantes. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env');
}

export const supabase = createClient(
	supabaseUrl || 'https://xhgwavkigwjbtvkyrxis.supabase.co',
	supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZ3dhdmtpZ3dqYnR2a3lyeGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjczNzcsImV4cCI6MjA3MjM0MzM3N30.vTQlkgDVQgWJmEo6BCG6fG7KLatAXV3zEUo8XUGqAqY'
);
