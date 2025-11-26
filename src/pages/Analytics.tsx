import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Users, Globe, Link } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');
  const [metrics, setMetrics] = useState<any>(null);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [mentions, setMentions] = useState<any[]>([]);
  const [sentiments, setSentiments] = useState<any[]>([]);
  const [sourcesAnalytics, setSourcesAnalytics] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    const metricsResult = await supabase.from('aggregated_metrics').select('*').eq('user_id', user.id).eq('time_period', 'all').maybeSingle();
    const executionsResult = await supabase.from('prompt_executions').select('*').eq('user_id', user.id).eq('status', 'completed').order('executed_at', { ascending: false });

    const executions = executionsResult.data || [];
    setMetrics(metricsResult.data);
    setExecutions(executions);

    if (executions.length === 0) {
      setLoading(false);
      return;
    }

    const executionIds = executions.map(e => e.id);

    const [mentionsResult, sentimentsResult] = await Promise.all([
      supabase.from('brand_mentions').select('*').in('execution_id', executionIds),
      supabase.from('sentiment_analysis').select('*').in('execution_id', executionIds),
    ]);

    const mentions = mentionsResult.data || [];
    const sentiments = sentimentsResult.data || [];

    setMentions(mentions);
    setSentiments(sentiments);

    const platformMetrics: Record<string, any> = {};

    executions.forEach((exec: any) => {
      const platform = exec.platform || 'unknown';
      if (!platformMetrics[platform]) {
        platformMetrics[platform] = {
          name: platform,
          mentions: 0,
          executions: 0,
          totalPositive: 0,
          totalNeutral: 0,
          totalNegative: 0,
          sentimentCount: 0,
        };
      }
      platformMetrics[platform].executions += 1;
    });

    mentions.forEach((mention: any) => {
      const execution = executions.find(e => e.id === mention.execution_id);
      const platform = execution?.platform || 'unknown';
      if (platformMetrics[platform] && mention.is_user_brand) {
        platformMetrics[platform].mentions += mention.mention_count;
      }
    });

    sentiments.forEach((sentiment: any) => {
      const execution = executions.find(e => e.id === sentiment.execution_id);
      const platform = execution?.platform || 'unknown';
      if (platformMetrics[platform]) {
        platformMetrics[platform].totalPositive += parseFloat(sentiment.positive_percentage) || 0;
        platformMetrics[platform].totalNeutral += parseFloat(sentiment.neutral_percentage) || 0;
        platformMetrics[platform].totalNegative += parseFloat(sentiment.negative_percentage) || 0;
        platformMetrics[platform].sentimentCount += 1;
      }
    });

    const platformData = Object.values(platformMetrics).map((p: any) => ({
      name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      visibility: p.executions > 0 ? Math.round((p.mentions / p.executions) * 10) : 0,
      sentiment: p.sentimentCount > 0 ? Math.round(p.totalPositive / p.sentimentCount) : 0,
      mentions: p.mentions,
      executions: p.executions,
      avgSentiment: p.sentimentCount > 0 ? (p.totalPositive / p.sentimentCount).toFixed(1) : 0,
    }));

    setPlatforms(platformData);

    const executionsByDate = executions.reduce((acc: any, exec: any) => {
      const date = new Date(exec.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, mentions: 0, executions: 0, sentiment: 0, sentimentCount: 0 };
      }
      acc[date].executions += 1;
      return acc;
    }, {});

    mentions.forEach((mention: any) => {
      const execution = executions.find(e => e.id === mention.execution_id);
      if (execution && mention.is_user_brand) {
        const date = new Date(execution.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (executionsByDate[date]) {
          executionsByDate[date].mentions += mention.mention_count;
        }
      }
    });

    sentiments.forEach((sentiment: any) => {
      const execution = executions.find(e => e.id === sentiment.execution_id);
      if (execution) {
        const date = new Date(execution.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (executionsByDate[date]) {
          executionsByDate[date].sentiment += parseFloat(sentiment.positive_percentage) || 0;
          executionsByDate[date].sentimentCount += 1;
        }
      }
    });

    const trendDataArray = Object.values(executionsByDate).map((d: any) => ({
      date: d.date,
      mentions: d.mentions,
      executions: d.executions,
      sentiment: d.sentimentCount > 0 ? Math.round(d.sentiment / d.sentimentCount) : 0,
    })).reverse().slice(-14);

    setTrendData(trendDataArray);

    const allSources: string[] = [];
    executions.forEach((exec: any) => {
      if (exec.sources) {
        try {
          const sources = Array.isArray(exec.sources) ? exec.sources : JSON.parse(exec.sources);
          allSources.push(...sources);
        } catch (e) {
          console.error('Error parsing sources:', e);
        }
      }
    });

    const domainCounts: Record<string, { count: number; urls: Set<string> }> = {};
    allSources.forEach((url: string) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        if (!domainCounts[domain]) {
          domainCounts[domain] = { count: 0, urls: new Set() };
        }
        domainCounts[domain].count += 1;
        domainCounts[domain].urls.add(url);
      } catch (e) {
        // Invalid URL
      }
    });

    const sortedDomains = Object.entries(domainCounts)
      .map(([domain, data]) => ({
        domain,
        count: data.count,
        uniqueUrls: data.urls.size,
      }))
      .sort((a, b) => b.count - a.count);

    setSourcesAnalytics({
      totalSources: allSources.length,
      uniqueDomains: sortedDomains.length,
      topDomains: sortedDomains.slice(0, 20),
      domainDistribution: sortedDomains,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="analytics">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'trends', label: 'Trends', icon: Target },
    { id: 'platforms', label: 'Platforms', icon: BarChart3 },
    { id: 'sentiment', label: 'Sentiment', icon: TrendingUp },
    { id: 'sources', label: 'Sources', icon: Globe },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const sentimentData = [
    { name: 'Positive', value: metrics?.avg_positive_sentiment || 0, color: '#10b981' },
    { name: 'Neutral', value: metrics?.avg_neutral_sentiment || 0, color: '#94a3b8' },
    { name: 'Negative', value: metrics?.avg_negative_sentiment || 0, color: '#ef4444' },
  ];

  return (
    <DashboardLayout currentPage="analytics">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Advanced Analytics</h1>
            <p className="text-slate-600">Comprehensive insights into your brand visibility across AI platforms</p>
          </div>
        </div>

        {!metrics && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <p className="text-blue-900 font-medium">No analytics data available yet.</p>
            <p className="text-blue-700 text-sm mt-2">
              Trigger some prompt analyses to start seeing comprehensive analytics and insights about your brand visibility.
            </p>
          </div>
        )}

        {metrics && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Brand Visibility</span>
                </div>
                <div className="text-3xl font-bold mb-1">{metrics.avg_brand_visibility?.toFixed(1) || 0}</div>
                <div className="text-sm opacity-90">Avg mentions per analysis</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Share of Voice</span>
                </div>
                <div className="text-3xl font-bold mb-1">{metrics.share_of_voice?.toFixed(1) || 0}%</div>
                <div className="text-sm opacity-90">Brand mention percentage</div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Sentiment Score</span>
                </div>
                <div className="text-3xl font-bold mb-1">{metrics.avg_sentiment_score?.toFixed(1) || 0}</div>
                <div className="text-sm opacity-90">Positive minus negative</div>
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Performance Metrics</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Response Quality</h3>
                        <span className="text-2xl font-bold text-blue-600">{metrics.response_quality?.toFixed(1) || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(metrics.response_quality || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Platform Coverage</h3>
                        <span className="text-2xl font-bold text-emerald-600">{metrics.platform_coverage || 0}/5</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Active on {metrics.platform_coverage || 0} AI platforms
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Total Analyses</h3>
                        <span className="text-2xl font-bold text-slate-900">{metrics.total_executions || 0}</span>
                      </div>
                      <div className="text-sm text-slate-600">Completed prompt executions</div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Competitive Rank</h3>
                        <span className="text-2xl font-bold text-amber-600">#{metrics.competitive_rank || 0}</span>
                      </div>
                      <div className="text-sm text-slate-600">Position among competitors</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Trends Over Time</h2>

                  {trendData.length > 0 ? (
                    <>
                      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Brand Mentions Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip />
                            <Area type="monotone" dataKey="mentions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMentions)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-xl p-6 border border-emerald-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Sentiment Score Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sentiment" stroke="#10b981" strokeWidth={2} name="Sentiment %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Analysis Activity</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="executions" fill="#8b5cf6" name="Analyses Run" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <p>Not enough data to show trends yet.</p>
                      <p className="text-sm mt-2">Run more analyses over time to see trend data.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'platforms' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Platform Performance</h2>

                  {platforms.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <p>No platform data available yet.</p>
                      <p className="text-sm mt-2">Run analyses on different platforms to see performance breakdown.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Brand Mentions by Platform</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={platforms}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" stroke="#64748b" />
                              <YAxis stroke="#64748b" />
                              <Tooltip />
                              <Bar dataKey="mentions" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Sentiment by Platform</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={platforms}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" stroke="#64748b" />
                              <YAxis stroke="#64748b" domain={[0, 100]} />
                              <Tooltip />
                              <Bar dataKey="sentiment" fill="#10b981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {platforms.map((platform, index) => (
                          <div key={index} className="p-5 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="font-bold text-blue-600">{platform.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-900">{platform.name}</h3>
                                  <p className="text-sm text-slate-600">{platform.mentions} mentions in {platform.executions} analyses</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{platform.visibility}%</div>
                                <div className="text-sm text-slate-600">Visibility</div>
                              </div>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <div>
                                <span className="text-slate-600">Sentiment: </span>
                                <span className="font-semibold text-slate-900">{platform.avgSentiment}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'sentiment' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Sentiment Analysis</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Sentiment Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-3xl font-bold text-green-700">
                            {metrics.avg_positive_sentiment?.toFixed(0) || 0}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Positive</h3>
                        <p className="text-sm text-slate-600">Average positive sentiment</p>
                      </div>

                      <div className="text-center p-6 bg-slate-50 rounded-lg border-2 border-slate-200">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-3xl font-bold text-slate-700">
                            {metrics.avg_neutral_sentiment?.toFixed(0) || 0}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Neutral</h3>
                        <p className="text-sm text-slate-600">Average neutral sentiment</p>
                      </div>

                      <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-3xl font-bold text-red-700">
                            {metrics.avg_negative_sentiment?.toFixed(0) || 0}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Negative</h3>
                        <p className="text-sm text-slate-600">Average negative sentiment</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sources' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Sources Analytics</h2>

                  {!sourcesAnalytics || sourcesAnalytics.totalSources === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No sources data available yet.</p>
                      <p className="text-sm mt-2">Run analyses to see which domains AI platforms cite when mentioning your brand.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Link className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Total Sources</h3>
                          </div>
                          <div className="text-3xl font-bold text-blue-600">{sourcesAnalytics.totalSources}</div>
                          <p className="text-sm text-slate-600 mt-1">Across all analyses</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                              <Globe className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Unique Domains</h3>
                          </div>
                          <div className="text-3xl font-bold text-emerald-600">{sourcesAnalytics.uniqueDomains}</div>
                          <p className="text-sm text-slate-600 mt-1">Different sources cited</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500 rounded-lg">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Avg per Domain</h3>
                          </div>
                          <div className="text-3xl font-bold text-amber-600">
                            {(sourcesAnalytics.totalSources / Math.max(sourcesAnalytics.uniqueDomains, 1)).toFixed(1)}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">Citations per domain</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top 20 Most Cited Domains</h3>
                        <p className="text-sm text-slate-600 mb-6">
                          These domains are most frequently cited by AI platforms when discussing topics related to your brand.
                          Focus on building relationships and content on these high-authority domains.
                        </p>
                        <div className="space-y-3">
                          {sourcesAnalytics.topDomains.map((item: any, index: number) => (
                            <div key={item.domain} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-lg font-bold text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <span className="font-medium text-slate-900 truncate">{item.domain}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {item.uniqueUrls} unique URL{item.uniqueUrls !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-slate-900">{item.count}</div>
                                  <div className="text-xs text-slate-500">citations</div>
                                </div>
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(item.count / sourcesAnalytics.topDomains[0].count) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          Strategic Insights
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-slate-900">High Authority Domains: </span>
                              <span className="text-slate-700">
                                The top {Math.min(5, sourcesAnalytics.topDomains.length)} domains account for{' '}
                                {((sourcesAnalytics.topDomains.slice(0, 5).reduce((sum: number, d: any) => sum + d.count, 0) / sourcesAnalytics.totalSources) * 100).toFixed(1)}%
                                of all citations. Focus your content strategy on these platforms.
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-slate-900">Diversification: </span>
                              <span className="text-slate-700">
                                {sourcesAnalytics.uniqueDomains > 20
                                  ? 'Your brand has strong domain diversity, which reduces dependency on single sources.'
                                  : 'Consider expanding content across more authoritative domains to improve AI citation diversity.'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-slate-900">Opportunity: </span>
                              <span className="text-slate-700">
                                Build backlinks and create quality content on the top-cited domains to increase your brand's AI visibility.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
