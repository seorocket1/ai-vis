import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import {
  Users, Activity, Target, TrendingUp, Shield, Ban,
  Crown, RefreshCw, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  brand_name: string | null;
  website_url: string | null;
  subscription_plan: 'free' | 'pro';
  plan_started_at: string;
  monthly_query_limit: number;
  queries_used_this_month: number;
  last_query_reset_at: string;
  onboarding_completed: boolean;
  is_admin: boolean;
  created_at: string;
  executionCount: number;
  promptCount: number;
  lastActivity: string | null;
}

export default function Admin() {
  const { user, isAdmin: isAdminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userPrompts, setUserPrompts] = useState<Record<string, any[]>>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    totalExecutions: 0,
    totalPrompts: 0,
    avgExecutionsPerUser: 0,
    totalQueriesUsed: 0,
  });

  useEffect(() => {
    loadData();
  }, [user, isAdminUser]);

  const loadData = async () => {
    if (!user || !isAdminUser) {
      setLoading(false);
      return;
    }

    try {
      const [usersResult, executionsResult, promptsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('prompt_executions').select('id, user_id, created_at'),
        supabase.from('prompts').select('id, user_id'),
      ]);

      const allUsers = usersResult.data || [];
      const allExecutions = executionsResult.data || [];
      const allPrompts = promptsResult.data || [];

      const usersWithStats: UserData[] = allUsers.map(u => {
        const userExecutions = allExecutions.filter(e => e.user_id === u.id);
        const userPromptsList = allPrompts.filter(p => p.user_id === u.id);
        const lastExecution = userExecutions.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          id: u.id,
          email: u.email,
          brand_name: u.brand_name,
          website_url: u.website_url,
          subscription_plan: u.subscription_plan || 'free',
          plan_started_at: u.plan_started_at,
          monthly_query_limit: u.monthly_query_limit || 5,
          queries_used_this_month: u.queries_used_this_month || 0,
          last_query_reset_at: u.last_query_reset_at,
          onboarding_completed: u.onboarding_completed,
          is_admin: u.is_admin,
          created_at: u.created_at,
          executionCount: userExecutions.length,
          promptCount: userPromptsList.length,
          lastActivity: lastExecution?.created_at || null,
        };
      });

      setUsers(usersWithStats);

      const freeUsers = usersWithStats.filter(u => u.subscription_plan === 'free').length;
      const proUsers = usersWithStats.filter(u => u.subscription_plan === 'pro').length;
      const totalQueriesUsed = usersWithStats.reduce((sum, u) => sum + u.queries_used_this_month, 0);

      setStats({
        totalUsers: usersWithStats.length,
        freeUsers,
        proUsers,
        totalExecutions: allExecutions.length,
        totalPrompts: allPrompts.length,
        avgExecutionsPerUser: usersWithStats.length > 0
          ? Math.round(allExecutions.length / usersWithStats.length)
          : 0,
        totalQueriesUsed,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }

    setLoading(false);
  };

  const changePlan = async (userId: string, newPlan: 'free' | 'pro') => {
    if (!isAdminUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: newPlan,
        plan_started_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (!error) {
      await loadData();
    } else {
      console.error('Error changing plan:', error);
      alert('Error changing plan. Please check console.');
    }
  };

  const resetQueries = async (userId: string) => {
    if (!isAdminUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        queries_used_this_month: 0,
        last_query_reset_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (!error) {
      await loadData();
    }
  };

  const toggleUserPrompts = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }

    setExpandedUser(userId);

    if (!userPrompts[userId]) {
      const { data } = await supabase
        .from('prompts')
        .select('*, prompt_executions(id, status, created_at)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        setUserPrompts(prev => ({ ...prev, [userId]: data }));
      }
    }
  };

  const getDaysRemaining = (planStartedAt: string) => {
    const startDate = new Date(planStartedAt);
    const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="admin">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdminUser) {
    return (
      <DashboardLayout currentPage="admin">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You do not have permission to access the admin panel. Only nigamaakash101@gmail.com has admin access.
          </p>
          <a
            href="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Back to Dashboard
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="admin">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600">Manage users, subscriptions, and system-wide settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.totalUsers}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600">Total Users</h3>
            <p className="text-xs text-slate-500 mt-1">
              {stats.freeUsers} free, {stats.proUsers} pro
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.totalExecutions}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600">Total Executions</h3>
            <p className="text-xs text-slate-500 mt-1">
              Avg {stats.avgExecutionsPerUser} per user
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.totalPrompts}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600">Active Prompts</h3>
            <p className="text-xs text-slate-500 mt-1">
              Across all users
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.totalQueriesUsed}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600">Queries Used</h3>
            <p className="text-xs text-slate-500 mt-1">
              This month
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">User Management</h2>
            <p className="text-sm text-slate-600 mt-1">Manage user accounts and subscriptions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((userData) => (
                  <>
                    <tr key={userData.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {userData.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {userData.email}
                              {userData.is_admin && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </p>
                            {userData.brand_name && (
                              <p className="text-xs text-slate-500">{userData.brand_name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {userData.subscription_plan === 'pro' ? (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Users className="w-4 h-4 text-slate-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            userData.subscription_plan === 'pro' ? 'text-yellow-600' : 'text-slate-600'
                          }`}>
                            {userData.subscription_plan.toUpperCase()}
                          </span>
                        </div>
                        {userData.subscription_plan === 'pro' && (
                          <p className="text-xs text-slate-500 mt-1">
                            {getDaysRemaining(userData.plan_started_at)} days left
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${
                                  userData.queries_used_this_month >= userData.monthly_query_limit
                                    ? 'bg-red-500'
                                    : userData.queries_used_this_month / userData.monthly_query_limit > 0.8
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, (userData.queries_used_this_month / userData.monthly_query_limit) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">
                            {userData.queries_used_this_month} / {userData.monthly_query_limit} queries
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-900">{userData.executionCount} executions</p>
                          <p className="text-slate-900">{userData.promptCount} prompts</p>
                          {userData.lastActivity && (
                            <p className="text-xs text-slate-500 mt-1">
                              Last: {new Date(userData.lastActivity).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {userData.subscription_plan === 'free' ? (
                            <button
                              onClick={() => changePlan(userData.id, 'pro')}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                            >
                              <Crown className="w-3 h-3" />
                              Upgrade to Pro
                            </button>
                          ) : (
                            <button
                              onClick={() => changePlan(userData.id, 'free')}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              <Users className="w-3 h-3" />
                              Downgrade to Free
                            </button>
                          )}
                          <button
                            onClick={() => resetQueries(userData.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Reset Queries
                          </button>
                          <button
                            onClick={() => toggleUserPrompts(userData.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            {expandedUser === userData.id ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                View
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedUser === userData.id && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-slate-50">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900">User Prompts</h3>
                            {userPrompts[userData.id]?.length > 0 ? (
                              <div className="space-y-2">
                                {userPrompts[userData.id].map((prompt: any) => (
                                  <div key={prompt.id} className="bg-white p-4 rounded-lg border border-slate-200">
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="text-sm font-medium text-slate-900">{prompt.text}</p>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        prompt.is_active
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {prompt.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                      <span>Frequency: {prompt.frequency}</span>
                                      <span>Executions: {prompt.prompt_executions?.length || 0}</span>
                                      <span>Created: {new Date(prompt.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No prompts created yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No users found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
