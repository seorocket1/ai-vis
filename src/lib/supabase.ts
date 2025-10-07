import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { config } from './config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || config.supabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || config.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:', {
    VITE_SUPABASE_URL: supabaseUrl || 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING',
  });
  throw new Error('Missing required Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
