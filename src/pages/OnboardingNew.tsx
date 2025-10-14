import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '../lib/config';
import { Globe, Sparkles, Play, Check, Loader, MapPin } from 'lucide-react';

export default function OnboardingNew() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Brand details
  const [brandName, setBrandName] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('India');

  // Step 2: Generated prompts
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<{[key: number]: boolean}>({});
  const [editedPrompts, setEditedPrompts] = useState<{[key: number]: string}>({});

  // Step 3: Analysis results
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const countries = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Singapore', 'Japan', 'Other'
  ];

  const generatePrompts = async () => {
    if (!user) return;

    setGeneratingPrompts(true);
    setError('');

    try {
      // Check how many prompts the user already has
      const { count: existingPromptCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const currentPrompts = existingPromptCount || 0;
      const maxPrompts = 5; // Free plan limit
      const availableSlots = Math.max(0, maxPrompts - currentPrompts);

      if (availableSlots === 0) {
        setError(`You've already created ${maxPrompts} prompts. Please delete some prompts or upgrade to Pro for 50 prompts.`);
        setGeneratingPrompts(false);
        return;
      }

      // Generate template-based prompts
      const industry = extractIndustry(website);
      const allPrompts = [
        `What are the best ${industry} services in ${location}?`,
        `${brandName} vs competitors: which is better?`,
        `How does ${brandName} compare to other ${industry} providers?`,
        `Best ${industry} tools for small businesses in ${location}`,
        `${brandName} review: is it worth it in ${new Date().getFullYear()}?`,
      ];

      // Only show prompts up to available slots
      const prompts = allPrompts.slice(0, availableSlots);
      setSuggestedPrompts(prompts);

      // Pre-select all prompts
      const selected: {[key: number]: boolean} = {};
      prompts.forEach((_, idx) => {
        selected[idx] = true;
      });
      setSelectedPrompts(selected);

      if (availableSlots < 5) {
        setError(`Note: You can only add ${availableSlots} more prompt${availableSlots !== 1 ? 's' : ''} on the free plan. Upgrade to Pro for 50 prompts!`);
      }

      setGeneratingPrompts(false);
      setStep(2);
    } catch (err) {
      console.error('Generate prompts error:', err);
      setError('Failed to generate prompts');
      setGeneratingPrompts(false);
    }
  };

  const extractIndustry = (url: string): string => {
    const keywords = ['software', 'tax', 'accounting', 'marketing', 'design', 'consulting'];
    for (const keyword of keywords) {
      if (url.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }
    return 'service';
  };

  const handlePromptToggle = (index: number) => {
    setSelectedPrompts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handlePromptEdit = (index: number, value: string) => {
    setEditedPrompts(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const saveAndRunAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Save profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          website_url: website,
          brand_name: brandName,
          location: location,
          onboarding_completed: true,
        });
      } else {
        await supabase.from('profiles').update({
          website_url: website,
          brand_name: brandName,
          location: location,
          onboarding_completed: true,
        }).eq('id', user.id);
      }

      // Save selected prompts
      const promptsToInsert = Object.entries(selectedPrompts)
        .filter(([_, isSelected]) => isSelected)
        .map(([indexStr, _]) => {
          const index = parseInt(indexStr);
          const text = editedPrompts[index] || suggestedPrompts[index];
          return {
            user_id: user.id,
            text,
            is_active: true,
            frequency: 'weekly',
            platform: 'all',
          };
        });

      if (promptsToInsert.length === 0) {
        setError('Please select at least one prompt');
        setLoading(false);
        return;
      }

      const { data: insertedPrompts, error: promptError } = await supabase
        .from('prompts')
        .insert(promptsToInsert)
        .select();

      if (promptError) {
        console.error('Prompt insertion error:', promptError);
        if (promptError.message?.includes('Prompt limit exceeded')) {
          setError('You\'ve reached your prompt limit. Please delete some existing prompts or upgrade to Pro for 50 prompts.');
        } else {
          setError(`Failed to save prompts: ${promptError.message}`);
        }
        setLoading(false);
        return;
      }

      // Trigger analysis in background (don't wait for it)
      if (insertedPrompts) {
        insertedPrompts.forEach(prompt => {
          fetch(`${supabaseUrl}/functions/v1/trigger-analysis`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ promptId: prompt.id }),
          }).catch(e => {
            console.error('Failed to trigger analysis:', e);
          });
        });
      }

      // Redirect immediately to dashboard
      setLoading(false);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Failed to complete setup. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                        step >= s
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {step > s ? <Check className="w-6 h-6" /> : s}
                    </div>
                  </div>
                  {s < 2 && (
                    <div
                      className={`w-32 h-1 mx-4 transition-all ${
                        step > s ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-40 max-w-md mx-auto mt-3 text-xs font-medium">
              <span className={step >= 1 ? 'text-blue-600' : 'text-slate-500'}>Brand Info</span>
              <span className={step >= 2 ? 'text-blue-600' : 'text-slate-500'}>Review Prompts</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Brand Information */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-blue-100 rounded-2xl mb-4">
                  <Globe className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Set up your first workspace
                </h2>
                <p className="text-slate-600 text-lg">
                  Enter your client's details
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Customer brand name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="taxbuddy"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Customer website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="taxbuddy.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Default Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={generatePrompts}
                disabled={!brandName.trim() || !website.trim() || generatingPrompts}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatingPrompts ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating prompts...
                  </>
                ) : (
                  <>
                    Next step
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Review Prompts */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-emerald-100 rounded-2xl mb-4">
                  <Sparkles className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Review your prompts
                </h2>
                <p className="text-slate-600 text-lg">
                  You can always add more prompts and customize them later in your workspace
                </p>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-slate-700">Suggested prompts:</p>
                {suggestedPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      selectedPrompts[index]
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPrompts[index] || false}
                        onChange={() => handlePromptToggle(index)}
                        className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                            {location}
                          </span>
                        </div>
                        <textarea
                          value={editedPrompts[index] !== undefined ? editedPrompts[index] : prompt}
                          onChange={(e) => handlePromptEdit(index, e.target.value)}
                          disabled={!selectedPrompts[index]}
                          className="w-full text-slate-800 bg-transparent border-none focus:ring-0 p-0 resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={saveAndRunAnalysis}
                  disabled={loading || Object.values(selectedPrompts).filter(Boolean).length === 0}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Next step
                      <Play className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
