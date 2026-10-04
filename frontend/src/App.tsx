import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ChatPage } from './components/chat/ChatPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { DiaryPage } from './pages/DiaryPage';
import { DayPage } from './pages/DayPage';
import { AuthPage } from './pages/AuthPage';
import { useAppStore } from './stores/useAppStore';
import { PWAUpdater } from './components/PWAUpdater';
import { LogoMark } from './components/brand/Logo';

// Pantalla de carga mientras se revisa si hay sesión: mismo fondo papel que la app.
function LoadingSplash() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-paper text-ink">
      <LogoMark size={88} />
      <span className="font-num text-[26px] font-extrabold uppercase tracking-[.03em]">FitnessChat</span>
      <span className="mt-2.5 h-1 w-[120px] overflow-hidden rounded bg-line" role="progressbar" aria-label="Cargando">
        <span className="block h-full w-2/5 animate-[loadslide_1.1s_ease-in-out_infinite] rounded bg-ink" />
      </span>
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
            <Route path="sessions" element={<DiaryPage />} />
            <Route path="sessions/:date" element={<DayPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <PWAUpdater />
    </>
  );
}

export default App;
