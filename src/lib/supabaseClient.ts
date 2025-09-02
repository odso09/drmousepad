import { createClient } from '@supabase/supabase-js';

// Reemplaza este valor con el de tu proyecto Supabase
const supabaseUrl = 'https://xhgwavkigwjbtvkyrxis.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZ3dhdmtpZ3dqYnR2a3lyeGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjczNzcsImV4cCI6MjA3MjM0MzM3N30.vTQlkgDVQgWJmEo6BCG6fG7KLatAXV3zEUo8XUGqAqY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
