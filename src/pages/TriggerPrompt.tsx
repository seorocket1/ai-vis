import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Play, ArrowLeft, Sparkles } from 'lucide-react';

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
  { id: 'claude', name: 'Claude', displayName: 'Claude 3.5 Sonnet', icon: 'A', color: 'amber', description: 'Anthropic\'s powerful AI assistant' },
  { id: 'perplexity', name: 'Perplexity', displayName: 'Perplexity AI', icon: 'P', color: 'blue', description: 'AI-powered answer engine' },
  { id: 'grok', name: 'Grok', displayName: 'Grok (xAI)', icon: 'X', color: 'slate', description: 'xAI\'s conversational AI' },
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

  const handleTrigger = async () => {
    if (!user || !prompt || !profile?.brand_name) {
      setError('Brand name not found. Please update your profile settings.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one AI platform.');
      return;
    }

    setTriggering(true);
    setError('');

    try {
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

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-analysis`;

      for (let i = 0; i < selectedPlatforms.length; i++) {
        const platformId = selectedPlatforms[i];
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;

        try {
          console.log(`Triggering ${platform.displayName} analysis`);

          const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
          const responseData = await response.json();
          console.log(`${platform.displayName} response:`, responseData);
        } catch (webhookError) {
          console.error(`Error triggering ${platform.displayName} analysis:`, webhookError);
        }
      }

      if (executionIds.length > 0) {
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
