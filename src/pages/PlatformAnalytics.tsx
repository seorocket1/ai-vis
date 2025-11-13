import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, TrendingDown, BarChart3, Target, Award, AlertTriangle, CheckCircle, Sparkles, Globe, Link } from 'lucide-react';

interface PlatformAnalyticsProps {
  platform: 'gemini' | 'chatgpt' | 'perplexity' | 'ai-overview';
  platformName: string;
  platformColor: string;
  platformIcon: React.ReactNode;
}

export default function PlatformAnalytics({ platform, platformName, platformColor, platformIcon }: PlatformAnalyticsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [brandMentions, setBrandMentions] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [sourcesStats, setSourcesStats] = useState<any>(null);

  useEffect(() => {
    loadPlatformData();
    const interval = setInterval(loadPlatformData, 10000);
    return () => clearInterval(interval);
  }, [user, platform]);

  const loadPlatformData = async () => {
    if (!user) return;

    const [profileResult, executionsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('prompt_executions').select('*').eq('user_id', user.id).eq('platform', platform).order('executed_at', { ascending: false }),
    ]);

    setProfile(profileResult.data);
    const execs = executionsResult.data || [];
    setExecutions(execs);

    if (execs.length === 0) {
      setLoading(false);
      return;
    }

    const executionIds = execs.map(e => e.id);

    const [mentionsResult, sentimentResult, recsResult] = await Promise.all([
      supabase.from('brand_mentions').select('*').in('execution_id', executionIds),
      supabase.from('sentiment_analysis').select('*').in('execution_id', executionIds),
      supabase.from('recommendations').select('*').in('execution_id', executionIds),
    ]);

    setBrandMentions(mentionsResult.data || []);
    setSentimentData(sentimentResult.data || []);
    setRecommendations(recsResult.data || []);

    // Calculate sources stats
    const allSources: string[] = [];
    execs.forEach((exec: any) => {
      if (exec.sources) {
        try {
          const sources = Array.isArray(exec.sources) ? exec.sources : JSON.parse(exec.sources);
          allSources.push(...sources);
        } catch (e) {}
      }
    });

    const domainCounts: Record<string, number> = {};
    allSources.forEach((url: string) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch (e) {}
    });

    const topDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    setSourcesStats({
      totalSources: allSources.length,
      uniqueDomains: Object.keys(domainCounts).length,
      topDomains,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="ai-platforms">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const completedExecutions = executions.filter(e => e.status === 'completed');
  const userBrand = profile?.brand_name || '';

  const userBrandMentions = brandMentions.filter(m => m.is_user_brand);
  const competitorMentions = brandMentions.filter(m => !m.is_user_brand);

  const totalUserBrandMentions = userBrandMentions.reduce((sum, m) => sum + m.mention_count, 0);
  const totalCompetitorMentions = competitorMentions.reduce((sum, m) => sum + m.mention_count, 0);
  const totalMentions = totalUserBrandMentions + totalCompetitorMentions;

  const shareOfVoice = totalMentions > 0 ? (totalUserBrandMentions / totalMentions) * 100 : 0;

  const avgPositive = sentimentData.length > 0
    ? sentimentData.reduce((sum, s) => sum + parseFloat(s.positive_percentage || 0), 0) / sentimentData.length
    : 0;
  const avgNeutral = sentimentData.length > 0
    ? sentimentData.reduce((sum, s) => sum + parseFloat(s.neutral_percentage || 0), 0) / sentimentData.length
    : 0;
  const avgNegative = sentimentData.length > 0
    ? sentimentData.reduce((sum, s) => sum + parseFloat(s.negative_percentage || 0), 0) / sentimentData.length
    : 0;

  const competitorGroups: Record<string, number> = {};
  competitorMentions.forEach(m => {
    competitorGroups[m.brand_name] = (competitorGroups[m.brand_name] || 0) + m.mention_count;
  });
  const topCompetitors = Object.entries(competitorGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const brandVisibilityRate = completedExecutions.length > 0
    ? (userBrandMentions.length / completedExecutions.length) * 100
    : 0;

  const allBrands = [
    { name: userBrand, count: totalUserBrandMentions },
    ...topCompetitors.map(([name, count]) => ({ name, count })),
  ].sort((a, b) => b.count - a.count);

  const competitiveRank = allBrands.findIndex(b => b.name === userBrand) + 1;

  return (
    <DashboardLayout currentPage="ai-platforms">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 bg-gradient-to-br from-${platformColor}-500 to-${platformColor}-600 rounded-xl shadow-lg`}>
              {platformIcon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{platformName} Analytics</h1>
              <p className="text-slate-600">Complete performance insights for {platformName}</p>
            </div>
          </div>
        </div>

        {completedExecutions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Data Yet</h2>
            <p className="text-slate-600 mb-6">Start analyzing prompts on {platformName} to see insights here.</p>
            <a
              href="/prompts"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Create Your First Prompt
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Total Analyses</span>
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{completedExecutions.length}</div>
                <p className="text-xs text-slate-500 mt-1">Completed on {platformName}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Brand Mentions</span>
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{totalUserBrandMentions}</div>
                <p className="text-xs text-slate-500 mt-1">Times your brand appeared</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Share of Voice</span>
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{shareOfVoice.toFixed(1)}%</div>
                <p className="text-xs text-slate-500 mt-1">vs competitors</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm font-medium">Visibility Rate</span>
                  {brandVisibilityRate >= 50 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="text-3xl font-bold text-slate-900">{brandVisibilityRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-500 mt-1">Brand mention rate</p>
              </div>
            </div>

            {/* Brand Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Brand Performance Overview</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Your Brand Status</h3>
                  {totalUserBrandMentions === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-900">Not Mentioned</p>
                        <p className="text-sm text-red-700">Low visibility on {platformName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900">{totalUserBrandMentions} Mentions</p>
                        <p className="text-sm text-green-700">Across {completedExecutions.length} analyses</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Competitive Rank</h3>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-bold text-purple-600">#{competitiveRank}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Ranking Position</p>
                        <p className="text-xs text-slate-600">Out of {allBrands.length} brands</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sentiment Analysis */}
            {sentimentData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Sentiment Analysis</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                      <div>
                        <div className="text-3xl font-bold text-green-700">{avgPositive.toFixed(1)}%</div>
                        <div className="text-xs text-green-600 font-medium">Positive</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">Average positive sentiment</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <div>
                        <div className="text-3xl font-bold text-slate-700">{avgNeutral.toFixed(1)}%</div>
                        <div className="text-xs text-slate-600 font-medium">Neutral</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">Average neutral sentiment</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                      <div>
                        <div className="text-3xl font-bold text-red-700">{avgNegative.toFixed(1)}%</div>
                        <div className="text-xs text-red-600 font-medium">Negative</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">Average negative sentiment</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Competitors */}
            {topCompetitors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Top Competing Brands on {platformName}</h2>
                <div className="space-y-3">
                  {topCompetitors.map(([name, count], index) => {
                    const percentage = totalMentions > 0 ? (count / totalMentions) * 100 : 0;
                    return (
                      <div key={name} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900">{name}</span>
                            <span className="text-sm text-slate-600">{count} mentions ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sources Analytics */}
            {sourcesStats && sourcesStats.totalSources > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Sources Cited on {platformName}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Link className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-slate-600">Total Sources</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{sourcesStats.totalSources}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-slate-600">Unique Domains</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{sourcesStats.uniqueDomains}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-amber-600" />
                      <p className="text-sm text-slate-600">Avg per Domain</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {(sourcesStats.totalSources / Math.max(sourcesStats.uniqueDomains, 1)).toFixed(1)}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 10 Most Cited Domains</h3>
                  <p className="text-xs text-slate-600 mb-4">
                    {platformName} frequently cites these domains. Build your presence here to improve visibility.
                  </p>
                  <div className="space-y-2">
                    {sourcesStats.topDomains.map((item: any, index: number) => (
                      <div key={item.domain} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="flex items-center justify-center w-7 h-7 bg-emerald-500 text-white rounded-lg font-bold text-xs flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="font-medium text-slate-900 truncate">{item.domain}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-lg font-bold text-slate-900">{item.count}</span>
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${(item.count / sourcesStats.topDomains[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Executions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Analyses on {platformName}</h2>
              <div className="space-y-3">
                {completedExecutions.slice(0, 10).map((exec) => {
                  const execMentions = brandMentions.filter(m => m.execution_id === exec.id);
                  const userMentionCount = execMentions.filter(m => m.is_user_brand).reduce((sum, m) => sum + m.mention_count, 0);

                  return (
                    <a
                      key={exec.id}
                      href={`/execution/${exec.id}`}
                      className="block p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-slate-900">
                              {new Date(exec.executed_at).toLocaleDateString()} at{' '}
                              {new Date(exec.executed_at).toLocaleTimeString()}
                            </span>
                            {userMentionCount > 0 ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                Brand Mentioned ({userMentionCount})
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                Not Mentioned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {execMentions.length} total brand mentions
                          </p>
                        </div>
                        <div className="text-blue-600 hover:text-blue-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
