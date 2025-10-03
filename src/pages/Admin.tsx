import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Users, Activity, Target, TrendingUp, Shield, Ban, CheckCircle, XCircle } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExecutions: 0,
    totalPrompts: 0,
    avgExecutionsPerUser: 0,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const profileResult = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    const adminStatus = profileResult.data?.is_admin || false;
    setIsAdmin(adminStatus);

    if (!adminStatus) {
      setLoading(false);
      return;
    }

    const [usersResult, executionsResult, promptsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, prompt_executions(id, status, created_at)')
        .order('created_at', { ascending: false }),
      supabase.from('prompt_executions').select('id'),
      supabase.from('prompts').select('id'),
    ]);

    const usersWithStats = (usersResult.data || []).map(u => {
      const userExecutions = u.prompt_executions || [];
      return {
        ...u,
        executionCount: userExecutions.length,
        completedExecutions: userExecutions.filter((e: any) => e.status === 'completed').length,
        lastActive: userExecutions.length > 0
          ? new Date(Math.max(...userExecutions.map((e: any) => new Date(e.created_at).getTime())))
          : null,
      };
    });

    setUsers(usersWithStats);

    const totalExec = executionsResult.data?.length || 0;
    const avgExec = usersWithStats.length > 0 ? (totalExec / usersWithStats.length).toFixed(1) : 0;

    setStats({
      totalUsers: usersWithStats.length,
      totalExecutions: totalExec,
      totalPrompts: promptsResult.data?.length || 0,
      avgExecutionsPerUser: Number(avgExec),
    });

    setLoading(false);
  };

  const toggleUserStatus = async (userId: string, currentOnboarding: boolean) => {
    if (!isAdmin) return;

    await supabase
      .from('profiles')
      .update({ onboarding_completed: !currentOnboarding })
      .eq('id', userId);

    loadData();
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout currentPage="settings">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You do not have permission to access the admin panel.
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
    <DashboardLayout currentPage="settings">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600">Manage users and monitor system activity</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Users</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.totalUsers}</p>
            <p className="text-sm opacity-90">Registered accounts</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Analyses</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.totalExecutions}</p>
            <p className="text-sm opacity-90">Across all users</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Prompts</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.totalPrompts}</p>
            <p className="text-sm opacity-90">System-wide</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Avg per User</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.avgExecutionsPerUser}</p>
            <p className="text-sm opacity-90">Analyses/user</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">User Management</h2>
            <p className="text-sm text-slate-600">View and manage all registered users</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">User</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Brand Name</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Role</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Analyses</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Last Active</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{u.email}</p>
                        <p className="text-xs text-slate-500">{u.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-slate-700 font-medium">
                        {u.brand_name || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                          <Users className="w-3 h-3" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {u.onboarding_completed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          <XCircle className="w-3 h-3" />
                          Setup
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-slate-900">{u.executionCount}</span>
                        <span className="text-xs text-slate-500">
                          {u.completedExecutions} completed
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-slate-600">
                        {u.lastActive
                          ? new Date(u.lastActive).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-slate-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No users found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
