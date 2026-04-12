import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

const SplashScreen = lazy(() => import('./pages/SplashScreen'));
const AuthScreen = lazy(() => import('./pages/AuthScreen'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EncryptTool = lazy(() => import('./pages/EncryptTool'));
const VaultScreen = lazy(() => import('./pages/VaultScreen'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050D1A' }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// M7: OAuth handler — only fires on mount if URL contains OAuth hash tokens
function OAuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run if URL contains OAuth tokens
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });
  }, []); // Empty deps — only runs on mount

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <OAuthRedirectHandler />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/auth" element={<PublicRoute><AuthScreen /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/encrypt" element={<ProtectedRoute><EncryptTool /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><VaultScreen /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
