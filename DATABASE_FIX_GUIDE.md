# Database Fix Guide

## The Problem

Your database schema was manually modified, causing:
- Missing data in Analytics page
- Broken Competitor Analysis page
- Unable to trigger prompt analysis
- Data not being saved from edge functions

## The Solution

Follow these steps to completely rebuild your database with the correct schema.

---

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project (0ec90b57d6e95fcbda19832f)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

---

## Step 2: Run the Rebuild Script

1. Open the file `REBUILD_DATABASE.sql` in this project
2. **Copy ALL the contents** (the entire file)
3. **Paste** into the Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)

**⚠️ Important:** This script will:
- Drop all existing tables
- Recreate them with the correct structure
- Restore your existing user accounts
- Set up all necessary RLS policies

---

## Step 3: Verify the Fix

After running the script, verify that all tables were created:

```sql
-- Run this query to check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these 8 tables:
- ✅ aggregated_metrics
- ✅ brand_mentions
- ✅ competitors
- ✅ profiles
- ✅ prompt_executions
- ✅ prompts
- ✅ recommendations
- ✅ sentiment_analysis

---

## Step 4: Check Your Profile

Run this query to verify your profile exists:

```sql
SELECT id, email, brand_name, onboarding_completed, is_admin
FROM profiles;
```

You should see your user account listed.

---

## Step 5: Test the Application

1. **Refresh your app** in the browser
2. Go to **Settings** and complete onboarding if needed:
   - Enter your brand name
   - Enter your website URL
   - Add competitors
3. Go to **Prompts** and create a prompt
4. Click **Trigger Analysis** on a prompt
5. Wait for it to complete
6. Check **Analytics** and **Competitor Analysis** pages

---

## What Was Fixed

### Tables Recreated:
1. **profiles** - User accounts with brand info
2. **competitors** - Competitor tracking
3. **prompts** - User-created prompts
4. **prompt_executions** - Analysis results
5. **brand_mentions** - Brand visibility data
6. **sentiment_analysis** - Sentiment scores
7. **recommendations** - AI recommendations
8. **aggregated_metrics** - Summary statistics

### Row Level Security:
- All tables have proper RLS policies
- Users can only see their own data
- Edge functions have service role access
- Admins can view all user profiles

### Database Functions:
- Auto-create profile when new user signs up
- Proper foreign key relationships
- Cascade deletes to prevent orphaned data

---

## Common Issues & Solutions

### Issue: "relation already exists" error
**Solution:** The script already handles this with `IF EXISTS` checks. If you still get this error, try running the DROP statements first:

```sql
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS sentiment_analysis CASCADE;
DROP TABLE IF EXISTS brand_mentions CASCADE;
DROP TABLE IF EXISTS prompt_executions CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS aggregated_metrics CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

Then run the full rebuild script again.

### Issue: "permission denied" error
**Solution:** Make sure you're logged in as the project owner in Supabase Dashboard.

### Issue: Data still not showing
**Solution:**
1. Check if edge functions are deployed (see DEPLOY_INSTRUCTIONS.md)
2. Trigger a new analysis (old data was lost during the manual changes)
3. Check Supabase Edge Function logs for errors

---

## Next Steps

After fixing the database:

1. **Deploy edge functions** if you haven't already (see DEPLOY_INSTRUCTIONS.md)
2. **Run a test analysis** to verify everything works
3. **Check the Analytics page** to see your data populate

---

## Need Help?

If you encounter any issues:

1. Check the Supabase SQL Editor for error messages
2. Look at the Edge Function logs in Supabase Dashboard
3. Verify all tables exist using the query in Step 3
4. Make sure your user profile exists using the query in Step 4
