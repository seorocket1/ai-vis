import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkQueryLimit, incrementQueryUsage } from '../lib/queryLimits';
import DashboardLayout from '../components/DashboardLayout';
import { Play, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  description: string;
}

const platforms: Platform[] = [
  { id: 'gemini', name: 'Gemini', displayName: 'Google Gemini', icon: 'G', color: 'emerald', description: 'Google\'s most capable AI model' },
  { id: 'chatgpt', name: 'ChatGPT', displayName: 'ChatGPT (GPT-4)', icon: 'C', color: 'green', description: 'OpenAI\'s most advanced model' },
  { id: 'perplexity', name: 'Perplexity', displayName: 'Perplexity AI', icon: 'P', color: 'blue', description: 'AI-powered answer engine' },
  { id: 'ai-overview', name: 'AI Overview', displayName: 'AI Overview', icon: 'A', color: 'purple', description: 'Google\'s AI Overview' },
];

export default function TriggerPrompt() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['gemini']);
  const promptId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadData();
  }, [promptId, user]);

  const loadData = async () => {
    if (!user || !promptId) return;

    const [promptResult, profileResult] = await Promise.all([
      supabase.from('prompts').select('*').eq('id', promptId).eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);

    setPrompt(promptResult.data);
    setProfile(profileResult.data);
    setLoading(false);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const calculateAggregatedMetrics = async () => {
    if (!user || !profile) return;

    console.log('[Metrics] Calculating aggregated metrics for user:', user.id);

    const execsResult = await supabase
      .from('prompt_executions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    console.log('[Metrics] Executions result:', execsResult);

    const executions = execsResult.data || [];
    if (executions.length === 0) {
      console.log('[Metrics] No executions found, skipping metrics calculation');
      return;
    }

    const executionIds = executions.map(e => e.id);

    const [mentionsResult, sentimentsResult] = await Promise.all([
      supabase.from('brand_mentions').select('*').in('execution_id', executionIds),
      supabase.from('sentiment_analysis').select('*').in('execution_id', executionIds),
    ]);

    console.log('[Metrics] Mentions result:', mentionsResult);
    console.log('[Metrics] Sentiments result:', sentimentsResult);

    const mentions = mentionsResult.data || [];
    const sentiments = sentimentsResult.data || [];

    const totalExecutions = executions.length;
    const platformsUsed = new Set(executions.map(e => e.platform)).size;

    const brandMentions = mentions.filter(m => m.is_user_brand);
    const competitorMentions = mentions.filter(m => !m.is_user_brand);

    const totalBrandMentions = brandMentions.reduce((sum, m) => sum + m.mention_count, 0);
    const totalCompetitorMentions = competitorMentions.reduce((sum, m) => sum + m.mention_count, 0);
    const totalMentions = totalBrandMentions + totalCompetitorMentions;

    const shareOfVoice = totalMentions > 0 ? (totalBrandMentions / totalMentions) * 100 : 0;
    const avgBrandVisibility = totalExecutions > 0 ? totalBrandMentions / totalExecutions : 0;

    const avgPositive = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + parseFloat(s.positive_percentage || 0), 0) / sentiments.length
      : 0;
    const avgNeutral = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + parseFloat(s.neutral_percentage || 0), 0) / sentiments.length
      : 0;
    const avgNegative = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + parseFloat(s.negative_percentage || 0), 0) / sentiments.length
      : 0;

    const sentimentScore = avgPositive - avgNegative;

    const competitorGroups: Record<string, number> = {};
    competitorMentions.forEach(m => {
      competitorGroups[m.brand_name] = (competitorGroups[m.brand_name] || 0) + m.mention_count;
    });

    const sortedCompetitors = Object.entries(competitorGroups).sort((a, b) => b[1] - a[1]);
    const topCompetitor = sortedCompetitors.length > 0 ? sortedCompetitors[0][0] : null;

    const allBrands = [
      { name: profile.brand_name, count: totalBrandMentions },
      ...sortedCompetitors.map(([name, count]) => ({ name, count })),
    ].sort((a, b) => b.count - a.count);

    const competitiveRank = allBrands.findIndex(b => b.name === profile.brand_name) + 1;

    const metrics = {
      user_id: user.id,
      time_period: 'all',
      total_executions: totalExecutions,
      platform_coverage: platformsUsed,
      total_brand_mentions: totalBrandMentions,
      total_competitor_mentions: totalCompetitorMentions,
      share_of_voice: shareOfVoice,
      avg_brand_visibility: avgBrandVisibility,
      avg_sentiment_score: sentimentScore,
      avg_positive_sentiment: avgPositive,
      avg_neutral_sentiment: avgNeutral,
      avg_negative_sentiment: avgNegative,
      competitive_rank: competitiveRank,
      top_competitor: topCompetitor,
      response_quality: avgPositive,
      updated_at: new Date().toISOString(),
    };

    console.log('[Metrics] Calculated metrics:', metrics);

    const existingMetric = await supabase
      .from('aggregated_metrics')
      .select('id')
      .eq('user_id', user.id)
      .eq('time_period', 'all')
      .maybeSingle();

    console.log('[Metrics] Existing metric:', existingMetric);

    if (existingMetric.data) {
      const updateResult = await supabase
        .from('aggregated_metrics')
        .update(metrics)
        .eq('id', existingMetric.data.id);
      console.log('[Metrics] Update result:', updateResult);
    } else {
      const insertResult = await supabase.from('aggregated_metrics').insert(metrics);
      console.log('[Metrics] Insert result:', insertResult);
    }

    console.log('[Metrics] Metrics calculation complete');
  };

  const handleTrigger = async () => {
    if (!user || !prompt || !profile?.brand_name) {
      setError('Brand name not found. Please update your profile settings.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one AI platform.');
      return;
    }

    const queryCheck = await checkQueryLimit(user.id);
    if (!queryCheck.allowed) {
      setError(`Query limit reached! You have used all ${queryCheck.limit} queries this month. Please upgrade to Pro for 500 queries/month or wait for your limit to reset.`);
      return;
    }

    setTriggering(true);
    setError('');

    try {
      const success = await incrementQueryUsage(user.id);
      if (!success) {
        setError('Failed to track query usage. Please try again.');
        setTriggering(false);
        return;
      }

      const executionIds: string[] = [];

      for (const platformId of selectedPlatforms) {
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;

        const { data: execution } = await supabase
          .from('prompt_executions')
          .insert({
            prompt_id: prompt.id,
            user_id: user.id,
            model: platform.name,
            platform: platformId,
            status: 'processing',
          })
          .select()
          .single();

        if (execution) {
          executionIds.push(execution.id);
        }
      }

      await supabase
        .from('prompts')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', prompt.id);

      const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

      for (let i = 0; i < selectedPlatforms.length; i++) {
        const platformId = selectedPlatforms[i];
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;

        try {
          console.log(`Triggering ${platform.displayName} analysis`);

          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Model: platform.name,
              Platform: platformId,
              Prompt: prompt.text,
              Brand: profile.brand_name,
              executionId: executionIds[i],
            }),
          });

          console.log(`${platform.displayName} response status:`, response.status);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const responseData = await response.json();
          console.log(`${platform.displayName} response:`, responseData);

          await supabase
            .from('prompt_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              ai_response: JSON.stringify(responseData),
            })
            .eq('id', executionIds[i]);

          if (responseData.brandAndCompetitorMentions) {
            const mentions = Object.entries(responseData.brandAndCompetitorMentions).map(([brand, count]) => ({
              execution_id: executionIds[i],
              brand_name: brand,
              mention_count: typeof count === 'string' ? parseInt(count, 10) : (count as number),
              is_user_brand: brand.toLowerCase().includes(profile.brand_name.toLowerCase()) ||
                profile.brand_name.toLowerCase().includes(brand.toLowerCase()),
            }));

            await supabase.from('brand_mentions').insert(mentions);
          }

          const sentimentData = responseData.sentiment || responseData.overallSentiment;
          if (sentimentData) {
            const parsePercent = (val: any) => {
              if (typeof val === 'string') return parseFloat(val.replace('%', '')) || 0;
              return val || 0;
            };

            await supabase.from('sentiment_analysis').insert({
              execution_id: executionIds[i],
              positive_percentage: parsePercent(sentimentData.Positive || sentimentData.positive),
              neutral_percentage: parsePercent(sentimentData.Neutral || sentimentData.neutral),
              negative_percentage: parsePercent(sentimentData.Negative || sentimentData.negative),
            });
          }

          if (responseData.recommendations && Array.isArray(responseData.recommendations)) {
            const recs = responseData.recommendations.map((rec: any, index: number) => ({
              execution_id: executionIds[i],
              recommendation_id: `rec_${index + 1}`,
              text: typeof rec === 'string' ? rec : rec.text,
            }));

            await supabase.from('recommendations').insert(recs);
          }
        } catch (webhookError: any) {
          console.error(`Error triggering ${platform.displayName} analysis:`, webhookError);

          await supabase
            .from('prompt_executions')
            .update({
              status: 'failed',
              ai_response: JSON.stringify({ error: webhookError.message })
            })
            .eq('id', executionIds[i]);
        }
      }

      if (executionIds.length > 0) {
        await calculateAggregatedMetrics();
        window.location.href = `/execution/${executionIds[0]}`;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger analysis. Please try again.');
      setTriggering(false);
    }
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

  if (!prompt) {
    return (
      <DashboardLayout currentPage="prompts">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Prompt Not Found</h2>
          <p className="text-slate-600 mb-6">The prompt you're looking for doesn't exist.</p>
          <a
            href="/prompts"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Back to Prompts
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="prompts">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <a
          href="/prompts"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Prompts
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Trigger Multi-Platform Analysis</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prompt Text
              </label>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-900">{prompt.text}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select AI Platforms
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedPlatforms.includes(platform.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="font-bold">{platform.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{platform.displayName}</p>
                        <p className="text-xs text-slate-600">{platform.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedPlatforms.includes(platform.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedPlatforms.includes(platform.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Brand Name
              </label>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-900">{profile?.brand_name || 'Not set'}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-5">
              <h3 className="font-semibold text-slate-900 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Your prompt will be sent to {selectedPlatforms.length} AI platform(s)</li>
                <li>• Each response will be analyzed for brand mentions</li>
                <li>• Sentiment analysis will be performed</li>
                <li>• Competitive insights will be generated</li>
                <li>• Strategic recommendations will be provided</li>
                <li>• You'll be redirected to view the first result</li>
              </ul>
            </div>

            <button
              onClick={handleTrigger}
              disabled={triggering || !profile?.brand_name || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5" />
              {triggering
                ? `Triggering ${selectedPlatforms.length} Analysis...`
                : `Trigger ${selectedPlatforms.length} Analysis`}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
