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
  const [newPromptPlatform, setNewPromptPlatform] = useState('all');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkPromptText, setBulkPromptText] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
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

  const loadData = async () => {
    if (!user) return;

    const [promptsResult, profileResult, metricsResult, executionsResult] = await Promise.all([
      supabase.from('prompts').select('*, prompt_executions(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('aggregated_metrics').select('*').eq('user_id', user.id).eq('time_period', 'all').maybeSingle(),
      supabase.from('prompt_executions').select('id').eq('user_id', user.id).eq('status', 'completed')
    ]);

    const promptsWithExecution = (promptsResult.data || []).map(prompt => {
      const completedExec = (prompt.prompt_executions || []).find((e: any) => e.status === 'completed');
      return {
        ...prompt,
        latestExecution: completedExec
      };
    });

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
    setNewPromptPlatform('all');
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
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId }),
      });

      if (!response.ok) {
        console.error('Failed to trigger analysis');
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
    }
  };

  const handleBulkUpload = async () => {
    if (!user || !bulkPromptText.trim()) return;

    const lines = bulkPromptText.split('\n').filter(line => line.trim());

    if (promptLimit.current + lines.length > promptLimit.limit) {
      alert(`Cannot add ${lines.length} prompts. You have ${promptLimit.current}/${promptLimit.limit} prompts. ${promptLimit.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : `You can only add ${promptLimit.limit - promptLimit.current} more.`}`);
      return;
    }

    const promptsToInsert = lines.map(line => ({
      user_id: user.id,
      text: line.trim(),
      frequency: newPromptFrequency,
      platform: newPromptPlatform,
      is_active: true,
    }));

    const { data, error } = await supabase.from('prompts').insert(promptsToInsert).select();

    if (error) {
      console.error('Error bulk uploading prompts:', error);
      alert(`Failed to upload prompts: ${error.message}`);
      return;
    }

    // Auto-trigger analysis for all new prompts
    if (data) {
      for (const prompt of data) {
        triggerSinglePrompt(prompt.id);
      }
    }

    setShowModal(false);
    setBulkPromptText('');
    setIsBulkMode(false);
    loadData();
  };

  const handleBulkRun = async () => {
    if (selectedPrompts.length === 0) {
      alert('Please select at least one prompt to run');
      return;
    }

    const confirmed = confirm(`Run analysis for ${selectedPrompts.length} selected prompt(s)?`);
    if (!confirmed) return;

    for (const promptId of selectedPrompts) {
      await triggerSinglePrompt(promptId);
    }

    setSelectedPrompts([]);
    alert(`Triggered analysis for ${selectedPrompts.length} prompt(s)!`);
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
                  setNewPromptPlatform('all');
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
              <button
                onClick={() => {
                  if (!promptLimit.allowed) {
                    alert(`You've reached your plan's limit of ${promptLimit.limit} prompts. ${promptLimit.limit === 5 ? 'Upgrade to Pro for 50 prompts!' : 'Please delete some prompts to add new ones.'}`);
                    return;
                  }
                  setEditingPrompt(null);
                  setNewPromptText('');
                  setNewPromptFrequency('weekly');
                  setNewPromptPlatform('all');
                  setIsBulkMode(false);
                  setShowModal(true);
                }}
                disabled={!promptLimit.allowed}
                className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium shadow-lg ${
                  promptLimit.allowed
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                Add New Prompt {!promptLimit.allowed && `(${promptLimit.current}/${promptLimit.limit})`}
              </button>
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

                        if (response?.overallSentiment) {
                          const sentiment = response.overallSentiment;
                          const parsePercent = (val: string) => parseFloat(val.replace('%', '')) || 0;
                          const pos = parsePercent(sentiment.Positive);
                          const neu = parsePercent(sentiment.Neutral);
                          const neg = parsePercent(sentiment.Negative);

                          if (pos >= neu && pos >= neg) {
                            sentimentLabel = 'Positive';
                            sentimentColor = 'bg-green-100 text-green-700';
                            dotColor = 'bg-green-500';
                          } else if (neu >= pos && neu >= neg) {
                            sentimentLabel = 'Neutral';
                            sentimentColor = 'bg-slate-100 text-slate-600';
                            dotColor = 'bg-slate-400';
                          } else {
                            sentimentLabel = 'Negative';
                            sentimentColor = 'bg-red-100 text-red-700';
                            dotColor = 'bg-red-500';
                          }
                        }
                      } catch (e) {
                        // Skip invalid JSON
                      }
                    }

                    return (
                      <tr key={prompt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-2">
                          <input
                            type="checkbox"
                            checked={selectedPrompts.includes(prompt.id)}
                            onChange={() => togglePromptSelection(prompt.id)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActive(prompt)}
                            className={`w-10 h-6 rounded-full transition-all ${
                              prompt.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
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
                          {latestExecution ? (
                            brandMentioned ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                <X className="w-4 h-4" />
                                No
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
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
                              className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                              title="Run analysis"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(prompt)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prompt.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
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
                    Target Platform
                  </label>
                  <select
                    value={newPromptPlatform}
                    onChange={(e) => setNewPromptPlatform(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Platforms</option>
                    <option value="perplexity">Perplexity</option>
                    <option value="chatgpt">ChatGPT</option>
                    <option value="gemini">Gemini</option>
                    <option value="claude">Claude</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    Select which AI platform to analyze this prompt on
                  </p>
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
                      setNewPromptPlatform('all');
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
