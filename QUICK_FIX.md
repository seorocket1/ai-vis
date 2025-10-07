# Quick Database Fix

## TL;DR - What You Need To Do

1. Open https://supabase.com/dashboard
2. Go to your project → SQL Editor → New query
3. Copy ALL contents from `REBUILD_DATABASE.sql`
4. Paste and Run
5. Refresh your app

---

## Why This Fixes Everything

Your manual database changes broke:
- ❌ Analytics page (no metrics data)
- ❌ Competitor Analysis page (no comparison data)
- ❌ Prompt triggers (can't save results)

The rebuild script:
- ✅ Recreates all 8 tables with correct schema
- ✅ Sets up Row Level Security properly
- ✅ Configures edge function access
- ✅ Restores your user account
- ✅ Enables automatic profile creation

---

## After Running the Script

**Your app will work correctly:**
- Analytics will show metrics
- Competitor Analysis will display rankings
- Prompt triggers will save results to database
- All pages will load data properly

**You'll need to:**
- Trigger new analyses (old data was lost)
- Re-add competitors if needed
- The system will start collecting data from scratch

---

## Files Created

1. **REBUILD_DATABASE.sql** - The fix script (run this in Supabase)
2. **DATABASE_FIX_GUIDE.md** - Detailed step-by-step guide
3. **This file** - Quick reference

Run the SQL script and you're done!
