import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ypztlmwevcqqcfbzzzsa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenRsbXdldmNxcWNmYnp6enNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTUxNDcsImV4cCI6MjA3NDg3MTE0N30.gEoE22qbE4QevfZ8Td4wTeDRxMjfnZwzrTHin3lTMUk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
