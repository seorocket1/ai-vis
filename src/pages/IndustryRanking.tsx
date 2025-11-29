import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

type DateRange = 'week' | '2weeks' | '4weeks' | 'all' | 'custom';
type Platform = 'all' | 'gemini' | 'chatgpt' | 'perplexity' | 'aio';

interface BrandRanking {
  rank: number;
  name: string;
  score: number;
  geminiScore: number;
  chatgptScore: number;
  perplexityScore: number;
  aioScore: number;
  color: string;
}

export default function IndustryRanking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [platform, setPlatform] = useState<Platform>('all');
  const [rankings, setRankings] = useState<BrandRanking[]>([]);
  const [userBrand, setUserBrand] = useState<string>('');
  const [visibilityScore, setVisibilityScore] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [user, dateRange, platform]);

  const getDateFilter = (): Date | null => {
    if (dateRange === 'all') return null;

    const now = new Date();
    const daysMap = { 'week': 7, '2weeks': 14, '4weeks': 28 };
    const days = daysMap[dateRange as keyof typeof daysMap];

    if (!days) return null;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const cutoffDate = getDateFilter();

    const [profileResult, executionsResult] = await Promise.all([
      supabase.from('profiles').select('brand_name').eq('id', user.id).maybeSingle(),
      cutoffDate
        ? supabase.from('prompt_executions')
            .select('id, platform, executed_at')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('executed_at', cutoffDate.toISOString())
        : supabase.from('prompt_executions')
            .select('id, platform, executed_at')
            .eq('user_id', user.id)
            .eq('status', 'completed')
    ]);

    const brand = profileResult.data?.brand_name || '';
    setUserBrand(brand);

    const executionIds = executionsResult.data?.map(e => e.id) || [];
    const totalExecutions = executionIds.length;

    if (totalExecutions === 0) {
      setLoading(false);
      return;
    }

    const mentionsResult = await supabase
      .from('brand_mentions')
      .select('*')
      .in('execution_id', executionIds);

    const mentions = mentionsResult.data || [];

    const brandStats: Record<string, {
      total: number;
      gemini: number;
      chatgpt: number;
      perplexity: number;
      aio: number;
    }> = {};

    const executionPlatforms = new Map(
      executionsResult.data?.map(e => [e.id, e.platform]) || []
    );

    mentions.forEach(m => {
      const platformUsed = executionPlatforms.get(m.execution_id) || 'gemini';

      if (!brandStats[m.brand_name]) {
        brandStats[m.brand_name] = { total: 0, gemini: 0, chatgpt: 0, perplexity: 0, aio: 0 };
      }

      brandStats[m.brand_name].total += m.mention_count;

      if (platformUsed === 'gemini') brandStats[m.brand_name].gemini += m.mention_count;
      if (platformUsed === 'chatgpt') brandStats[m.brand_name].chatgpt += m.mention_count;
      if (platformUsed === 'perplexity') brandStats[m.brand_name].perplexity += m.mention_count;
      if (platformUsed === 'aio') brandStats[m.brand_name].aio += m.mention_count;
    });

    const totalMentions = Object.values(brandStats).reduce((sum, s) => sum + s.total, 0);

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];

    const rankedBrands: BrandRanking[] = Object.entries(brandStats)
      .map(([name, stats], index) => ({
        rank: 0,
        name,
        score: totalMentions > 0 ? (stats.total / totalMentions) * 100 : 0,
        geminiScore: totalMentions > 0 ? (stats.gemini / totalMentions) * 100 : 0,
        chatgptScore: totalMentions > 0 ? (stats.chatgpt / totalMentions) * 100 : 0,
        perplexityScore: totalMentions > 0 ? (stats.perplexity / totalMentions) * 100 : 0,
        aioScore: totalMentions > 0 ? (stats.aio / totalMentions) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.score - a.score)
      .map((brand, index) => ({ ...brand, rank: index + 1 }));

    setRankings(rankedBrands);

    const userBrandData = rankedBrands.find(r => r.name.toLowerCase() === brand.toLowerCase());
    setVisibilityScore(userBrandData?.score || 0);

    setLoading(false);
  };

  const shareOfVoiceData = rankings.slice(0, 10).map(r => ({
    name: r.name,
    value: r.score,
    color: r.color
  }));

  const userBrandInRankings = rankings.find(r => r.name.toLowerCase() === userBrand.toLowerCase());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Industry Analysis</h1>
          <p className="text-gray-600 mt-2">Brand visibility and competitive positioning</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {(['week', '2weeks', '4weeks', 'all'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {range === 'week' && 'Last week'}
                {range === '2weeks' && 'Last 2 weeks'}
                {range === '4weeks' && 'Last 4 weeks'}
                {range === 'all' && 'All time'}
              </button>
            ))}
          </div>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
          >
            <option value="all">All Platforms</option>
            <option value="gemini">Gemini</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="perplexity">Perplexity</option>
            <option value="aio">AI Overview</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Brand Visibility</h2>
          <p className="text-gray-600 mb-4">
            Brand visibility score is the percentage of AI answers about your industry that mention your brand
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : userBrandInRankings ? (
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-bold text-blue-600">{visibilityScore.toFixed(2)}%</div>
                  <div className="text-gray-600 mt-2">Visibility Score</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">#{userBrandInRankings.rank}</div>
                  <div className="text-gray-600 mt-2">Industry Rank</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-orange-800">
                We could not find your brand in the current search data
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Industry Ranking</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : rankings.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No ranking data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">#</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Brand</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.slice(0, 10).map((brand) => (
                      <tr
                        key={brand.rank}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          brand.name.toLowerCase() === userBrand.toLowerCase()
                            ? 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {brand.rank <= 3 && <Trophy className="w-4 h-4 text-yellow-500" />}
                            <span className="font-medium">{brand.rank}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: brand.color }}
                            >
                              {brand.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{brand.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">{brand.score.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Share of Voice Distribution</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : shareOfVoiceData.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shareOfVoiceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {shareOfVoiceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Share of Voice</h2>
          <p className="text-gray-600 mb-6">
            Share of voice is the visibility score compared to other brands in the industry
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : rankings.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Brand</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Overall</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Gemini</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">ChatGPT</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Perplexity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">AI Overview</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((brand) => (
                    <tr
                      key={brand.rank}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        brand.name.toLowerCase() === userBrand.toLowerCase()
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {brand.rank <= 3 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          <span className="font-medium">{brand.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: brand.color }}
                          >
                            {brand.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{brand.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {brand.score.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {brand.geminiScore > 0 ? `${brand.geminiScore.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {brand.chatgptScore > 0 ? `${brand.chatgptScore.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {brand.perplexityScore > 0 ? `${brand.perplexityScore.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {brand.aioScore > 0 ? `${brand.aioScore.toFixed(2)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
