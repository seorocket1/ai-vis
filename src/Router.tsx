import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OnboardingNew from './pages/OnboardingNew';
import Dashboard from './pages/Dashboard';
import Prompts from './pages/Prompts';
import TriggerPrompt from './pages/TriggerPrompt';
import NewPrompt from './pages/NewPrompt';
import ExecutionDetail from './pages/ExecutionDetail';
import Analytics from './pages/Analytics';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';
import GeminiAnalytics from './pages/GeminiAnalytics';
import ChatGPTAnalytics from './pages/ChatGPTAnalytics';
import PerplexityAnalytics from './pages/PerplexityAnalytics';
import AIOverviewAnalytics from './pages/AIOverviewAnalytics';
import Sources from './pages/Sources';
import ProtectedRoute from './components/ProtectedRoute';

export default function Router() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPath === '/') {
    return <Landing />;
  }

  if (currentPath === '/privacy') {
    return <Privacy />;
  }

  if (currentPath === '/terms') {
    return <Terms />;
  }

  if (currentPath === '/security') {
    return <Security />;
  }

  if (!user && currentPath !== '/signup' && currentPath !== '/signin') {
    window.location.href = '/signin';
    return null;
  }

  if (currentPath === '/signin') {
    return <SignIn />;
  }

  if (currentPath === '/signup') {
    return <SignUp />;
  }

  if (currentPath === '/onboarding') {
    return <OnboardingNew />;
  }

  if (currentPath === '/dashboard') {
    return (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/prompts') {
    return (
      <ProtectedRoute>
        <Prompts />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/prompts/new') {
    return (
      <ProtectedRoute>
        <NewPrompt />
      </ProtectedRoute>
    );
  }

  if (currentPath.startsWith('/trigger/')) {
    return (
      <ProtectedRoute>
        <TriggerPrompt />
      </ProtectedRoute>
    );
  }

  if (currentPath.startsWith('/execution/')) {
    return (
      <ProtectedRoute>
        <ExecutionDetail />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/analytics') {
    return (
      <ProtectedRoute>
        <Analytics />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/competitor-analysis') {
    return (
      <ProtectedRoute>
        <CompetitorAnalysis />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/settings') {
    return (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/admin') {
    return (
      <ProtectedRoute>
        <Admin />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/platforms/gemini') {
    return (
      <ProtectedRoute>
        <GeminiAnalytics />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/platforms/chatgpt') {
    return (
      <ProtectedRoute>
        <ChatGPTAnalytics />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/platforms/perplexity') {
    return (
      <ProtectedRoute>
        <PerplexityAnalytics />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/platforms/ai-overview') {
    return (
      <ProtectedRoute>
        <AIOverviewAnalytics />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/sources') {
    return (
      <ProtectedRoute>
        <Sources />
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-slate-600 mb-6">Page not found</p>
        <a
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
