import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Loader2 } from 'lucide-react';
import api from '../services/api';

export const ProgressPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dailyProgress'],
    queryFn: async () => (await api.get('/dashboard/today/')).data,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const consumed = data?.calories_consumed ?? 0;
  const burned = data?.calories_burned ?? 0;
  const target = data?.calorie_target ?? 2100;
  const net = consumed - burned;
  const progress = target > 0 ? Math.min(100, Math.round((net / target) * 100)) : 0;
  const protein = data?.protein_g ?? 0;
  const carbs = data?.carbs_g ?? 0;
  const fat = data?.fat_g ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <h1 className="text-xl font-bold text-surface-50">Progreso de hoy</h1>

      {/* Calorie bar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-surface-100">Calorías</span>
          <span className="font-semibold text-surface-50">{consumed} / {target}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-800">
          <div
            className={`h-full rounded-full transition-all ${progress > 100 ? 'bg-red-400' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-surface-700">
          <span>{burned > 0 ? `${burned} quemadas` : ''}</span>
          <span>{progress > 100 ? '¡Excedido!' : `${progress}%`}</span>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Proteína', value: protein, unit: 'g', color: 'bg-green-400' },
          { label: 'Carbos', value: carbs, unit: 'g', color: 'bg-brand-500' },
          { label: 'Grasas', value: fat, unit: 'g', color: 'bg-amber-400' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center">
            <div className={`mx-auto mb-2 h-2 w-12 rounded-full ${m.color}`} />
            <div className="text-lg font-bold text-surface-50">{m.value}{m.unit}</div>
            <div className="text-xs text-surface-100">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Meals and exercises placeholder */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-center gap-2 text-surface-100">
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm">Detalle de comidas y ejercicios próximamente</span>
        </div>
      </div>
    </div>
  );
};
