import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, Target, Users, Activity, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrompts: 0,
    activePrompts: 0,
    totalExecutions: 0,
    avgBrandMentions: 0,
  });
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const [profileResult, promptsResult, executionsResult, recsResult, metricsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('prompts').select('id, is_active, text').eq('user_id', user.id),
      supabase
        .from('prompt_executions')
        .select('*, prompts(text)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('executed_at', { ascending: false })
        .limit(5),
      supabase
        .from('prompt_executions')
        .select('id, ai_response, executed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('executed_at', { ascending: false })
        .limit(10),
      supabase.from('aggregated_metrics').select('*').eq('user_id', user.id).eq('time_period', 'all').maybeSingle(),
    ]);

    if (profileResult.data) setProfile(profileResult.data);
    setMetrics(metricsResult.data);

    const prompts = promptsResult.data || [];
    const executions = executionsResult.data || [];

    setStats({
      totalPrompts: prompts.length,
      activePrompts: prompts.filter((p) => p.is_active).length,
      totalExecutions: executions.length,
      avgBrandMentions: metricsResult.data?.total_brand_mentions || 0,
    });

    setRecentExecutions(executions);

    const allRecommendations: any[] = [];
    (recsResult.data || []).forEach((exec) => {
      try {
        const response = typeof exec.ai_response === 'string'
          ? JSON.parse(exec.ai_response)
          : exec.ai_response;
        if (response?.recommendations) {
          response.recommendations.forEach((rec: any) => {
            allRecommendations.push({
              ...rec,
              executionId: exec.id,
              date: exec.executed_at,
            });
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    setRecommendations(allRecommendations.slice(0, 6));
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back{profile?.brand_name ? `, ${profile.brand_name}` : ''}
          </h1>
          <p className="text-slate-600">Here's your brand performance overview</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover-lift animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-slate-700 text-sm mb-1 font-medium">Total Prompts</p>
            <p className="text-4xl font-bold text-slate-900">{stats.totalPrompts}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border border-green-200 p-6 hover-lift animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg shadow-md">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-slate-700 text-sm mb-1 font-medium">Active Prompts</p>
            <p className="text-4xl font-bold text-slate-900">{stats.activePrompts}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-sm border border-amber-200 p-6 hover-lift animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500 rounded-lg shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-slate-700 text-sm mb-1 font-medium">Total Analyses</p>
            <p className="text-4xl font-bold text-slate-900">{stats.totalExecutions}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-sm border border-purple-200 p-6 hover-lift animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-slate-700 text-sm mb-1 font-medium">Recommendations</p>
            <p className="text-4xl font-bold text-slate-900">{recommendations.length}</p>
          </div>
        </div>

        {metrics && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Share of Voice</h3>
                <a href="/analytics" className="text-blue-600 hover:text-blue-700 text-xs font-medium">View →</a>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-blue-600">{metrics.share_of_voice?.toFixed(1) || 0}%</p>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {metrics.total_brand_mentions || 0} brand mentions vs {metrics.total_competitor_mentions || 0} competitors
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Sentiment Score</h3>
                <a href="/analytics" className="text-blue-600 hover:text-blue-700 text-xs font-medium">View →</a>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-emerald-600">{metrics.avg_positive_sentiment?.toFixed(0) || 0}%</p>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Positive sentiment across platforms
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Competitive Rank</h3>
                <a href="/competitor-analysis" className="text-blue-600 hover:text-blue-700 text-xs font-medium">View →</a>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-amber-600">#{metrics.competitive_rank || 0}</p>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                vs {metrics.top_competitor || 'competitors'}
              </p>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200 p-6 mb-8 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI-Powered Recommendations</h2>
                <p className="text-sm text-slate-600">Strategic insights from your recent analyses</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-5 bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-all group hover-lift"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 leading-relaxed text-sm">{rec.text}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(rec.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover-lift">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Analyses</h2>
            <a
              href="/prompts"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {recentExecutions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No analyses yet</h3>
              <p className="text-slate-600 mb-6">
                Trigger your first prompt to see results here
              </p>
              <a
                href="/prompts"
                className="inline-block bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                Go to Prompts
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((exec, idx) => (
                <a
                  key={exec.id}
                  href={`/execution/${exec.id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:border-blue-300 transition-all group animate-slide-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {exec.prompts?.text ?
                        (exec.prompts.text.length > 80 ? `${exec.prompts.text.substring(0, 80)}...` : exec.prompts.text)
                        : `Analysis #${exec.id.substring(0, 8)}`
                      }
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                        {exec.model}
                      </span>
                      <span>{new Date(exec.executed_at).toLocaleDateString()}</span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        completed
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
