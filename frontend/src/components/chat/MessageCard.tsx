import { UtensilsCrossed, Dumbbell } from 'lucide-react';

interface ExtractedFood {
  name: string;
  quantity_grams?: number;
  quantity_description?: string;
  meal_type?: string;
  calories_estimated: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence?: string;
}

interface ExtractedExercise {
  name: string;
  exercise_type?: string;
  duration_minutes?: number;
  intensity?: string;
  calories_burned_estimated?: number;
  calories_burned?: number;
  notes?: string;
}

const mealLabels: Record<string, string> = {
  breakfast: 'Desayuno',
  morning_snack: 'Media mañana',
  lunch: 'Almuerzo',
  afternoon_snack: 'Merienda',
  dinner: 'Cena',
  late_snack: 'Snack nocturno',
  beverage: 'Bebida',
  other: 'Otro',
};

export const MessageCard = ({ foods, exercises }: { foods?: ExtractedFood[]; exercises?: ExtractedExercise[] }) => {
  const hasFoods = foods && foods.length > 0;
  const hasExercises = exercises && exercises.length > 0;

  if (!hasFoods && !hasExercises) return null;

  return (
    <div className="border-t border-surface-800">
      {hasFoods && foods.map((f, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2.5 even:bg-black/[0.02]">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="h-4 w-4 shrink-0 text-brand-400" />
            <div>
              <p className="text-sm font-medium text-surface-50">{f.name}</p>
              {f.quantity_description && (
                <p className="text-xs text-surface-100">{f.quantity_description}{f.quantity_grams ? ` (${f.quantity_grams}g)` : ''}</p>
              )}
              {f.meal_type && (
                <p className="text-xs text-surface-700">{mealLabels[f.meal_type] || f.meal_type}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-brand-500">{Math.round(f.calories_estimated)} kcal</p>
            <p className="text-xs text-surface-100">
              P {Math.round(f.protein_g)}g · C {Math.round(f.carbs_g)}g · G {Math.round(f.fat_g)}g
            </p>
          </div>
        </div>
      ))}
      {hasExercises && exercises.map((e, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2.5 even:bg-black/[0.02]">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="h-4 w-4 shrink-0 text-orange-400" />
            <div>
              <p className="text-sm font-medium text-surface-50">{e.name}</p>
              <p className="text-xs text-surface-100">
                {e.duration_minutes ? `${e.duration_minutes} min` : ''}
                {e.intensity && ` · ${e.intensity === 'low' ? 'Baja' : e.intensity === 'moderate' ? 'Moderada' : e.intensity === 'high' ? 'Alta' : 'Muy alta'} intensidad`}
              </p>
              {e.notes && <p className="text-xs text-surface-100">{e.notes}</p>}
            </div>
          </div>
          <p className="text-sm font-semibold text-orange-400">−{Math.round(e.calories_burned_estimated || e.calories_burned || 0)} kcal</p>
        </div>
      ))}
    </div>
  );
};
