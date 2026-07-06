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

function App() {
  const { user, initialized, initAuth } = useAppStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (!initialized) return null;
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
