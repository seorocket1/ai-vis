# Deploy Instructions for n8n-callback Edge Function

## ⚠️ CRITICAL: The Problem
The edge function code has been fixed locally but **NOT DEPLOYED** to Supabase yet.

**Your production edge function is still running the OLD BUGGY code** that can't parse:
- Percentages like "100%" (it expects numbers)
- String counts like "7" (it expects numbers)

This is why NO data is being saved to:
- ❌ sentiment_analysis (0 rows)
- ❌ recommendations (0 rows)
- ❌ aggregated_metrics (0 rows)

## How to Deploy

### Option 1: Using Supabase Dashboard (⭐ EASIEST)

1. **Open your Supabase Dashboard** → https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. Find and click **n8n-callback**
5. In the editor, **DELETE ALL existing code**
6. **Copy the ENTIRE contents** from: `supabase/functions/n8n-callback/index.ts`
   - The file is in your project at this path
   - All 341 lines
7. **Paste** into the Supabase editor
8. Click **Deploy** button
9. Wait for "Deployed successfully" message

### Option 2: Using Supabase CLI

If you have Supabase CLI set up locally:

```bash
# Make sure you're logged in
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy n8n-callback --no-verify-jwt
```

## What Was Fixed

The updated edge function now handles:

1. **Percentage parsing** - n8n sends "100%" as a string, but the code expected a number
2. **Mention count parsing** - n8n sends "7" as a string, but the code expected a number
3. **Better error logging** - More detailed console logs to debug issues

## After Deploying

1. Trigger a new prompt analysis from your app
2. Check the Supabase Edge Function logs to see the detailed output
3. Verify that data appears in:
   - `sentiment_analysis` table
   - `brand_mentions` table
   - `recommendations` table
   - `aggregated_metrics` table

## Testing the Webhook

You can test if n8n is calling the webhook correctly by checking the edge function logs in Supabase Dashboard > Edge Functions > n8n-callback > Logs
