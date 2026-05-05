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

const inputCls = 'glass w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 bg-transparent';
const selectCls = 'glass w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/30 bg-transparent appearance-none';

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
    <div className="flex min-h-screen bg-surface-950 bg-mesh">
      {/* Left branding panel */}
      <div className="noise hidden w-1/2 flex-col items-center justify-center border-r border-white/5 bg-surface-900/60 md:flex">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-2xl shadow-brand-500/30">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">FitnessChat</h1>
        <p className="max-w-xs text-center text-sm text-surface-100">
          Tu entrenador personal con IA. Registra comidas y ejercicio con lenguaje natural.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 md:w-1/2">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile logo */}
          <div className="mb-2 flex items-center justify-center gap-2 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">FitnessChat</span>
          </div>

          {/* Toggle */}
          <div className="glass noise rounded-xl p-1">
            <div className="grid grid-cols-2">
              <button
                className={`rounded-lg py-2.5 text-sm font-medium transition-all ${mode === 'register' ? 'bg-brand-500/20 text-brand-400' : 'text-surface-100 hover:text-surface-50'}`}
                onClick={() => setMode('register')}
                type="button"
              >
                Registro
              </button>
              <button
                className={`rounded-lg py-2.5 text-sm font-medium transition-all ${mode === 'login' ? 'bg-brand-500/20 text-brand-400' : 'text-surface-100 hover:text-surface-50'}`}
                onClick={() => setMode('login')}
                type="button"
              >
                Iniciar sesión
              </button>
            </div>
          </div>

          {mode === 'register' ? (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="glass noise rounded-xl p-5 space-y-3 glow-card">
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta
              </button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="glass noise rounded-xl p-5 space-y-3 glow-card">
              <input aria-label="login-email" {...loginForm.register('email')} placeholder="Email" className={inputCls} />
              <input aria-label="login-password" type="password" {...loginForm.register('password')} placeholder="Contraseña" className={inputCls} />
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30 disabled:opacity-50"
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
