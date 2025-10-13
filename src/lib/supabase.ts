import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseUrl, supabaseAnonKey } from './config';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
