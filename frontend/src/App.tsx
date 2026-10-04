import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ChatPage } from './components/chat/ChatPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { SessionsPage } from './pages/SessionsPage';
import { AuthPage } from './pages/AuthPage';
import { useAppStore } from './stores/useAppStore';
import { PWAUpdater } from './components/PWAUpdater';

function LoadingSplash() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-5">
        <img
          src="/fitnesschat-logo.png"
          alt="FitnessChat"
          className="h-16 w-16 animate-pulse"
        />
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-line border-t-ink" />
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
            <Route path="history" element={<Navigate to="/progress?periodo=semana" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="sessions" element={<SessionsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <PWAUpdater />
    </>
  );
}

export default App;
