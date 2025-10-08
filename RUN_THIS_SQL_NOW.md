# URGENT: Run This SQL Script Now

## The Problem
- All users (including admin) are redirected to onboarding
- Onboarding fails with RLS policy errors
- INSERT policies are missing

## The Solution

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### Step 2: Run the SQL Script
1. Open the file: `SETUP_DATABASE.sql`
2. **Copy the ENTIRE file contents**
3. Paste into Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Verify Success
You should see success messages like:
- `DO`
- `ALTER TABLE`
- `UPDATE 1` (for admin profile)
- `CREATE POLICY` (multiple times)
- `CREATE FUNCTION` (multiple times)

### Step 4: Refresh Your App
1. Go back to your application
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. Sign in with `nigamaakash101@gmail.com`

## Expected Results

### For Admin Account (`nigamaakash101@gmail.com`):
- ✅ Goes directly to Dashboard (bypasses onboarding)
- ✅ Can see all data
- ✅ Has admin privileges

### For New Users:
- ✅ Goes to onboarding flow
- ✅ Can complete all onboarding steps
- ✅ Creates profile, prompts, competitors successfully

## What This Script Does

1. **Sets up admin profile** with `onboarding_completed = true`
2. **Adds INSERT policies** for all tables (profiles, prompts, competitors, prompt_executions)
3. **Updates subscription tracking** fields and limits
4. **Creates protection trigger** to prevent users from modifying their subscription
5. **Fixes RLS policies** for proper data access

## If You Still See Errors

1. Check the SQL Editor output for specific error messages
2. Make sure you're signed in to the correct Supabase project
3. Verify the admin email is correct: `nigamaakash101@gmail.com`
4. Try signing out and signing back in

## Testing Checklist

After running the script:
- [ ] Admin can sign in and access dashboard
- [ ] Admin bypasses onboarding
- [ ] New users can complete onboarding
- [ ] Users can create prompts
- [ ] Users can add competitors
- [ ] No RLS policy errors in console
