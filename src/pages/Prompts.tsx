import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, CreditCard as Edit2, Trash2, X, Play, Clock, Target, TrendingUp, Activity, Calendar, Upload, PlayCircle, Check } from 'lucide-react';
import { checkPromptLimit } from '../lib/queryLimits';

interface Prompt {
  id: string;
  text: string;
  is_active: boolean;
  frequency: string;
  platform?: string;
  last_triggered_at: string | null;
  created_at: string;
  executions?: any[];
}

export default function Prompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptFrequency, setNewPromptFrequency] = useState('weekly');
  const [newPromptPlatform, setNewPromptPlatform] = useState('gemini');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkPromptText, setBulkPromptText] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [bulkPlatforms, setBulkPlatforms] = useState<string[]>(['gemini']);
  const [profile, setProfile] = useState<any>(null);
  const [promptLimit, setPromptLimit] = useState({ current: 0, limit: 5, allowed: true });
  const [stats, setStats] = useState({
    brandCoverage: 0,
    avgSentiment: 0,
    totalExecutions: 0,
    avgMentionsPerPrompt: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  // Poll for updates when there are processing executions
  useEffect(() => {
    const hasProcessing = prompts.some(p =>
      (p.allExecutions as any[])?.some((e: any) => e.status === 'processing')
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      console.log('Polling for execution updates...');
      loadData();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [prompts, user]);

  const loadData = async () => {
    if (!user) return;

    const [promptsResult, profileResult, metricsResult, executionsResult] = await Promise.all([
      supabase.from('prompts').select('*, prompt_executions(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('aggregated_metrics').select('*').eq('user_id', user.id).eq('time_period', 'all').maybeSingle(),
      supabase.from('prompt_executions').select('id').eq('user_id', user.id).eq('status', 'completed')
    ]);

    const promptsWithExecution = await Promise.all((promptsResult.data || []).map(async prompt => {
      const executions = prompt.prompt_executions || [];
      const completedExecs = executions.filter((e: any) => e.status === 'completed');
      const latestExecution = completedExecs.length > 0 ? completedExecs[completedExecs.length - 1] : null;

      const executionIds = completedExecs.map((e: any) => e.id);
      let brandMentionsMap: Record<string, any[]> = {};
      let sentimentData = null;

      if (executionIds.length > 0) {
        const [mentionsResult, sentimentResult] = await Promise.all([
          supabase
            .from('brand_mentions')
            .select('*, prompt_executions!inner(platform)')
            .in('execution_id', executionIds)
            .eq('is_user_brand', true),
          supabase
            .from('sentiment_analysis')
            .select('*')
            .eq('execution_id', latestExecution?.id || '')
            .maybeSingle()
        ]);

        if (mentionsResult.data) {
          mentionsResult.data.forEach(m => {
            const platform = (m as any).prompt_executions?.platform || 'gemini';
            if (!brandMentionsMap[platform]) {
              brandMentionsMap[platform] = [];
            }
            brandMentionsMap[platform].push(m);
          });
        }

        sentimentData = sentimentResult.data;
      }

      return {
        ...prompt,
        latestExecution,
        allExecutions: executions,
        brandMentionsByPlatform: brandMentionsMap,
        sentiment: sentimentData
      };
    }));

    setPrompts(promptsWithExecution);
    setProfile(profileResult.data);

    const plan = profileResult.data?.subscription_plan || 'free';
    const limit = plan === 'pro' ? 50 : 5;
    const current = promptsWithExecution.length;
    const allowed = current < limit;

    console.log(`Prompts page: current=${current}, limit=${limit}, allowed=${allowed}, plan=${plan}`);

    setPromptLimit({ current, limit, allowed });

    const metrics = metricsResult.data;
    const totalExec = executionsResult.data?.length || 0;
    const avgMentions = metrics?.total_brand_mentions && promptsWithExecution.length > 0
      ? (metrics.total_brand_mentions / promptsWithExecution.length).toFixed(1)
      : 0;

    setStats({
      brandCoverage: Math.round(metrics?.avg_brand_visibility || 0),
      avgSentiment: Math.round(metrics?.avg_positive_sentiment || 0),
      totalExecutions: totalExec,
      avgMentionsPerPrompt: Number(avgMentions)
    });
    setLoading(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!user || !newPromptText.trim()) return;

    if (editingPrompt) {
      await supabase
        .from('prompts')
        .update({ text: newPromptText, frequency: newPromptFrequency })
        .eq('id', editingPrompt.id);
    } else {
      const limitCheck = await checkPromptLimit(user.id);

      console.log('Prompt limit check:', limitCheck);

      if (!limitCheck.allowed) {
        alert(`You've reached your plan's limit of ${limitCheck.limit} prompts. You currently have ${limitCheck.current} prompts. ${limitCheck.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : 'Please delete some prompts to add new ones.'}`);
        return;
      }

      const { data: insertedData, error } = await supabase.from('prompts').insert({
        user_id: user.id,
        text: newPromptText,
        frequency: newPromptFrequency,
        platform: newPromptPlatform,
        is_active: true,
      }).select();

      if (error) {
        console.error('Error creating prompt:', error);
        alert(`Failed to create prompt: ${error.message}`);
        return;
      }

      // Auto-trigger analysis for new prompt
      if (insertedData && insertedData[0]) {
        const promptId = insertedData[0].id;
        triggerSinglePrompt(promptId);
      }
    }

    setShowModal(false);
    setNewPromptText('');
    setNewPromptFrequency('weekly');
    setNewPromptPlatform('gemini');
    setEditingPrompt(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      await supabase.from('prompts').delete().eq('id', id);
      loadData();
    }
  };

  const handleToggleActive = async (prompt: Prompt) => {
    await supabase
      .from('prompts')
      .update({ is_active: !prompt.is_active })
      .eq('id', prompt.id);
    loadData();
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setNewPromptText(prompt.text);
    setNewPromptFrequency(prompt.frequency);
    setShowModal(true);
  };

  const triggerPrompt = (promptId: string) => {
    window.location.href = `/trigger/${promptId}`;
  };

  const triggerSinglePrompt = async (promptId: string) => {
    if (!user || !profile) return;

    try {
      // Get the prompt details
      const { data: promptData } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .maybeSingle();

      if (!promptData || !profile.brand_name) {
        console.error('Prompt or brand name not found');
        return;
      }

      const promptPlatform = promptData.platform || 'gemini';
      const platformMap: Record<string, string> = {
        'gemini': 'Gemini',
        'chatgpt': 'ChatGPT',
        'perplexity': 'Perplexity',
        'ai-overview': 'AI Overview'
      };
      const modelName = platformMap[promptPlatform] || 'Gemini';

      // Create execution record
      const { data: execution } = await supabase
        .from('prompt_executions')
        .insert({
          prompt_id: promptId,
          user_id: user.id,
          model: modelName,
          platform: promptPlatform,
          status: 'processing',
        })
        .select()
        .single();

      if (!execution) {
        console.error('Failed to create execution');
        return;
      }

      // Update last triggered
      await supabase
        .from('prompts')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', promptId);

      // Refresh the UI to show processing state
      loadData();

      // Call n8n webhook
      const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

      try {
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Model: modelName,
            Platform: promptPlatform,
            Prompt: promptData.text,
            Brand: profile.brand_name,
            executionId: execution.id,
          }),
        });

        if (!response.ok) {
          console.error('n8n webhook failed:', response.status);
          await supabase
            .from('prompt_executions')
            .update({ status: 'failed' })
            .eq('id', execution.id);
        } else {
          console.log('Analysis triggered for prompt:', promptId, 'on platform:', promptPlatform);
        }
      } catch (webhookError) {
        console.error('Error calling n8n webhook:', webhookError);
        await supabase
          .from('prompt_executions')
          .update({ status: 'failed' })
          .eq('id', execution.id);
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
    }
  };

  const triggerBulkPrompts = async (promptIds: string[]) => {
    if (!user || !profile || !profile.brand_name) return;

    try {
      // Get all prompt details
      const { data: prompts } = await supabase
        .from('prompts')
        .select('*')
        .in('id', promptIds);

      if (!prompts || prompts.length === 0) {
        console.error('No prompts found');
        return;
      }

      // Create execution records for all prompts
      const executionsToCreate = prompts.map(prompt => {
        const platform = prompt.platform || 'gemini';
        console.log('[triggerBulkPrompts] Prompt platform:', prompt.platform, '-> resolved:', platform);
        let modelName = 'Gemini';
        if (platform === 'gemini') modelName = 'Gemini';
        else if (platform === 'perplexity') modelName = 'Perplexity';
        else if (platform === 'chatgpt') modelName = 'ChatGPT';
        else if (platform === 'ai-overview') modelName = 'AI Overview';
        else modelName = 'Gemini'; // default fallback
        console.log('[triggerBulkPrompts] Platform:', platform, '-> Model:', modelName);
        return {
          prompt_id: prompt.id,
          user_id: user.id,
          model: modelName,
          platform: platform,
          status: 'processing',
        };
      });

      const { data: executions } = await supabase
        .from('prompt_executions')
        .insert(executionsToCreate)
        .select();

      if (!executions || executions.length === 0) {
        console.error('Failed to create executions');
        return;
      }

      // Update last triggered for all prompts
      await supabase
        .from('prompts')
        .update({ last_triggered_at: new Date().toISOString() })
        .in('id', promptIds);

      // Refresh UI
      loadData();

      // Group prompts by platform/model
      const promptsByModel: { [key: string]: any[] } = {};

      prompts.forEach((prompt, index) => {
        const platform = prompt.platform || 'gemini';
        console.log('[triggerBulkPrompts] Grouping - Prompt:', prompt.text?.substring(0, 30), 'Platform:', prompt.platform, '-> resolved:', platform);
        let modelName = 'Gemini';
        if (platform === 'gemini') modelName = 'Gemini';
        else if (platform === 'perplexity') modelName = 'Perplexity';
        else if (platform === 'chatgpt') modelName = 'ChatGPT';
        else if (platform === 'ai-overview') modelName = 'AI Overview';
        else modelName = 'Gemini'; // default fallback
        console.log('[triggerBulkPrompts] Grouping - Platform:', platform, '-> Model:', modelName);

        if (!promptsByModel[modelName]) {
          promptsByModel[modelName] = [];
        }

        promptsByModel[modelName].push({
          text: prompt.text,
          executionId: executions[index]?.id,
        });
      });

      console.log('[triggerBulkPrompts] Final groups:', Object.keys(promptsByModel));

      // Call n8n webhook with bulk format for each model
      const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

      try {
        // Send separate requests for each model
        const promises = Object.entries(promptsByModel).map(([modelName, promptsArray]) =>
          fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Model: modelName,
              Brand: profile.brand_name,
              Prompts: promptsArray,
            }),
          })
        );

        const responses = await Promise.all(promises);
        const allSuccessful = responses.every(r => r.ok);

        if (!allSuccessful) {
          console.error('Some bulk n8n webhook calls failed');
          // Mark failed executions
          const failedResponses = responses.filter(r => !r.ok);
          console.error('Failed responses:', failedResponses.length);

        } else {
          console.log('Bulk analysis triggered for', prompts.length, 'prompts across', Object.keys(promptsByModel).length, 'models');
        }
      } catch (webhookError) {
        console.error('Error calling bulk n8n webhook:', webhookError);
        // Mark all executions as failed
        await supabase
          .from('prompt_executions')
          .update({ status: 'failed' })
          .in('id', executions.map(e => e.id));
      }
    } catch (error) {
      console.error('Error triggering bulk analysis:', error);
    }
  };

  const handleBulkUpload = async () => {
    if (!user || !bulkPromptText.trim()) return;

    // Split by newlines and filter empty lines
    const lines = bulkPromptText
      .split(/\r?\n/)  // Handle both \n and \r\n
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('[Bulk Upload] Input text:', bulkPromptText);
    console.log('[Bulk Upload] Parsed lines:', lines);
    console.log('[Bulk Upload] Number of prompts:', lines.length);

    if (lines.length === 0) {
      alert('Please enter at least one prompt');
      return;
    }

    // Calculate total prompts to be created (just the number of lines)
    const totalPromptsToCreate = lines.length;

    if (promptLimit.current + totalPromptsToCreate > promptLimit.limit) {
      alert(`Cannot add ${totalPromptsToCreate} prompts. You have ${promptLimit.current}/${promptLimit.limit} prompts. ${promptLimit.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : `You can only add ${promptLimit.limit - promptLimit.current} more.`}`);
      return;
    }

    // Create one prompt per line (platform will be used during execution)
    const promptsToInsert = lines.map(line => ({
      user_id: user.id,
      text: line.trim(),
      frequency: newPromptFrequency,
      platform: null, // No specific platform - will run on all selected platforms
      is_active: true,
    }));

    const { data, error } = await supabase.from('prompts').insert(promptsToInsert).select();

    if (error) {
      console.error('Error bulk uploading prompts:', error);
      alert(`Failed to upload prompts: ${error.message}`);
      return;
    }

    setShowModal(false);
    setBulkPromptText('');
    setIsBulkMode(false);

    // Reload data first to show the new prompts
    await loadData();

    // Auto-trigger analysis for all new prompts on all selected platforms
    if (data && data.length > 0) {
      console.log('Bulk upload: Triggering analysis for', data.length, 'prompts on', bulkPlatforms.length, 'platforms');

      // Create execution records for each prompt on each selected platform
      const executionsToCreate = [];
      for (const prompt of data) {
        for (const platform of bulkPlatforms) {
          const platformMap: Record<string, string> = {
            'gemini': 'Gemini',
            'chatgpt': 'ChatGPT',
            'perplexity': 'Perplexity',
            'aio': 'AI Overview'
          };
          const modelName = platformMap[platform] || 'Gemini';

          executionsToCreate.push({
            prompt_id: prompt.id,
            user_id: user.id,
            model: modelName,
            platform: platform,
            status: 'processing',
          });
        }
      }

      // Create all execution records
      const { data: executions } = await supabase
        .from('prompt_executions')
        .insert(executionsToCreate)
        .select();

      if (executions && executions.length > 0) {
        // Update last triggered for all prompts
        const promptIds = data.map(p => p.id);
        await supabase
          .from('prompts')
          .update({ last_triggered_at: new Date().toISOString() })
          .in('id', promptIds);

        // Trigger n8n webhooks for each execution
        const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

        for (const execution of executions) {
          const prompt = data.find(p => p.id === execution.prompt_id);
          if (!prompt || !profile?.brand_name) continue;

          try {
            await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                Model: execution.model,
                Platform: execution.platform,
                Prompt: prompt.text,
                Brand: profile.brand_name,
                executionId: execution.id,
              }),
            });
          } catch (error) {
            console.error('Error calling n8n webhook:', error);
            await supabase
              .from('prompt_executions')
              .update({ status: 'failed' })
              .eq('id', execution.id);
          }
        }
      }

      // Reload again to show processing state
      await loadData();
    }
  };

  const handleBulkRun = async () => {
    if (selectedPrompts.length === 0) {
      alert('Please select at least one prompt to run');
      return;
    }

    const confirmed = confirm(`Run analysis for ${selectedPrompts.length} selected prompt(s)?`);
    if (!confirmed) return;

    // Trigger all selected prompts using bulk trigger
    await triggerBulkPrompts(selectedPrompts);

    setSelectedPrompts([]);

    // Reload data to show processing state
    await loadData();

    alert(`Analysis started for ${selectedPrompts.length} prompt(s)!`);
  };

  const togglePromptSelection = (promptId: string) => {
    setSelectedPrompts(prev =>
      prev.includes(promptId)
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const selectAllPrompts = () => {
    if (selectedPrompts.length === prompts.length) {
      setSelectedPrompts([]);
    } else {
      setSelectedPrompts(prompts.map(p => p.id));
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

  const activePrompts = prompts.filter(p => p.is_active).length;

  return (
    <DashboardLayout currentPage="prompts">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Tracked Queries</h1>
              <p className="text-slate-600">Manage prompts to monitor brand mentions across AI platforms</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!promptLimit.allowed) {
                    alert(`You've reached your plan's limit of ${promptLimit.limit} prompts. ${promptLimit.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : 'Please delete some prompts to add new ones.'}`);
                    return;
                  }
                  setEditingPrompt(null);
                  setNewPromptText('');
                  setNewPromptFrequency('weekly');
                  setNewPromptPlatform('gemini');
                  setIsBulkMode(true);
                  setBulkPromptText('');
                  setShowModal(true);
                }}
                disabled={!promptLimit.allowed}
                className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium shadow-lg ${
                  promptLimit.allowed
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-5 h-5" />
                Bulk Upload
              </button>
              <a
                href={promptLimit.allowed ? '/prompts/new' : '#'}
                onClick={(e) => {
                  if (!promptLimit.allowed) {
                    e.preventDefault();
                    alert(`You've reached your plan's limit of ${promptLimit.limit} prompts. ${promptLimit.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : 'Please delete some prompts to add new ones.'}`);
                    return;
                  }
                }}
                className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium shadow-lg ${
                  promptLimit.allowed
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                Add New Prompt {!promptLimit.allowed && `(${promptLimit.current}/${promptLimit.limit})`}
              </a>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Active Prompts</span>
            </div>
            <p className="text-4xl font-bold mb-1">{activePrompts}</p>
            <p className="text-sm opacity-90">{promptLimit.current} of {promptLimit.limit} prompts used</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Brand Coverage</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.brandCoverage}%</p>
            <p className="text-sm opacity-90">Across prompts</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Avg Sentiment</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.avgSentiment}%</p>
            <p className="text-sm opacity-90">Positive score</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total Analyses</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.totalExecutions}</p>
            <p className="text-sm opacity-90">Completed runs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Prompts</h2>
              <p className="text-sm text-slate-600 mt-1">Track and manage all your monitored queries</p>
            </div>
            {prompts.length > 0 && (
              <div className="flex items-center gap-3">
                {selectedPrompts.length > 0 && (
                  <>
                    <span className="text-sm text-slate-600">{selectedPrompts.length} selected</span>
                    <button
                      onClick={handleBulkRun}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all flex items-center gap-2 font-medium shadow"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Run Selected
                    </button>
                  </>
                )}
                <button
                  onClick={selectAllPrompts}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 font-medium"
                >
                  {selectedPrompts.length === prompts.length ? (
                    <>
                      <X className="w-4 h-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Select All
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {prompts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No prompts yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Create your first prompt to start monitoring your brand visibility across AI platforms
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg"
              >
                Create First Prompt
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-2 w-12"></th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Query Text</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Platform</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Update Frequency</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Brand Mentioned</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Sentiment</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Last Run</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((prompt) => {
                    const latestExecution = prompt.latestExecution;

                    let brandMentioned = false;
                    let sentimentLabel = 'No data';
                    let sentimentColor = 'bg-slate-100 text-slate-600';
                    let dotColor = 'bg-slate-400';

                    if (latestExecution?.ai_response) {
                      try {
                        const response = typeof latestExecution.ai_response === 'string'
                          ? JSON.parse(latestExecution.ai_response)
                          : latestExecution.ai_response;

                        if (response?.brandAndCompetitorMentions && profile?.brand_name) {
                          const mentions = response.brandAndCompetitorMentions;
                          brandMentioned = (mentions[profile.brand_name] || 0) > 0;
                        }
                      } catch (e) {
                        // Skip invalid JSON
                      }
                    }

                    // Get sentiment from sentiment_analysis table
                    if (prompt.sentiment) {
                      const pos = parseFloat(prompt.sentiment.positive_percentage) || 0;
                      const neu = parseFloat(prompt.sentiment.neutral_percentage) || 0;
                      const neg = parseFloat(prompt.sentiment.negative_percentage) || 0;

                      if (pos >= neu && pos >= neg) {
                        sentimentLabel = `Positive ${Math.round(pos)}%`;
                        sentimentColor = 'bg-green-100 text-green-700';
                        dotColor = 'bg-green-500';
                      } else if (neu >= pos && neu >= neg) {
                        sentimentLabel = `Neutral ${Math.round(neu)}%`;
                        sentimentColor = 'bg-slate-100 text-slate-600';
                        dotColor = 'bg-slate-400';
                      } else {
                        sentimentLabel = `Negative ${Math.round(neg)}%`;
                        sentimentColor = 'bg-red-100 text-red-700';
                        dotColor = 'bg-red-500';
                      }
                    }

                    const hasProcessing = (prompt.allExecutions || []).some((e: any) => e.status === 'processing');
                    const rowClass = hasProcessing
                      ? "border-b border-slate-100 bg-blue-50 hover:bg-blue-100 transition-colors group"
                      : "border-b border-slate-100 hover:bg-slate-50 transition-colors group";

                    return (
                      <tr key={prompt.id} className={rowClass}>
                        <td className="py-4 px-2">
                          <input
                            type="checkbox"
                            checked={selectedPrompts.includes(prompt.id)}
                            onChange={() => togglePromptSelection(prompt.id)}
                            disabled={hasProcessing}
                            className={`w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 ${
                              hasProcessing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActive(prompt)}
                            disabled={hasProcessing}
                            className={`w-10 h-6 rounded-full transition-all ${
                              hasProcessing
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            } ${
                              prompt.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={hasProcessing ? "Cannot toggle while processing" : "Toggle active status"}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full transition-all ${
                                prompt.is_active ? 'ml-5' : 'ml-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-4 px-4 max-w-md">
                          {latestExecution ? (
                            <a
                              href={`/execution/${latestExecution.id}`}
                              className="text-slate-900 hover:text-blue-600 transition-colors font-medium line-clamp-2 block"
                            >
                              {prompt.text}
                            </a>
                          ) : (
                            <p className="text-slate-900 font-medium line-clamp-2">{prompt.text}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                            {prompt.platform || 'all'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700 capitalize">{prompt.frequency}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const allExecs = prompt.allExecutions || [];
                            const completedExecs = allExecs.filter((e: any) => e.status === 'completed');
                            const processingExecs = allExecs.filter((e: any) => e.status === 'processing');

                            if (processingExecs.length > 0 && completedExecs.length === 0) {
                              return (
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                                  Processing
                                </span>
                              );
                            }

                            if (completedExecs.length === 0) {
                              return <span className="text-sm text-slate-400">—</span>;
                            }

                            const platformLetters: Record<string, string> = {
                              'gemini': 'G',
                              'chatgpt': 'C',
                              'perplexity': 'P',
                              'ai-overview': 'A'
                            };

                            const platformNames: Record<string, string> = {
                              'gemini': 'Gemini',
                              'chatgpt': 'ChatGPT',
                              'perplexity': 'Perplexity',
                              'ai-overview': 'AI Overview'
                            };

                            const brandMentionsMap = (prompt as any).brandMentionsByPlatform || {};
                            const mentionedPlatforms = Object.keys(brandMentionsMap).filter(
                              platform => brandMentionsMap[platform].length > 0
                            );

                            if (mentionedPlatforms.length === 0) {
                              return (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                  <X className="w-4 h-4" />
                                  No
                                </span>
                              );
                            }

                            return (
                              <div className="flex items-center justify-center gap-1">
                                {mentionedPlatforms.map((platform) => (
                                  <span
                                    key={platform}
                                    title={`Brand mentioned in ${platformNames[platform]}`}
                                    className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors cursor-help"
                                  >
                                    {platformLetters[platform]}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${sentimentColor}`}>
                            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                            {sentimentLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {prompt.last_triggered_at ? (
                            <span className="text-sm text-slate-600">
                              {new Date(prompt.last_triggered_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">Never</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => triggerPrompt(prompt.id)}
                              disabled={hasProcessing}
                              className={`p-2 text-white rounded-lg transition-colors ${
                                hasProcessing
                                  ? 'bg-slate-300 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                              title={hasProcessing ? "Analysis in progress" : "Run analysis"}
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(prompt)}
                              disabled={hasProcessing}
                              className={`p-2 rounded-lg transition-colors ${
                                hasProcessing
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title={hasProcessing ? "Cannot edit while processing" : "Edit"}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prompt.id)}
                              disabled={hasProcessing}
                              className={`p-2 rounded-lg transition-colors ${
                                hasProcessing
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={hasProcessing ? "Cannot delete while processing" : "Delete"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-scale-in">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingPrompt ? 'Edit Prompt' : isBulkMode ? 'Bulk Upload Prompts' : 'Create New Prompt'}
              </h2>

              <div className="space-y-6">
                {isBulkMode ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Prompts (one per line)
                    </label>
                    <textarea
                      value={bulkPromptText}
                      onChange={(e) => setBulkPromptText(e.target.value)}
                      placeholder="What are the best tax software for freelancers in India?&#10;Best AI tools to understand tax returns&#10;Most accurate tax filing software with live CPA support"
                      rows={8}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Add one prompt per line. Each will be created as a separate query.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Prompt Text
                    </label>
                    <textarea
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      placeholder="e.g., What are the best tax software for freelancers in India?"
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Be specific and natural - this is how users would ask AI platforms
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Platform{isBulkMode ? 's' : ''}
                  </label>
                  {isBulkMode ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'gemini', label: 'Gemini', color: 'emerald' },
                          { value: 'chatgpt', label: 'ChatGPT', color: 'green' },
                          { value: 'perplexity', label: 'Perplexity', color: 'blue' },
                          { value: 'ai-overview', label: 'AI Overview', color: 'purple' },
                        ].map((platform) => (
                          <label
                            key={platform.value}
                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              bulkPlatforms.includes(platform.value)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={bulkPlatforms.includes(platform.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkPlatforms([...bulkPlatforms, platform.value]);
                                } else {
                                  setBulkPlatforms(bulkPlatforms.filter(p => p !== platform.value));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium text-slate-900">{platform.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        Each prompt will be created for all selected platforms ({bulkPlatforms.length} selected)
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={newPromptPlatform}
                        onChange={(e) => setNewPromptPlatform(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="gemini">Gemini</option>
                        <option value="chatgpt">ChatGPT</option>
                        <option value="perplexity">Perplexity</option>
                        <option value="ai-overview">AI Overview</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">
                        Select which AI platform to analyze this prompt on
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Update Frequency
                  </label>
                  <select
                    value={newPromptFrequency}
                    onChange={(e) => setNewPromptFrequency(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="daily">Daily - Run every day</option>
                    <option value="weekly">Weekly - Run once a week</option>
                    <option value="monthly">Monthly - Run once a month</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    How often should we analyze {isBulkMode ? 'these prompts' : 'this prompt'} across AI platforms?
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingPrompt(null);
                      setNewPromptText('');
                      setBulkPromptText('');
                      setNewPromptFrequency('weekly');
                      setNewPromptPlatform('gemini');
                      setIsBulkMode(false);
                    }}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isBulkMode ? handleBulkUpload : handleCreateOrUpdate}
                    disabled={isBulkMode ? !bulkPromptText.trim() : !newPromptText.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingPrompt ? 'Update Prompt' : isBulkMode ? 'Upload Prompts' : 'Create Prompt'}
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
