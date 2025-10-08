import { supabase } from './supabase';

export async function checkQueryLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_plan, queries_used_this_month, monthly_query_limit, last_query_reset_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return { allowed: false, remaining: 0, limit: 5 };
  }

  const now = new Date();
  const lastReset = new Date(data.last_query_reset_at);
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 30) {
    await supabase
      .from('profiles')
      .update({
        queries_used_this_month: 0,
        last_query_reset_at: now.toISOString(),
      })
      .eq('id', userId);

    return { allowed: true, remaining: data.monthly_query_limit, limit: data.monthly_query_limit };
  }

  const remaining = data.monthly_query_limit - data.queries_used_this_month;
  const allowed = remaining > 0;

  return { allowed, remaining, limit: data.monthly_query_limit };
}

export async function incrementQueryUsage(userId: string): Promise<boolean> {
  const check = await checkQueryLimit(userId);

  if (!check.allowed) {
    return false;
  }

  const { error } = await supabase.rpc('increment_query_usage', { user_id: userId });

  if (error) {
    const { data } = await supabase
      .from('profiles')
      .select('queries_used_this_month')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('profiles')
        .update({ queries_used_this_month: data.queries_used_this_month + 1 })
        .eq('id', userId);
    }
  }

  return true;
}

export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .maybeSingle();

  return data?.subscription_plan || 'free';
}
