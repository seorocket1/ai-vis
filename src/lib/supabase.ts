import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey
);
