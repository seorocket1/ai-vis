# Trigger Analysis Fix

## The Problem

When clicking "Trigger Analysis", you got this error:
```
invalid input syntax for type uuid: "undefined"
```

## Root Cause

1. **Non-existent column**: The code was trying to insert a `platform` field into `prompt_executions` table, but that column doesn't exist in the database schema.

2. **Missing executionId**: The executionId could be undefined if the insertion failed, causing the "undefined" UUID error.

3. **Poor error handling**: Insert errors weren't being caught, so failures were silent.

## What Was Fixed

### In `src/pages/TriggerPrompt.tsx`:

1. **Removed invalid field** (line 84):
   - ❌ Before: `platform: platformId,` (doesn't exist in DB)
   - ✅ After: Removed

2. **Fixed status value** (line 84):
   - ❌ Before: `status: 'processing'`
   - ✅ After: `status: 'pending'` (matches DB enum)

3. **Added error handling** (lines 89-92):
   - Now catches insert errors and throws meaningful error messages
   - Prevents undefined executionId from being used

4. **Better validation** (lines 111-114):
   - Validates both platform and executionId exist before making API call
   - Logs missing values for debugging

5. **Removed unused parameter** (line 128):
   - Removed `Platform: platformId` from request body (not needed)

## How to Test

1. **First**, make sure you've run the database rebuild script:
   - See `DATABASE_FIX_GUIDE.md` for instructions
   - Run `REBUILD_DATABASE.sql` in Supabase SQL Editor

2. **Then**, test the trigger:
   - Go to Prompts page
   - Click "Trigger" on any prompt
   - Select at least one AI platform (e.g., Google Gemini)
   - Click "Trigger Analysis"
   - You should be redirected to the execution detail page

## What Happens Now

When you trigger an analysis:

1. ✅ Creates a `prompt_executions` record with only valid fields
2. ✅ Gets the execution ID back successfully
3. ✅ Calls the edge function with valid executionId
4. ✅ Edge function processes the request and saves results
5. ✅ Redirects you to view the results

## Error Messages You Might Still See

### "Brand name not found"
**Solution**: Go to Settings and complete your profile (add brand name)

### "Please select at least one AI platform"
**Solution**: Click on at least one platform checkbox before triggering

### "Failed to create execution"
**Solution**:
1. Make sure database is rebuilt (see DATABASE_FIX_GUIDE.md)
2. Check you're logged in
3. Check browser console for specific error

### Edge function errors (500)
**Solution**:
1. Check if n8n webhook is working
2. Verify edge function is deployed (see DEPLOY_INSTRUCTIONS.md)
3. Check Supabase Edge Function logs for details

## Next Steps

After this fix, the trigger should work. However, you may need to:

1. **Rebuild the database** if you haven't already (see DATABASE_FIX_GUIDE.md)
2. **Deploy edge functions** if needed (see DEPLOY_INSTRUCTIONS.md)
3. **Complete your profile** in Settings (brand name is required)
4. **Add competitors** so the analysis has brands to compare

Everything should work correctly now!
