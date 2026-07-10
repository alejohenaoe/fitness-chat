import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ChatPage } from './components/chat/ChatPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { useAppStore } from './stores/useAppStore';
import { PWAUpdater } from './components/PWAUpdater';

function LoadingSplash() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-gradient-to-br from-surface-900 to-surface-950">
      <div className="flex flex-col items-center gap-5">
        <img
          src="/fitnesschat-logo.png"
          alt="FitnessChat"
          className="h-16 w-16 animate-pulse"
        />
        <div className="h-6 w-6 animate-spin rounded-full border-3 border-brand-500/20 border-t-brand-500" />
      </div>
    </div>
  );
}

function App() {
  const { user, initialized, initAuth } = useAppStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (!initialized) return <LoadingSplash />;
  if (!user) return <AuthPage />;

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<ChatPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <PWAUpdater />
    </>
  );
}

export default App;
