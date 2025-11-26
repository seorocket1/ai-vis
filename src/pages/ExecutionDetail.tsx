import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, TrendingUp, AlertTriangle, Globe, Link } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ExecutionDetail() {
  const { user } = useAuth();
  const [execution, setExecution] = useState<any>(null);
  const [promptData, setPromptData] = useState<any>(null);
  const [allExecutions, setAllExecutions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [brandMentions, setBrandMentions] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [hasInitializedTab, setHasInitializedTab] = useState(false);
  const executionId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [executionId, user]);

  // Removed the problematic useEffect that was causing tab auto-switching

  useEffect(() => {
    if (activeTab) {
      loadExecutionData(activeTab);
    }
  }, [activeTab]);

  const loadExecutionData = async (execId: string) => {
    if (!user) return;

    const [mentionsResult, sentimentResult, recsResult] = await Promise.all([
      supabase.from('brand_mentions').select('*').eq('execution_id', execId),
      supabase.from('sentiment_analysis').select('*').eq('execution_id', execId).maybeSingle(),
      supabase.from('recommendations').select('*').eq('execution_id', execId).order('recommendation_id', { ascending: true }),
    ]);

    setBrandMentions(mentionsResult.data || []);
    setSentiment(sentimentResult.data);
    setRecommendations(recsResult.data || []);
  };

  const loadData = async () => {
    if (!user || !executionId) return;

    const [executionResult, profileResult] = await Promise.all([
      supabase.from('prompt_executions').select('*').eq('id', executionId).eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);

    let promptResult = { data: null };
    if (executionResult.data?.prompt_id) {
      promptResult = await supabase.from('prompts').select('text').eq('id', executionResult.data.prompt_id).maybeSingle();
    }

    const currentExecution = executionResult.data;
    setExecution(currentExecution);
    setProfile(profileResult.data);
    if (promptResult.data) setPromptData(promptResult.data);

    if (currentExecution?.prompt_id) {
      const { data: relatedExecutions } = await supabase
        .from('prompt_executions')
        .select('*')
        .eq('prompt_id', currentExecution.prompt_id)
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false });

      setAllExecutions(relatedExecutions || []);
      // Only set activeTab once on initial load
      if (relatedExecutions && relatedExecutions.length > 0 && !hasInitializedTab) {
        setActiveTab(currentExecution.id);
        setHasInitializedTab(true);
      }
    }

    setLoading(false);
  };

  const parseAIResponse = (exec: any) => {
    if (!exec?.ai_response) return null;
    try {
      return typeof exec.ai_response === 'string' ? JSON.parse(exec.ai_response) : exec.ai_response;
    } catch {
      return null;
    }
  };

  const getCurrentExecution = () => {
    return allExecutions.find((e) => e.id === activeTab) || execution;
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="prompts">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!execution) {
    return (
      <DashboardLayout currentPage="prompts">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Execution Not Found</h2>
          <p className="text-slate-600 mb-6">The analysis you're looking for doesn't exist.</p>
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

  const currentExec = getCurrentExecution();
  const aiData = parseAIResponse(currentExec);
  const userBrand = profile?.brand_name || '';

  const userBrandCount = brandMentions
    .filter(m => m.is_user_brand)
    .reduce((sum, m) => sum + m.mention_count, 0);

  const competitors = brandMentions
    .filter(m => !m.is_user_brand)
    .map(m => [m.brand_name, m.mention_count] as [string, number]);

  const sentimentData = sentiment ? {
    Positive: `${sentiment.positive_percentage}%`,
    Neutral: `${sentiment.neutral_percentage}%`,
    Negative: `${sentiment.negative_percentage}%`,
  } : null;

  // Parse AI response properly
  let aiOriginalResponse = '';
  if (currentExec?.ai_response) {
    try {
      const parsed = typeof currentExec.ai_response === 'string' ? JSON.parse(currentExec.ai_response) : currentExec.ai_response;
      aiOriginalResponse = parsed.AI_Response || parsed.AI_original_response || currentExec.ai_response;
    } catch {
      aiOriginalResponse = currentExec.ai_response;
    }
  }

  // Parse sources
  let sources: string[] = [];
  if (currentExec?.sources) {
    try {
      const parsedSources = Array.isArray(currentExec.sources) ? currentExec.sources : JSON.parse(currentExec.sources);
      sources = parsedSources.map((source: any) => {
        if (typeof source === 'string') {
          return source;
        }
        if (source?.web?.uri) {
          return source.web.uri;
        }
        return null;
      }).filter(Boolean);
    } catch {
      sources = [];
    }
  }

  // Calculate domain statistics
  const domainStats = sources.reduce((acc: Record<string, number>, url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      acc[domain] = (acc[domain] || 0) + 1;
    } catch {
      // Invalid URL, skip
    }
    return acc;
  }, {});

  const sortedDomains = Object.entries(domainStats).sort(([, a], [, b]) => b - a);

  const platformDisplayNames: Record<string, string> = {
    gemini: 'Gemini',
    chatgpt: 'ChatGPT',
    perplexity: 'Perplexity',
    'ai-overview': 'AI Overview',
  };

  const platformColors: Record<string, string> = {
    gemini: 'emerald',
    chatgpt: 'green',
    perplexity: 'blue',
    'ai-overview': 'purple',
  };

  return (
    <DashboardLayout currentPage="prompts">
      <div className="max-w-7xl mx-auto">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{promptData?.text || execution.prompt_text || 'Query'} - Analysis</h1>
            </div>
            <button
              onClick={() => window.location.href = `/trigger-prompt/${execution.prompt_id}`}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-analyze
            </button>
          </div>
          <p className="text-slate-600 text-lg mb-4">Multi-Platform Analysis</p>

          {allExecutions.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {Array.from(new Set(allExecutions.map(e => e.platform || 'gemini').filter(Boolean))).map((platform) => {
                const exec = allExecutions.find(e => (e.platform || 'gemini') === platform && e.status === 'completed') || allExecutions.find(e => (e.platform || 'gemini') === platform);
                if (!exec || !platform) return null;
                const color = platformColors[platform] || 'slate';
                const isActive = activeTab === exec.id;
                return (
                  <button
                    key={platform}
                    onClick={() => setActiveTab(exec.id)}
                    className={`px-5 py-3 rounded-lg font-medium transition-all border-2 ${
                      isActive
                        ? `bg-${color}-500 text-white border-${color}-600 shadow-lg`
                        : `bg-white text-slate-700 border-slate-200 hover:border-${color}-300`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{platformDisplayNames[platform] || exec.model || 'AI'}</span>
                      {exec.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      {exec.status === 'processing' && <Clock className="w-4 h-4 animate-spin" />}
                      {exec.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                currentExec?.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : currentExec?.status === 'processing'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {currentExec?.status === 'completed' && <CheckCircle className="w-4 h-4" />}
              {currentExec?.status === 'processing' && <Clock className="w-4 h-4" />}
              {currentExec?.status === 'failed' && <AlertCircle className="w-4 h-4" />}
              {currentExec?.status}
            </span>
            <p className="text-sm text-slate-500">
              Analyzed on {new Date(currentExec?.executed_at).toLocaleString()} using{' '}
              <span className="font-semibold">{platformDisplayNames[currentExec?.platform || 'gemini'] || currentExec?.platform || currentExec?.model || 'AI'}</span>
            </p>
          </div>
        </div>

        {currentExec?.status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <h3 className="font-semibold text-blue-900">Analysis in Progress</h3>
            </div>
            <p className="text-blue-800 text-sm">
              Your prompt is being analyzed. This page will update automatically when complete.
            </p>
          </div>
        )}

        {currentExec?.status === 'completed' && (
          <div className="space-y-6">
            {/* Brand Mention Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Your Brand Status</h2>
              {!userBrand ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">Brand Name Not Set</p>
                    <p className="text-sm text-yellow-700">
                      Please set your brand name in <a href="/settings" className="underline font-semibold">Settings</a> to track brand mentions accurately.
                    </p>
                  </div>
                </div>
              ) : userBrandCount === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Brand Not Mentioned</p>
                    <p className="text-sm text-red-700">
                      Your brand ({userBrand}) was not mentioned in the AI answer. This indicates low brand visibility. Consider improving your brand presence and content strategy.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Brand Mentioned!</p>
                    <p className="text-sm text-green-700">
                      {userBrand} was mentioned <span className="font-bold">{userBrandCount}</span> time{userBrandCount !== 1 ? 's' : ''} in the AI response.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Competitor Mentions */}
            {competitors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Competitor Mentions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {competitors
                    .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
                    .map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <span className="font-medium text-slate-900">{name}</span>
                        <span className="text-2xl font-bold text-slate-700">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sentiment Analysis */}
            {sentimentData && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Sentiment Analysis</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-700">{sentimentData.Positive}</span>
                    </div>
                    <p className="font-semibold text-slate-900">Positive</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-700">{sentimentData.Neutral}</span>
                    </div>
                    <p className="font-semibold text-slate-900">Neutral</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-700">{sentimentData.Negative}</span>
                    </div>
                    <p className="font-semibold text-slate-900">Negative</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Original Response */}
            {aiOriginalResponse && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">AI Answer</h2>
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-strong:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-700 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiOriginalResponse}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Sources Section */}
            {sources.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Domain Analysis */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-500 rounded-lg shadow-md">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Top Domains</h2>
                  </div>
                  <div className="space-y-2.5">
                    {sortedDomains.slice(0, 10).map(([domain, count], index) => (
                      <div key={domain} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded font-bold text-xs flex-shrink-0 shadow-sm">
                            {index + 1}
                          </span>
                          <span className="font-medium text-slate-900 truncate">{domain}</span>
                        </div>
                        <span className="ml-3 px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-bold flex-shrink-0 shadow-sm">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-blue-200 bg-white/50 -mx-6 px-6 py-4 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-600">
                          <span className="font-bold text-blue-600">{sortedDomains.length}</span> unique domains
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-600">
                          <span className="font-bold text-blue-600">{sources.length}</span> total sources
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Sources */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md border border-emerald-200 p-6 hover:shadow-lg transition-shadow flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-500 rounded-lg shadow-md">
                      <Link className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">All Sources</h2>
                    <span className="ml-auto px-2.5 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-sm">
                      {sources.length}
                    </span>
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                    {sources.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 bg-white border border-emerald-100 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all group"
                      >
                        <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded font-bold text-xs flex-shrink-0 shadow-sm group-hover:bg-emerald-600 transition-colors">
                          {index + 1}
                        </span>
                        <span className="text-sm text-emerald-700 hover:text-emerald-800 break-all font-medium leading-relaxed mt-0.5">
                          {url}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Strategic Recommendations</h2>
                </div>
                <div className="space-y-3">
                  {recommendations.map((rec: any, index: number) => (
                    <div key={rec.id || index} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-lg hover:shadow-lg transition-all">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                        {index + 1}
                      </div>
                      <p className="text-slate-900 leading-relaxed">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
