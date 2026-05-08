import { z } from 'zod';

export const profileSchema = z.object({
  weight_kg: z.coerce.number().min(30, 'Mínimo 30 kg').max(300, 'Máximo 300 kg'),
  height_cm: z.coerce.number().min(50, 'Mínimo 50 cm').max(300, 'Máximo 300 cm'),
  age: z.coerce.number().min(12, 'Mínimo 12 años').max(100, 'Máximo 100 años'),
  gender: z.enum(['male', 'female', 'other']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['weight_loss', 'muscle_gain', 'body_recomposition', 'maintenance', 'athletic_performance']),
});

export const profileFormDefaults = {
  weight_kg: 70,
  height_cm: 170,
  age: 30,
  gender: 'other' as const,
  activity_level: 'moderate' as const,
  goal: 'maintenance' as const,
};

export const goalLabels: Record<string, string> = {
  weight_loss: 'Pérdida de peso',
  muscle_gain: 'Ganancia muscular',
  body_recomposition: 'Recomposición',
  maintenance: 'Mantenimiento',
  athletic_performance: 'Rendimiento deportivo',
};

export const activityLabels: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
};

export const inputCls =
  'glass w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 bg-transparent';

export const selectCls =
  'glass w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/30 bg-transparent appearance-none';
