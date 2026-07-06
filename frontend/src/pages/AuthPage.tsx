import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { Sparkles, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.coerce.number().min(12).max(100),
  gender: z.enum(['male', 'female', 'other', 'default']),
  weight_kg: z.coerce.number().min(30).max(300),
  height_cm: z.coerce.number().min(50).max(300),
  goal: z.enum(['weight_loss', 'muscle_gain', 'body_recomposition', 'maintenance', 'athletic_performance', 'default']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active', 'default']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

const inputCls = 'w-full rounded-xl bg-surface-800 px-3.5 py-2.5 text-sm text-surface-50 placeholder:text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-500/40 border border-[#E5E7EB]';
const selectCls = 'w-full rounded-xl bg-surface-800 px-3.5 py-2.5 text-sm text-surface-50 focus:outline-none focus:ring-1 focus:ring-brand-500/40 border border-[#E5E7EB] appearance-none';

export const AuthPage = () => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const setAuth = useAppStore((set) => set.setAuth);
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gender: 'default', goal: 'default', activity_level: 'default' },
  });
  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const handleRegister = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/', values);
      setAuth(data.user, data.access, data.refresh);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/', values);
      setAuth(data.user, data.access, data.refresh);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left branding panel - desktop only */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-surface-900">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-surface-50">FitnessChat</h1>
        <p className="max-w-xs text-center text-sm text-surface-100">
          Tu asistente de nutrición personal con IA.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile logo */}
          <div className="mb-2 flex flex-col items-center gap-1 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-50">FitnessChat</span>
            <span className="text-sm text-surface-100">Tu asistente de nutrición personal</span>
          </div>

          {/* Toggle tabs */}
          <div className="flex rounded-xl bg-surface-900 p-1">
            <button
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${mode === 'register' ? 'bg-brand-500 text-white' : 'text-surface-100 hover:text-surface-50'}`}
              onClick={() => setMode('register')}
              type="button"
            >
              Crear cuenta
            </button>
            <button
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${mode === 'login' ? 'bg-brand-500 text-white' : 'text-surface-100 hover:text-surface-50'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Iniciar sesión
            </button>
          </div>

          {mode === 'register' ? (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <input aria-label="name" {...registerForm.register('name')} placeholder="Nombre" className={inputCls} />
              <input aria-label="email" {...registerForm.register('email')} placeholder="Email" className={inputCls} />
              <input aria-label="password" type="password" {...registerForm.register('password')} placeholder="Contraseña" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="age" type="number" {...registerForm.register('age')} placeholder="Edad" className={inputCls} />
                <select aria-label="gender" {...registerForm.register('gender')} className={selectCls}>
                  <option value="default" disabled>Género</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="weight_kg" type="number" step="0.1" {...registerForm.register('weight_kg')} placeholder="Peso (kg)" className={inputCls} />
                <input aria-label="height_cm" type="number" step="0.1" {...registerForm.register('height_cm')} placeholder="Estatura (cm)" className={inputCls} />
              </div>
              <select aria-label="goal" {...registerForm.register('goal')} className={selectCls}>
                <option value="default" disabled>Objetivo</option>
                <option value="weight_loss">Pérdida de peso</option>
                <option value="muscle_gain">Ganancia muscular</option>
                <option value="body_recomposition">Recomposición</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="athletic_performance">Rendimiento deportivo</option>
              </select>
              <select aria-label="activity_level" {...registerForm.register('activity_level')} className={selectCls}>
                <option value="default" disabled>Nivel de actividad</option>
                <option value="sedentary">Sedentario</option>
                <option value="light">Ligero</option>
                <option value="moderate">Moderado</option>
                <option value="active">Activo</option>
                <option value="very_active">Muy activo</option>
              </select>
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta
              </button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <input aria-label="login-email" {...loginForm.register('email')} placeholder="Email" className={inputCls} />
              <input aria-label="login-password" type="password" {...loginForm.register('password')} placeholder="Contraseña" className={inputCls} />
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
