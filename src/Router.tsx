import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Prompts from './pages/Prompts';
import TriggerPrompt from './pages/TriggerPrompt';
import ExecutionDetail from './pages/ExecutionDetail';
import Analytics from './pages/Analytics';
import Competitors from './pages/Competitors';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
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
    return <Onboarding />;
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

  if (currentPath === '/competitors') {
    return (
      <ProtectedRoute>
        <Competitors />
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

  if (currentPath === '/') {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/signin';
    }
    return null;
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
