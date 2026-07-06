import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { CalorieBar } from '../components/progress/CalorieBar';
import { MacroRing } from '../components/progress/MacroRing';
import { MealSection } from '../components/progress/MealSection';
import { ExerciseSection } from '../components/progress/ExerciseSection';

export const ProgressPage = () => {
  const { dailyProgress, user } = useAppStore();
  const profile = user?.profile;

  const { isLoading } = useQuery({
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

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-bold text-surface-50">Progreso de hoy</h1>
      <p className="text-sm capitalize text-surface-100">
        {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {/* Calories */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Calorías consumidas</h2>
        <CalorieBar
          consumed={dailyProgress.caloriesConsumed}
          burned={dailyProgress.caloriesBurned}
          target={dailyProgress.calorieTarget}
        />
      </div>

      {/* Macros */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
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
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Comidas de hoy</h2>
        <MealSection meals={dailyProgress.mealsLogged} />
      </div>

      {/* Exercise */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-surface-50">Ejercicio hoy</h2>
        <ExerciseSection exercises={dailyProgress.exercisesLogged} />
      </div>
    </div>
  );
};
