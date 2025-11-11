import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { ExternalLink, TrendingUp, BarChart3, Globe } from 'lucide-react';

interface SourceData {
  domain: string;
  count: number;
  urls: string[];
  platforms: string[];
}

export default function Sources() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [uniqueDomains, setUniqueDomains] = useState(0);

  useEffect(() => {
    if (user) {
      loadSources();
    }
  }, [user]);

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const loadSources = async () => {
    try {
      const { data: executions, error } = await supabase
        .from('prompt_executions')
        .select('sources, platform')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .not('sources', 'is', null);

      if (error) throw error;

      const domainMap = new Map<string, SourceData>();
      let totalSourcesCount = 0;

      executions?.forEach((exec) => {
        if (Array.isArray(exec.sources)) {
          exec.sources.forEach((url: string) => {
            totalSourcesCount++;
            const domain = extractDomain(url);

            if (domainMap.has(domain)) {
              const existing = domainMap.get(domain)!;
              existing.count++;
              if (!existing.urls.includes(url)) {
                existing.urls.push(url);
              }
              if (!existing.platforms.includes(exec.platform)) {
                existing.platforms.push(exec.platform);
              }
            } else {
              domainMap.set(domain, {
                domain,
                count: 1,
                urls: [url],
                platforms: [exec.platform],
              });
            }
          });
        }
      });

      const sortedSources = Array.from(domainMap.values()).sort((a, b) => b.count - a.count);

      setSources(sortedSources);
      setTotalSources(totalSourcesCount);
      setUniqueDomains(sortedSources.length);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="sources">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="sources">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Source Analytics</h1>
          <p className="text-slate-600">
            Discover which sources AI platforms trust when answering queries about your industry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Sources</span>
            </div>
            <p className="text-4xl font-bold mb-1">{totalSources}</p>
            <p className="text-sm opacity-90">URLs referenced</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Unique Domains</span>
            </div>
            <p className="text-4xl font-bold mb-1">{uniqueDomains}</p>
            <p className="text-sm opacity-90">Different websites</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Top Source</span>
            </div>
            <p className="text-xl font-bold mb-1 truncate">{sources[0]?.domain || 'N/A'}</p>
            <p className="text-sm opacity-90">{sources[0]?.count || 0} citations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Top Sources</h2>
            <p className="text-sm text-slate-600">
              Domains that AI platforms frequently reference. Consider these for content partnerships or competitive analysis.
            </p>
          </div>

          {sources.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No sources yet</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Run some prompts to see which sources AI platforms trust in your industry
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Rank</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Domain</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Citations</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Unique URLs</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Platforms</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Share</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source, index) => {
                    const sharePercentage = ((source.count / totalSources) * 100).toFixed(1);

                    return (
                      <tr key={source.domain} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{source.domain}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {source.count}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm text-slate-600">{source.urls.length}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {source.platforms.map((platform) => {
                              const platformColors: Record<string, string> = {
                                'gemini': 'bg-blue-100 text-blue-700',
                                'chatgpt': 'bg-green-100 text-green-700',
                                'perplexity': 'bg-purple-100 text-purple-700',
                                'aio': 'bg-orange-100 text-orange-700',
                              };

                              const platformLabels: Record<string, string> = {
                                'gemini': 'G',
                                'chatgpt': 'C',
                                'perplexity': 'P',
                                'aio': 'A',
                              };

                              return (
                                <span
                                  key={platform}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${platformColors[platform] || 'bg-slate-100 text-slate-700'}`}
                                  title={platform}
                                >
                                  {platformLabels[platform] || platform.charAt(0).toUpperCase()}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-semibold text-slate-900">{sharePercentage}%</span>
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                                style={{ width: `${sharePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://${source.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-sm"
                              title="Visit website"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-slate-700">
                  <strong>{sources[0]?.domain}</strong> is the most cited source with <strong>{sources[0]?.count} citations</strong> ({((sources[0]?.count / totalSources) * 100).toFixed(1)}% of all sources)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <p className="text-slate-700">
                  Top 5 domains account for <strong>{((sources.slice(0, 5).reduce((sum, s) => sum + s.count, 0) / totalSources) * 100).toFixed(1)}%</strong> of all source citations
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                <p className="text-slate-700">
                  Consider creating content similar to top sources or reaching out for partnerships to increase your brand visibility
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
