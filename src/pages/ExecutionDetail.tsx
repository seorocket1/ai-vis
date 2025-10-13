import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ExecutionDetail() {
  const { user } = useAuth();
  const [execution, setExecution] = useState<any>(null);
  const [promptData, setPromptData] = useState<any>(null);
  const [allExecutions, setAllExecutions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const executionId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [executionId, user]);

  useEffect(() => {
    if (allExecutions.length > 0 && !activeTab) {
      setActiveTab(allExecutions[0].id);
    }
  }, [allExecutions]);

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
      if (relatedExecutions && relatedExecutions.length > 0) {
        const currentPlatform = currentExecution.platform;
        const existingExecForPlatform = relatedExecutions.find(e => e.platform === currentPlatform && e.id !== currentExecution.id);
        if (!activeTab || (existingExecForPlatform && activeTab === existingExecForPlatform.id)) {
          setActiveTab(currentExecution.id);
        }
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
  const brandMentions = aiData?.brandAndCompetitorMentions || {};
  const userBrand = profile?.brand_name || '';

  const userBrandCount = Object.entries(brandMentions).reduce((count, [name, mentions]) => {
    if (!userBrand) return count;
    const matches = name.toLowerCase().includes(userBrand.toLowerCase()) || userBrand.toLowerCase().includes(name.toLowerCase());
    if (matches) {
      return count + (mentions as number);
    }
    return count;
  }, 0);

  const competitors = Object.entries(brandMentions).filter(([name]) => {
    return !name.toLowerCase().includes(userBrand.toLowerCase()) && !userBrand.toLowerCase().includes(name.toLowerCase());
  });

  const sentiment = aiData?.overallSentiment;
  const recommendations = aiData?.recommendations || [];
  const aiOriginalResponse = aiData?.AI_original_response || '';

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
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-slate-900">{promptData?.text || execution.prompt_text || 'Query'} - Analysis</h1>
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

        {currentExec?.status === 'completed' && aiData && (
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
            {sentiment && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Sentiment Analysis</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-700">{sentiment.Positive}</span>
                    </div>
                    <p className="font-semibold text-slate-900">Positive</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-700">{sentiment.Neutral}</span>
                    </div>
                    <p className="font-semibold text-slate-900">Neutral</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-700">{sentiment.Negative}</span>
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
                <div className="prose prose-slate prose-lg max-w-none prose-headings:mt-8 prose-headings:mb-4 prose-p:my-4 prose-p:leading-relaxed prose-li:my-2 prose-ul:my-4 prose-ol:my-4 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiOriginalResponse}</ReactMarkdown>
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
