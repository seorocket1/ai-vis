import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, CreditCard as Edit2, Trash2, X } from 'lucide-react';

interface Prompt {
  id: string;
  text: string;
  is_active: boolean;
  frequency: string;
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
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ brandCoverage: 0, avgSentiment: 0 });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [promptsResult, profileResult, metricsResult] = await Promise.all([
      supabase.from('prompts').select('*, prompt_executions(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('aggregated_metrics').select('*').eq('user_id', user.id).eq('time_period', 'all').maybeSingle()
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

    const metrics = metricsResult.data;
    setStats({
      brandCoverage: Math.round(metrics?.avg_brand_visibility || 0),
      avgSentiment: Math.round(metrics?.avg_positive_sentiment || 0)
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
      await supabase.from('prompts').insert({
        user_id: user.id,
        text: newPromptText,
        frequency: newPromptFrequency,
        is_active: true,
      });
    }

    setShowModal(false);
    setNewPromptText('');
    setNewPromptFrequency('weekly');
    setEditingPrompt(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      await supabase.from('prompts').delete().eq('id', id);
      loadData();
    }
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

  if (loading) {
    return (
      <DashboardLayout currentPage="prompts">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const activePrompts = prompts.filter(p => p.is_active).length;

  return (
    <DashboardLayout currentPage="prompts">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tracked Queries</h1>
          <p className="text-slate-600">Manage prompts to monitor brand mentions across AI platforms.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Total active prompts</p>
            <p className="text-4xl font-bold text-slate-900 mb-3">{activePrompts}</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(activePrompts * 16.67, 100)}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Brand coverage across prompts</p>
            <p className="text-4xl font-bold text-slate-900 mb-3">{stats.brandCoverage}%</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.brandCoverage}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Avg positive sentiment</p>
            <p className="text-4xl font-bold text-slate-900 mb-3">{stats.avgSentiment}%</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.avgSentiment}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Prompt list</h2>
              <p className="text-sm text-slate-600">Card + table hybrid with actions</p>
            </div>
            <button
              onClick={() => {
                setEditingPrompt(null);
                setNewPromptText('');
                setNewPromptFrequency('weekly');
                setShowModal(true);
              }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add New Prompt
            </button>
          </div>

          {prompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">No prompts yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Create First Prompt
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Query text</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Brand mentioned</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Sentiment</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
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
                      <tr key={prompt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          {latestExecution ? (
                            <a
                              href={`/execution/${latestExecution.id}`}
                              className="text-slate-900 hover:text-blue-600 transition-colors font-medium"
                            >
                              {prompt.text}
                            </a>
                          ) : (
                            <p className="text-slate-900">{prompt.text}</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {brandMentioned ? (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Yes
                            </span>
                          ) : (
                            <button className="p-1 hover:bg-slate-100 rounded">
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${sentimentColor}`}>
                            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                            {sentimentLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(prompt)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => triggerPrompt(prompt.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Run analysis"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prompt Text
                  </label>
                  <textarea
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="e.g., best tax software for freelancers"
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={newPromptFrequency}
                    onChange={(e) => setNewPromptFrequency(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingPrompt(null);
                      setNewPromptText('');
                      setNewPromptFrequency('weekly');
                    }}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrUpdate}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    {editingPrompt ? 'Update' : 'Create'}
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