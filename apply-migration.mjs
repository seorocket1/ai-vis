import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = readFileSync('./supabase/migrations/20251008000000_add_insert_policies.sql', 'utf8');

console.log('Applying migration...');
console.log('Note: This will fail with anon key. You need service_role key for DDL operations.');
console.log('\nMigration SQL:');
console.log(migrationSQL);
