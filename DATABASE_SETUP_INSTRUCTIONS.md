# Database Setup Instructions - UPDATED

## ⚠️ CRITICAL: Run COMPLETE_FIX.sql Instead

**DO NOT USE THE OLD SETUP_DATABASE.sql FILE**

Use `COMPLETE_FIX.sql` which includes:
- All subscription features
- Fixed RLS policies (no infinite recursion)
- Auto-profile creation trigger
- All INSERT policies for tables

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar (or go to: https://supabase.com/dashboard/project/_/sql)

### Step 2: Run the Setup SQL

1. Click "New Query" in the SQL Editor
2. Open the file `SETUP_DATABASE.sql` in this project
3. Copy the entire contents of `SETUP_DATABASE.sql`
4. Paste it into the SQL Editor
5. Click "Run" or press `Ctrl/Cmd + Enter`

### Step 3: Verify Success

You should see a success message like:
```
Success. No rows returned
```

If you see any errors, check the troubleshooting section below.

### Step 4: Refresh Your Application

1. Go back to your application
2. Refresh the page (F5 or Ctrl/Cmd + R)
3. Sign in with `nigamaakash101@gmail.com`
4. Navigate to the Admin dashboard
5. You should now see all users and be able to manage plans

---

## What This Setup Does

The SQL script adds the following to your database:

### New Columns Added to `profiles` table:
- `subscription_plan` - Either 'free' or 'pro'
- `plan_started_at` - When the current plan started
- `monthly_query_limit` - 5 for free, 500 for pro
- `queries_used_this_month` - Current usage counter
- `last_query_reset_at` - When queries were last reset

### Functions Created:
- `update_query_limit()` - Auto-updates limits when plan changes
- `check_plan_expiration()` - Auto-downgrades Pro users after 30 days
- `reset_monthly_queries()` - Resets query counts every 30 days
- `increment_query_usage()` - Safely increments query usage

### Security (RLS Policies):
- Admin can view and manage all users
- Users can only view/update their own profile
- Users cannot change their own plan or limits
- Only admin can modify subscription plans

---

## Features After Setup

Once the database is set up, you'll have access to:

### For Admin (nigamaakash101@gmail.com):
✅ View all users in Admin Dashboard
✅ Upgrade users to Pro (500 queries/month for 30 days)
✅ Downgrade users to Free (5 queries/month)
✅ Reset user query counts
✅ View all prompts for each user
✅ See real-time usage statistics

### For All Users:
✅ Query usage tracking in sidebar
✅ Monthly query limits enforced
✅ Clear error messages when limit reached
✅ Automatic query reset every 30 days
✅ Pro users auto-downgrade after 30 days

---

## Troubleshooting

### Error: "column already exists"
This is normal if you've run the script before. The script uses `IF NOT EXISTS` to handle this safely. The setup is complete.

### Error: "permission denied"
Make sure you're signed in to Supabase and have owner/admin permissions on the project.

### Users Still Not Showing in Admin
1. Make sure you're signed in as `nigamaakash101@gmail.com`
2. Clear browser cache and refresh
3. Check browser console (F12) for errors
4. Verify the SQL script ran successfully

### Query Limits Not Working
1. Refresh the page after running the SQL
2. Check browser console for any errors
3. Try signing out and signing back in
4. Verify the `subscription_plan` column exists:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'subscription_plan';
   ```

### "Could not find the 'plan_started_at' column" Error
This means the SQL script hasn't been run yet. Follow steps 1-3 above.

---

## Manual Verification

To verify the setup worked, run this query in the SQL Editor:

```sql
SELECT
  email,
  subscription_plan,
  monthly_query_limit,
  queries_used_this_month,
  is_admin
FROM profiles
ORDER BY created_at DESC;
```

You should see:
- All users with their email addresses
- Each user has a `subscription_plan` (free or pro)
- Each user has a `monthly_query_limit` (5 or 500)
- Query usage counts
- Admin flag for nigamaakash101@gmail.com

---

## After Setup is Complete

1. **Deploy to Netlify** (if you haven't already):
   - Follow instructions in the main README
   - Set environment variables in Netlify dashboard

2. **Test Admin Features**:
   - Sign in as `nigamaakash101@gmail.com`
   - Go to Admin dashboard
   - Try upgrading a test user to Pro
   - Verify query limits are enforced

3. **Test User Features**:
   - Sign in as a regular user
   - Check query usage in sidebar
   - Try to trigger prompts
   - Verify limits are enforced

---

## Need Help?

If you're still having issues after following these steps:
1. Check the browser console (F12) for detailed error messages
2. Check the Supabase logs in your dashboard
3. Verify your Supabase connection settings in `.env`
4. Make sure you're using the latest version of the code

The application has been designed to gracefully handle missing columns, but for full functionality, the database setup is required.
