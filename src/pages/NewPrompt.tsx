import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkPromptLimit, checkQueryLimit, incrementQueryUsage } from '../lib/queryLimits';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

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

export default function NewPrompt() {
  const { user } = useAuth();
  const [promptText, setPromptText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['gemini']);
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const handleSubmit = async () => {
    if (!user || !promptText.trim() || !brandName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one AI platform.');
      return;
    }

    const promptCheck = await checkPromptLimit(user.id);
    if (!promptCheck.allowed) {
      setError(`You've reached your plan's limit of ${promptCheck.limit} prompts. ${promptCheck.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : 'Please delete some prompts to add new ones.'}`);
      return;
    }

    const queryCheck = await checkQueryLimit(user.id);
    if (!queryCheck.allowed) {
      setError(`Query limit reached! You have used all ${queryCheck.limit} queries this month. Please upgrade to Pro for 500 queries/month.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await incrementQueryUsage(user.id);
      if (!success) {
        setError('Failed to track query usage. Please try again.');
        setLoading(false);
        return;
      }

      await supabase
        .from('profiles')
        .update({ brand_name: brandName.trim() })
        .eq('id', user.id);

      const { data: insertedPrompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          text: promptText.trim(),
          frequency: 'weekly',
          platform: selectedPlatforms[0],
          is_active: true,
        })
        .select()
        .single();

      if (promptError || !insertedPrompt) {
        setError('Failed to create prompt. Please try again.');
        setLoading(false);
        return;
      }

      const executionIds: string[] = [];

      for (const platformId of selectedPlatforms) {
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;

        const { data: execution } = await supabase
          .from('prompt_executions')
          .insert({
            prompt_id: insertedPrompt.id,
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
        .eq('id', insertedPrompt.id);

      const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

      for (let i = 0; i < selectedPlatforms.length; i++) {
        const platformId = selectedPlatforms[i];
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;

        try {
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Model: platform.name,
              Platform: platformId,
              Prompt: promptText.trim(),
              Brand: brandName.trim(),
              executionId: executionIds[i],
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (webhookError: any) {
          console.error(`Error triggering ${platform.displayName} analysis:`, webhookError);
          await supabase
            .from('prompt_executions')
            .update({ status: 'failed' })
            .eq('id', executionIds[i]);
        }
      }

      if (executionIds.length > 0) {
        window.location.href = `/execution/${executionIds[0]}`;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create prompt. Please try again.');
      setLoading(false);
    }
  };

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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prompt Text
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g., What are the best tax software for freelancers in India?"
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Be specific and natural - this is how users would ask AI platforms
              </p>
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
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., TaxBuddy"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-500 mt-2">
                Your brand name to track in AI responses
              </p>
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
              onClick={handleSubmit}
              disabled={loading || !promptText.trim() || !brandName.trim() || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              {loading
                ? `Creating & Triggering ${selectedPlatforms.length} Analysis...`
                : `Create & Trigger ${selectedPlatforms.length} Analysis`}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
