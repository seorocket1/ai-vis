import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, TrendingDown, Users, Target, BarChart3, Trophy, AlertCircle, Plus, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Competitor {
  id: string;
  name: string;
  website_url: string | null;
  created_at: string;
}

type DateRange = 'today' | '3days' | '7days' | '14days' | '30days' | 'all';
type MetricType = 'mentions' | 'shareOfVoice' | 'appearances' | 'brandCoverage';

export default function CompetitorAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [brandData, setBrandData] = useState<any>(null);
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('mentions');

  useEffect(() => {
    loadData();
  }, [user, dateRange]);

  const getDateFilter = (range: DateRange): Date | null => {
    if (range === 'all') return null;

    const now = new Date();
    const daysMap = {
      'today': 1,
      '3days': 3,
      '7days': 7,
      '14days': 14,
      '30days': 30,
    };

    const days = daysMap[range];
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return cutoffDate;
  };

  const loadData = async () => {
    if (!user) return;

    const cutoffDate = getDateFilter(dateRange);

    const [profileResult, executionsResult, metricsResult, competitorsResult] = await Promise.all([
      supabase.from('profiles').select('brand_name').eq('id', user.id).maybeSingle(),
      cutoffDate
        ? supabase.from('prompt_executions').select('id, executed_at').eq('user_id', user.id).eq('status', 'completed').gte('executed_at', cutoffDate.toISOString())
        : supabase.from('prompt_executions').select('id, executed_at').eq('user_id', user.id).eq('status', 'completed'),
      supabase.from('aggregated_metrics').select('*').eq('user_id', user.id).eq('time_period', 'all').maybeSingle(),
      supabase.from('competitors').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setCompetitors(competitorsResult.data || []);

    const userBrand = profileResult.data?.brand_name || '';
    const totalExecutions = executionsResult.data?.length || 0;

    if (totalExecutions === 0) {
      setLoading(false);
      return;
    }

    const executionIds = executionsResult.data?.map(e => e.id) || [];

    const [mentionsResult, sentimentsResult] = await Promise.all([
      supabase.from('brand_mentions').select('*').in('execution_id', executionIds),
      supabase.from('sentiment_analysis').select('*').in('execution_id', executionIds),
    ]);

    const mentions = mentionsResult.data || [];
    const sentiments = sentimentsResult.data || [];

    setMetrics(metricsResult.data);

    const brandMentionCount = mentions
      .filter(m => m.is_user_brand)
      .reduce((sum, m) => sum + m.mention_count, 0);

    const competitorGroups: Record<string, any> = {};
    mentions.filter(m => !m.is_user_brand).forEach(m => {
      if (!competitorGroups[m.brand_name]) {
        competitorGroups[m.brand_name] = {
          name: m.brand_name,
          mentionCount: 0,
          appearances: 0,
        };
      }
      competitorGroups[m.brand_name].mentionCount += m.mention_count;
      competitorGroups[m.brand_name].appearances += 1;
    });

    const avgBrandSentiment = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + (parseFloat(s.positive_percentage) || 0), 0) / sentiments.length
      : 0;

    setBrandData({
      name: userBrand,
      mentionCount: brandMentionCount,
      appearances: mentions.filter(m => m.is_user_brand).length,
      brandCoverage: totalExecutions > 0 ? parseFloat(((mentions.filter(m => m.is_user_brand).length / totalExecutions) * 100).toFixed(1)) : 0,
      sentiment: avgBrandSentiment,
    });

    const competitors = Object.values(competitorGroups).map(comp => ({
      ...comp,
      brandCoverage: totalExecutions > 0 ? parseFloat(((comp.appearances / totalExecutions) * 100).toFixed(1)) : 0,
      sentiment: avgBrandSentiment,
    })).sort((a, b) => b.mentionCount - a.mentionCount);

    setCompetitorData(competitors);
    setLoading(false);
  };

  const handleAddCompetitor = async () => {
    if (!user || !newName.trim()) return;

    await supabase.from('competitors').insert({
      user_id: user.id,
      name: newName.trim(),
      website_url: newWebsite.trim() || null,
    });

    setShowModal(false);
    setNewName('');
    setNewWebsite('');
    loadData();
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (confirm('Are you sure you want to remove this competitor?')) {
      await supabase.from('competitors').delete().eq('id', id);
      loadData();
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="competitor-analysis">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalMentions = (brandData?.mentionCount || 0) + competitorData.reduce((sum, c) => sum + c.mentionCount, 0);
  const brandShareOfVoice = totalMentions > 0 ? ((brandData?.mentionCount || 0) / totalMentions * 100).toFixed(1) : 0;

  const allBrands = brandData ? [{ ...brandData, isUserBrand: true }, ...competitorData] : competitorData;
  const sortedBrands = allBrands.sort((a, b) => b.mentionCount - a.mentionCount);
  const brandRank = sortedBrands.findIndex(b => b.isUserBrand) + 1;

  const getMetricValue = (brand: any) => {
    const totalMentionsForCalc = (brandData?.mentionCount || 0) + competitorData.reduce((sum, c) => sum + c.mentionCount, 0);
    switch (selectedMetric) {
      case 'mentions':
        return brand.mentionCount;
      case 'shareOfVoice':
        return totalMentionsForCalc > 0 ? parseFloat(((brand.mentionCount / totalMentionsForCalc) * 100).toFixed(1)) : 0;
      case 'appearances':
        return brand.appearances;
      case 'brandCoverage':
        return brand.brandCoverage;
      default:
        return brand.mentionCount;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'mentions':
        return 'Total Mentions';
      case 'shareOfVoice':
        return 'Share of Voice (%)';
      case 'appearances':
        return 'Appearances';
      case 'brandCoverage':
        return 'Brand Coverage (%)';
      default:
        return 'Total Mentions';
    }
  };

  const unifiedChartData = sortedBrands.slice(0, 6).map(brand => ({
    name: brand.name.length > 12 ? brand.name.substring(0, 12) + '...' : brand.name,
    fullName: brand.name,
    value: getMetricValue(brand),
    isUser: brand.isUserBrand || false,
  }));

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: '3days', label: 'Last 3 Days' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '14days', label: 'Last 14 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const metricOptions = [
    { value: 'mentions', label: 'Total Mentions', icon: '📊' },
    { value: 'shareOfVoice', label: 'Share of Voice', icon: '📢' },
    { value: 'appearances', label: 'Appearances', icon: '👁️' },
    { value: 'brandCoverage', label: 'Brand Coverage', icon: '📈' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <DashboardLayout currentPage="competitor-analysis">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Competitive Intelligence</h1>
          <p className="text-slate-600">Comprehensive brand vs. competitor analysis across AI platforms</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Your Rank</span>
            </div>
            <div className="text-4xl font-bold mb-1">#{brandRank}</div>
            <div className="text-sm opacity-90">
              {brandRank === 1 ? 'Leading position' : `Out of ${sortedBrands.length} brands`}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Share of Voice</span>
            </div>
            <div className="text-4xl font-bold mb-1">{brandShareOfVoice}%</div>
            <div className="text-sm opacity-90">Brand mention percentage</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Competitors</span>
            </div>
            <div className="text-4xl font-bold mb-1">{competitorData.length}</div>
            <div className="text-sm opacity-90">Brands tracked</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Mentions</span>
            </div>
            <div className="text-4xl font-bold mb-1">{totalMentions}</div>
            <div className="text-sm opacity-90">Across all brands</div>
          </div>
        </div>

        {brandData && (
          <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 rounded-2xl border-2 border-blue-200 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Brand: {brandData.name}</h2>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Total Mentions</p>
                    <p className="text-3xl font-bold text-slate-900">{brandData.mentionCount}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Brand Coverage</p>
                    <p className="text-3xl font-bold text-slate-900">{brandData.brandCoverage}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Sentiment Score</p>
                    <p className="text-3xl font-bold text-emerald-600">{brandData.sentiment.toFixed(0)}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Competitive Rank</p>
                    <p className="text-3xl font-bold text-blue-600">#{brandRank}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sortedBrands.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Performance Comparison</h3>
                <p className="text-slate-600">Compare brands across different metrics and time periods</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="pl-11 pr-10 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium appearance-none bg-white cursor-pointer hover:border-slate-300 transition-colors min-w-[160px]"
                  >
                    {dateRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                  {metricOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedMetric(option.value as MetricType)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedMetric === option.value
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={unifiedChartData}>
                  <defs>
                    {unifiedChartData.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 12, fontWeight: 500 }}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12, fontWeight: 500 }}
                    tickMargin={10}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-slate-200">
                            <p className="font-bold text-slate-900 mb-2">{data.fullName}</p>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: payload[0].color }}
                              />
                              <p className="text-sm text-slate-600">
                                {getMetricLabel()}: <span className="font-bold text-slate-900 text-base">{data.value}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={getMetricLabel()}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Brand Comparison Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Rank</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Brand</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Mentions</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Coverage</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Appearances</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Share of Voice</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Gap</th>
                </tr>
              </thead>
              <tbody>
                {sortedBrands.map((brand, index) => {
                  const sov = totalMentions > 0 ? ((brand.mentionCount / totalMentions) * 100).toFixed(1) : 0;
                  const gap = index === 0 ? 0 : sortedBrands[0].mentionCount - brand.mentionCount;
                  const isUserBrand = brand.isUserBrand;

                  return (
                    <tr
                      key={brand.name}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        isUserBrand ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2">
                          {index < 3 ? (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 'bg-gradient-to-br from-amber-600 to-amber-800'
                            }`}>
                              {index + 1}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-600 bg-slate-100">
                              {index + 1}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-base ${isUserBrand ? 'text-blue-600' : 'text-slate-900'}`}>
                            {brand.name}
                          </span>
                          {isUserBrand && (
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full font-medium shadow-sm">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center font-bold text-slate-900 text-base">{brand.mentionCount}</td>
                      <td className="py-5 px-4 text-center text-slate-600 font-medium">{brand.brandCoverage}%</td>
                      <td className="py-5 px-4 text-center text-slate-600 font-medium">{brand.appearances}</td>
                      <td className="py-5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-32 bg-slate-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${isUserBrand ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}
                              style={{ width: `${Math.min(parseFloat(sov), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-900 min-w-[3.5rem]">{sov}%</span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        {gap > 0 ? (
                          <div className="flex items-center justify-center gap-1 text-red-600 bg-red-50 rounded-lg px-3 py-2 inline-flex">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-bold">-{gap}</span>
                          </div>
                        ) : gap === 0 && index === 0 ? (
                          <div className="flex items-center justify-center gap-1 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 inline-flex">
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm font-bold">Leader</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedBrands.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-xl">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-slate-700 mb-2">No competitor data available yet</p>
              <p className="text-slate-500 mb-8">
                Run some prompt analyses to start tracking competitor mentions
              </p>
              <a
                href="/prompts"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="w-5 h-5" />
                Run Analysis
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Manage Competitors</h2>
              <p className="text-slate-600">Add or remove competitors to track in your analysis</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Competitor
            </button>
          </div>

          {competitors.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-dashed border-slate-300">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No competitors tracked</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">Add competitors to monitor their brand visibility and compare performance</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Add First Competitor
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{competitor.name}</h3>
                      {competitor.website_url && (
                        <a
                          href={competitor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors font-medium"
                        >
                          Visit website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCompetitor(competitor.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 inline-block">
                    Added {new Date(competitor.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {brandData && metrics && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                Key Insights
              </h3>
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-600 mb-2 uppercase tracking-wide font-semibold">Competitive Position</p>
                  <p className="font-bold text-slate-900 text-lg">
                    {brandRank === 1
                      ? '🏆 You are the market leader!'
                      : `You rank #${brandRank} out of ${sortedBrands.length} brands`}
                  </p>
                </div>

                <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 mb-2 uppercase tracking-wide font-semibold">Share of Voice</p>
                  <p className="font-bold text-slate-900 text-lg">
                    {parseFloat(brandShareOfVoice) > 25
                      ? `Strong presence at ${brandShareOfVoice}%`
                      : `Room to grow - currently ${brandShareOfVoice}%`}
                  </p>
                </div>

                <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-600 mb-2 uppercase tracking-wide font-semibold">Top Competitor</p>
                  <p className="font-bold text-slate-900 text-lg">
                    {metrics.top_competitor || 'No competitor data'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                Recommendations
              </h3>
              <div className="space-y-3">
                {brandRank > 1 && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm mb-1">Improve Ranking</p>
                      <p className="text-xs text-slate-600">
                        You need {sortedBrands[brandRank - 2].mentionCount - brandData.mentionCount} more mentions to move up to #{brandRank - 1}
                      </p>
                    </div>
                  </div>
                )}

                {parseFloat(brandShareOfVoice) < 20 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm mb-1">Increase Share of Voice</p>
                      <p className="text-xs text-slate-600">
                        Focus on creating high-quality content to improve brand visibility in AI responses
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm mb-1">Monitor Competition</p>
                    <p className="text-xs text-slate-600">
                      Track {competitorData.length} competitors regularly to understand market dynamics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Competitor</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Competitor Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., CompanyName"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Website URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://competitor.com"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setNewName('');
                      setNewWebsite('');
                    }}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCompetitor}
                    disabled={!newName.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
