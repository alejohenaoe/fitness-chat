import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterFlow } from '../components/auth/RegisterFlow';
import { AuthShowcase } from '../components/auth/AuthShowcase';

export const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="flex min-h-dvh bg-paper text-ink lg:grid lg:h-dvh lg:grid-cols-2">
      <div className="flex w-full flex-col lg:overflow-y-auto lg:px-12 lg:py-10 lg:[justify-content:safe_center]">
        {mode === 'login'
          ? <LoginForm onRegister={() => setMode('register')} />
          : <RegisterFlow onLogin={() => setMode('login')} />}
      </div>
      <AuthShowcase />
    </div>
  );
};
