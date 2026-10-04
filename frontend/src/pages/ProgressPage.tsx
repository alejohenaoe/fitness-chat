import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { CalorieBar } from '../components/progress/CalorieBar';
import { MacroRing } from '../components/progress/MacroRing';
import { MealSection } from '../components/progress/MealSection';
import { ExerciseSection } from '../components/progress/ExerciseSection';
import { HistoryPage } from './HistoryPage';

const PERIODS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
] as const;
type PeriodKey = (typeof PERIODS)[number]['key'];

export const ProgressPage = () => {
  const [params, setParams] = useSearchParams();
  const requested = params.get('periodo');
  const period: PeriodKey = PERIODS.some((p) => p.key === requested) ? (requested as PeriodKey) : 'hoy';

  return (
    <div className="flex flex-col">
      <header className="px-[18px] pb-1 pt-2">
        <h1 className="font-num text-[30px] font-extrabold uppercase leading-none tracking-[.01em]">Progreso</h1>
        <div role="group" aria-label="Periodo" className="mb-1 mt-3 grid grid-cols-3 rounded-xl bg-line-2 p-[3px]">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              aria-pressed={period === key}
              onClick={() => setParams(key === 'hoy' ? {} : { periodo: key }, { replace: true })}
              className={`rounded-[9px] py-[7px] text-sm font-semibold ${
                period === key ? 'bg-card text-ink shadow-[0_1px_2px_rgb(var(--ink)/0.12)]' : 'text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="px-[18px] pb-[18px] pt-2">
        {period === 'hoy' ? <TodayProgress /> : <HistoryPage key={period} basePeriod={period === 'semana' ? 'week' : 'month'} />}
      </div>
    </div>
  );
};

const TodayProgress = () => {
  const { dailyProgress, user } = useAppStore();
  const profile = user?.profile;

  const { data, isLoading } = useQuery({
    queryKey: ['dailyProgress'],
    queryFn: async () => (await api.get('/dashboard/today/')).data,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm capitalize text-surface-100">
        {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {/* Calories */}
      <div className="rounded-xl border border-line bg-card p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Calorías consumidas</h2>
        <CalorieBar
          consumed={dailyProgress.caloriesConsumed}
          burned={dailyProgress.caloriesBurned}
          target={dailyProgress.calorieTarget}
        />
      </div>

      {/* Macros */}
      <div className="rounded-xl border border-line bg-card p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Macronutrientes</h2>
        <div className="flex justify-around">
          <MacroRing
            label="Proteína"
            value={dailyProgress.proteinG}
            target={profile?.protein_target_g ?? 150}
            color="#22C55E"
          />
          <MacroRing
            label="Carbos"
            value={dailyProgress.carbsG}
            target={profile?.carbs_target_g ?? 200}
            color="#3B82F6"
          />
          <MacroRing
            label="Grasas"
            value={dailyProgress.fatG}
            target={profile?.fat_target_g ?? 65}
            color="#F59E0B"
          />
        </div>
      </div>

      {/* Meals */}
      <div className="rounded-xl border border-line bg-card p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Comidas de hoy</h2>
        <MealSection meals={data?.meals ?? dailyProgress.mealsLogged} />
      </div>

      {/* Exercise */}
      <div className="rounded-xl border border-line bg-card p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Ejercicio hoy</h2>
        <ExerciseSection exercises={data?.exercises ?? dailyProgress.exercisesLogged} />
      </div>
    </div>
  );
};
