import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, TrendingDown, Users, Target, BarChart3, Trophy, AlertCircle, Plus, Trash2, ExternalLink } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Competitor {
  id: string;
  name: string;
  website_url: string | null;
  created_at: string;
}

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

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [profileResult, executionsResult, metricsResult, competitorsResult] = await Promise.all([
      supabase.from('profiles').select('brand_name').eq('id', user.id).maybeSingle(),
      supabase.from('prompt_executions').select('id').eq('user_id', user.id).eq('status', 'completed'),
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
      avgMentionsPerAnalysis: totalExecutions > 0 ? (brandMentionCount / totalExecutions).toFixed(1) : 0,
      sentiment: avgBrandSentiment,
    });

    const competitors = Object.values(competitorGroups).map(comp => ({
      ...comp,
      avgMentionsPerAnalysis: totalExecutions > 0 ? (comp.mentionCount / totalExecutions).toFixed(1) : 0,
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

  const comparisonChartData = sortedBrands.slice(0, 6).map(brand => ({
    name: brand.name.length > 15 ? brand.name.substring(0, 15) + '...' : brand.name,
    mentions: brand.mentionCount,
    appearances: brand.appearances,
    isUser: brand.isUserBrand || false,
  }));

  const shareOfVoiceData = sortedBrands.slice(0, 6).map(brand => ({
    name: brand.name.length > 15 ? brand.name.substring(0, 15) + '...' : brand.name,
    shareOfVoice: totalMentions > 0 ? parseFloat(((brand.mentionCount / totalMentions) * 100).toFixed(1)) : 0,
  }));

  return (
    <DashboardLayout currentPage="competitor-analysis">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Competitive Intelligence</h1>
            <p className="text-slate-600">Comprehensive brand vs. competitor analysis across AI platforms</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Your Rank</span>
            </div>
            <div className="text-4xl font-bold mb-1">#{brandRank}</div>
            <div className="text-sm opacity-90">
              {brandRank === 1 ? 'Leading position' : `Out of ${sortedBrands.length} brands`}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Share of Voice</span>
            </div>
            <div className="text-4xl font-bold mb-1">{brandShareOfVoice}%</div>
            <div className="text-sm opacity-90">Brand mention percentage</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Competitors</span>
            </div>
            <div className="text-4xl font-bold mb-1">{competitorData.length}</div>
            <div className="text-sm opacity-90">Brands tracked</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Mentions</span>
            </div>
            <div className="text-4xl font-bold mb-1">{totalMentions}</div>
            <div className="text-sm opacity-90">Across all brands</div>
          </div>
        </div>

        {brandData && (
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border-2 border-blue-200 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Your Brand: {brandData.name}</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Mentions</p>
                    <p className="text-2xl font-bold text-slate-900">{brandData.mentionCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Avg per Analysis</p>
                    <p className="text-2xl font-bold text-slate-900">{brandData.avgMentionsPerAnalysis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Sentiment Score</p>
                    <p className="text-2xl font-bold text-emerald-600">{brandData.sentiment.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Competitive Rank</p>
                    <p className="text-2xl font-bold text-blue-600">#{brandRank}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sortedBrands.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Brand Mentions Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="mentions" fill="#3b82f6" name="Total Mentions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Share of Voice Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shareOfVoiceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#64748b" width={100} />
                  <Tooltip />
                  <Bar dataKey="shareOfVoice" fill="#10b981" name="Share %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Brand Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Rank</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Brand</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Total Mentions</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Avg/Analysis</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Appearances</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Share of Voice</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Gap</th>
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
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {index < 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'
                            }`}>
                              {index + 1}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-600 bg-slate-100">
                              {index + 1}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isUserBrand ? 'text-blue-600' : 'text-slate-900'}`}>
                            {brand.name}
                          </span>
                          {isUserBrand && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-slate-900">{brand.mentionCount}</td>
                      <td className="py-4 px-4 text-center text-slate-600">{brand.avgMentionsPerAnalysis}</td>
                      <td className="py-4 px-4 text-center text-slate-600">{brand.appearances}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isUserBrand ? 'bg-blue-600' : 'bg-emerald-500'}`}
                              style={{ width: `${sov}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{sov}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {gap > 0 ? (
                          <div className="flex items-center justify-center gap-1 text-red-600">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-medium">-{gap}</span>
                          </div>
                        ) : gap === 0 && index === 0 ? (
                          <div className="flex items-center justify-center gap-1 text-emerald-600">
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm font-medium">Leader</span>
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
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No competitor data available yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Run some prompt analyses to start tracking competitor mentions
              </p>
              <a
                href="/prompts"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run Analysis
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manage Competitors</h2>
              <p className="text-sm text-slate-600 mt-1">Add or remove competitors to track in your analysis</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Competitor
            </button>
          </div>

          {competitors.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No competitors tracked</h3>
              <p className="text-slate-600 mb-6">Add competitors to monitor their brand visibility</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Competitor
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{competitor.name}</h3>
                      {competitor.website_url && (
                        <a
                          href={competitor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors"
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
                  <p className="text-xs text-slate-500">
                    Added {new Date(competitor.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {brandData && metrics && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Key Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600 mb-1">Competitive Position</p>
                  <p className="font-semibold text-slate-900">
                    {brandRank === 1
                      ? '🏆 You are the market leader!'
                      : `You rank #${brandRank} out of ${sortedBrands.length} brands`}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-slate-600 mb-1">Share of Voice</p>
                  <p className="font-semibold text-slate-900">
                    {parseFloat(brandShareOfVoice) > 25
                      ? `Strong presence at ${brandShareOfVoice}%`
                      : `Room to grow - currently ${brandShareOfVoice}%`}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-slate-600 mb-1">Top Competitor</p>
                  <p className="font-semibold text-slate-900">
                    {metrics.top_competitor || 'No competitor data'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {brandRank > 1 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Improve Ranking</p>
                      <p className="text-xs text-slate-600 mt-1">
                        You need {sortedBrands[brandRank - 2].mentionCount - brandData.mentionCount} more mentions to move up to #{brandRank - 1}
                      </p>
                    </div>
                  </div>
                )}

                {parseFloat(brandShareOfVoice) < 20 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <Target className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Increase Share of Voice</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Focus on creating high-quality content to improve brand visibility in AI responses
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Monitor Competition</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Track {competitorData.length} competitors regularly to understand market dynamics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Competitor</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Competitor Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., CompanyName"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Website URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://competitor.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setNewName('');
                      setNewWebsite('');
                    }}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCompetitor}
                    disabled={!newName.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
