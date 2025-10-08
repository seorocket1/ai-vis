import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdminUser() {
  const adminEmail = 'nigamaakash101@gmail.com';

  console.log('Setting admin status for:', adminEmail);

  // Update the user to admin
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('email', adminEmail)
    .select();

  if (error) {
    console.error('Error setting admin:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✓ Successfully set admin status for:', adminEmail);
    console.log('Admin user details:', data[0]);
  } else {
    console.log('⚠ User not found. Please make sure the user has signed up first.');
    console.log('The admin status will be set automatically when they sign up.');
  }

  // Verify only this user is admin
  const { data: allAdmins, error: adminError } = await supabase
    .from('profiles')
    .select('email, is_admin')
    .eq('is_admin', true);

  if (!adminError && allAdmins) {
    console.log('\nCurrent admin users:');
    allAdmins.forEach(admin => console.log('  -', admin.email));
  }
}

setAdminUser();
