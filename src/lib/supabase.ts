import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables missing or empty:', {
    VITE_SUPABASE_URL: supabaseUrl || 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING',
  });
  throw new Error('Missing required Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file and restart the dev server.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
