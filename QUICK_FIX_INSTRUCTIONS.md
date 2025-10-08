# Quick Fix Instructions

## Problem
1. RLS policies missing for onboarding (INSERT policies not configured)
2. Admin account redirected to onboarding page

## Solution - Run This SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Copy and Run FIX_RLS_POLICIES.sql
Copy the entire contents of `FIX_RLS_POLICIES.sql` and run it.

This script will:
- ✅ Set your admin account's `onboarding_completed = true`
- ✅ Add INSERT policy for profiles table
- ✅ Add INSERT policy for prompts table
- ✅ Add INSERT policy for competitors table
- ✅ Add INSERT policy for prompt_executions table
- ✅ Add trigger to protect subscription fields
- ✅ Fix UPDATE policies for onboarding

### Step 3: Refresh Your App
After running the SQL script:
1. Clear your browser cache or open in incognito
2. Sign in with: `nigamaakash101@gmail.com`
3. You should now go directly to the dashboard (not onboarding)

## What Was Fixed in the Code

### 1. ProtectedRoute.tsx
- Admins now bypass onboarding requirement
- Checks `is_admin` flag in addition to `onboarding_completed`

### 2. Database Policies
- Added all missing INSERT policies
- Added trigger to prevent users from modifying subscription fields
- Admin profile automatically set up with `onboarding_completed = true`

## Testing New User Onboarding

After fixing the admin issue, you can test onboarding with a new user:
1. Sign out from admin account
2. Create a new account with a different email
3. The new user should go through onboarding flow
4. After completing onboarding, they should see the dashboard

## Why This Happened

The initial database setup had:
- ❌ No INSERT policies (only SELECT, UPDATE, DELETE)
- ❌ Admin profile not automatically marked as onboarding complete
- ❌ ProtectedRoute didn't bypass onboarding for admins

All of these issues are now fixed!
