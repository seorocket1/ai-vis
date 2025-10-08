import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Globe, Target, Users, Sparkles } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [prompt, setPrompt] = useState('');

  const handleCompetitorChange = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const handleNext = () => {
    if (step === 1 && (!websiteUrl || !brandName)) {
      setError('Please fill in all fields');
      return;
    }
    if (step === 2 && competitors.filter(c => c.trim()).length === 0) {
      setError('Please add at least one competitor');
      return;
    }
    if (step === 3 && !prompt.trim()) {
      setError('Please add at least one prompt to monitor');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            website_url: websiteUrl,
            brand_name: brandName,
            onboarding_completed: true,
          });

        if (insertError) throw insertError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            website_url: websiteUrl,
            brand_name: brandName,
            onboarding_completed: true,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      const competitorData = competitors
        .filter(c => c.trim())
        .map(name => ({
          user_id: user.id,
          name: name.trim(),
        }));

      if (competitorData.length > 0) {
        const { error: competitorError } = await supabase
          .from('competitors')
          .insert(competitorData);

        if (competitorError) throw competitorError;
      }

      if (prompt.trim()) {
        const { error: promptError } = await supabase
          .from('prompts')
          .insert({
            user_id: user.id,
            text: prompt.trim(),
            is_active: true,
            frequency: 'weekly',
          });

        if (promptError) throw promptError;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-all ${
                        step > s ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-xl mb-4">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Tell us about your brand
                </h2>
                <p className="text-slate-600">
                  We'll use this information to track your online presence
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your Brand"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-green-100 rounded-xl mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Who are your competitors?
                </h2>
                <p className="text-slate-600">
                  Add up to 3 competitors to compare your brand against
                </p>
              </div>

              {competitors.map((competitor, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Competitor {index + 1} {index === 0 && '(Required)'}
                  </label>
                  <input
                    type="text"
                    value={competitor}
                    onChange={(e) => handleCompetitorChange(index, e.target.value)}
                    placeholder={`Competitor ${index + 1} name`}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              ))}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-amber-100 rounded-xl mb-4">
                  <Sparkles className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Create your first prompt
                </h2>
                <p className="text-slate-600">
                  Add a search query to monitor your brand mentions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Monitoring Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., best project management tools for startups"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                />
                <p className="mt-2 text-sm text-slate-500">
                  This prompt will be used to track mentions across AI platforms
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
