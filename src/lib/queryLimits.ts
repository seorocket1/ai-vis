import { supabase } from './supabase';

export async function checkQueryLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_plan, queries_used_this_month, monthly_query_limit, last_query_reset_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking query limit:', error);
      if (error.message?.includes('column') || error.code === 'PGRST200') {
        console.warn('⚠️ Subscription columns not found. Please run SETUP_DATABASE.sql in Supabase SQL Editor.');
        return { allowed: true, remaining: 999, limit: 999 };
      }
      return { allowed: true, remaining: 5, limit: 5 };
    }

    if (!data) {
      return { allowed: true, remaining: 5, limit: 5 };
    }

    const monthlyQueryLimit = data.monthly_query_limit ?? 5;
    const queriesUsed = data.queries_used_this_month ?? 0;
    const lastReset = data.last_query_reset_at;

    if (lastReset) {
      const now = new Date();
      const lastResetDate = new Date(lastReset);
      const daysSinceReset = (now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceReset >= 30) {
        await supabase
          .from('profiles')
          .update({
            queries_used_this_month: 0,
            last_query_reset_at: now.toISOString(),
          })
          .eq('id', userId);

        return { allowed: true, remaining: monthlyQueryLimit, limit: monthlyQueryLimit };
      }
    }

    const remaining = monthlyQueryLimit - queriesUsed;
    const allowed = remaining > 0;

    return { allowed, remaining, limit: monthlyQueryLimit };
  } catch (error) {
    console.error('Unexpected error in checkQueryLimit:', error);
    return { allowed: true, remaining: 5, limit: 5 };
  }
}

export async function incrementQueryUsage(userId: string): Promise<boolean> {
  try {
    const check = await checkQueryLimit(userId);

    if (!check.allowed) {
      return false;
    }

    const { error } = await supabase.rpc('increment_query_usage', { user_id: userId });

    if (error) {
      console.warn('RPC increment failed, using fallback method:', error);

      const { data } = await supabase
        .from('profiles')
        .select('queries_used_this_month')
        .eq('id', userId)
        .maybeSingle();

      if (data && typeof data.queries_used_this_month === 'number') {
        await supabase
          .from('profiles')
          .update({ queries_used_this_month: data.queries_used_this_month + 1 })
          .eq('id', userId);
      }
    }

    return true;
  } catch (error) {
    console.error('Error incrementing query usage:', error);
    return true;
  }
}

export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .maybeSingle();

  return data?.subscription_plan || 'free';
}

export async function checkPromptLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const plan = await getUserPlan(userId);
    const limit = plan === 'pro' ? 50 : 5;

    const { count } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const current = count || 0;
    const allowed = current < limit;

    return { allowed, current, limit };
  } catch (error) {
    console.error('Error checking prompt limit:', error);
    return { allowed: false, current: 0, limit: 5 };
  }
}
