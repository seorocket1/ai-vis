import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Target,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Shield,
  Crown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [queryLimit, setQueryLimit] = useState(5);

  useEffect(() => {
    if (user) {
      loadUserPlan();
    }
  }, [user]);

  const loadUserPlan = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, queries_used_this_month, monthly_query_limit')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Could not load subscription info:', error);
        setUserPlan('free');
        setQueriesUsed(0);
        setQueryLimit(5);
        return;
      }

      if (data) {
        setUserPlan(data.subscription_plan || 'free');
        setQueriesUsed(data.queries_used_this_month || 0);
        setQueryLimit(data.monthly_query_limit || 5);
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      setUserPlan('free');
      setQueriesUsed(0);
      setQueryLimit(5);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  };

  const baseMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', id: 'dashboard' },
    { icon: Target, label: 'Prompts', href: '/prompts', id: 'prompts' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics', id: 'analytics' },
    { icon: Globe, label: 'Sources', href: '/sources', id: 'sources' },
    { icon: Users, label: 'Competitor Analysis', href: '/competitor-analysis', id: 'competitor-analysis' },
    { icon: Settings, label: 'Settings', href: '/settings', id: 'settings' },
  ];

  const platformMenuItems = [
    { label: 'Google Gemini', href: '/platforms/gemini', id: 'platform-gemini', color: 'emerald' },
    { label: 'ChatGPT', href: '/platforms/chatgpt', id: 'platform-chatgpt', color: 'green' },
    { label: 'Perplexity AI', href: '/platforms/perplexity', id: 'platform-perplexity', color: 'blue' },
    { label: 'AI Overview', href: '/platforms/ai-overview', id: 'platform-ai-overview', color: 'purple' },
  ];

  const adminMenuItem = { icon: Shield, label: 'Admin', href: '/admin', id: 'admin' };

  const menuItems = isAdmin ? [...baseMenuItems, adminMenuItem] : baseMenuItems;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">BrandTracker</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 transition-transform duration-300 z-50 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">BrandTracker</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <nav className="space-y-1 pb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </a>
              );
            })}

            {/* AI Platforms Dropdown */}
            <div>
              <button
                onClick={() => setPlatformsOpen(!platformsOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all w-full ${
                  currentPage === 'ai-platforms'
                    ? 'bg-purple-50 text-purple-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Platforms</span>
                </div>
                {platformsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {platformsOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-4">
                  {platformMenuItems.map((platform) => {
                    const isActive = currentPage === platform.id;
                    return (
                      <a
                        key={platform.id}
                        href={platform.href}
                        className={`block px-4 py-2 text-sm rounded-lg transition-all ${
                          isActive
                            ? `bg-${platform.color}-50 text-${platform.color}-600 font-medium`
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {platform.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="flex-shrink-0 p-6 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-slate-700">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {userPlan === 'pro' && <Crown className="w-3 h-3 text-yellow-500" />}
                  <p className={`text-xs ${userPlan === 'pro' ? 'text-yellow-600 font-medium' : 'text-slate-500'}`}>
                    {userPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                </div>
                {isAdmin && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {queriesUsed}/{queryLimit} queries
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
