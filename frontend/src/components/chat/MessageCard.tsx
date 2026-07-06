import { UtensilsCrossed, Dumbbell, Flame, Wheat, Droplets, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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
  const [open, setOpen] = useState(true);
  const hasFoods = foods && foods.length > 0;
  const hasExercises = exercises && exercises.length > 0;

  if (!hasFoods && !hasExercises) return null;

  const totalCalories = foods?.reduce((s, f) => s + (f.calories_estimated || 0), 0) || 0;
  const totalProtein = foods?.reduce((s, f) => s + (f.protein_g || 0), 0) || 0;
  const totalCarbs = foods?.reduce((s, f) => s + (f.carbs_g || 0), 0) || 0;
  const totalFat = foods?.reduce((s, f) => s + (f.fat_g || 0), 0) || 0;
  const totalBurned = exercises?.reduce((s, e) => s + (e.calories_burned_estimated || e.calories_burned || 0), 0) || 0;

  return (
    <div className="rounded-2xl overflow-hidden bg-black/20">
      {/* Summary header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs"
      >
        <div className="flex items-center gap-3">
          {hasFoods && (
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-brand-400" />
              <span className="font-semibold text-brand-400">{Math.round(totalCalories)} kcal</span>
            </div>
          )}
          {hasFoods && (
            <div className="flex items-center gap-3 text-surface-100">
              <span className="flex items-center gap-1">
                <span className="text-[10px]">P</span> {Math.round(totalProtein)}g
              </span>
              <span className="flex items-center gap-1">
                <Wheat className="h-2.5 w-2.5" /> {Math.round(totalCarbs)}g
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="h-2.5 w-2.5" /> {Math.round(totalFat)}g
              </span>
            </div>
          )}
          {hasExercises && (
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="font-semibold text-orange-400">−{Math.round(totalBurned)} kcal</span>
            </div>
          )}
        </div>
        {open ? <ChevronUp className="h-3 w-3 text-surface-100" /> : <ChevronDown className="h-3 w-3 text-surface-100" />}
      </button>

      {/* Detail section */}
      {open && (
        <div className="space-y-1 px-3 pb-3">
          {hasFoods && (
            <div>
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-surface-100">
                Alimentos registrados
              </p>
              {foods.map((f, i) => (
                <div key={i} className="mb-1 rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-3 w-3 text-brand-400" />
                      <div>
                        <p className="font-medium">{f.name}</p>
                        {f.quantity_description && (
                          <p className="text-[10px] text-surface-100">{f.quantity_description} ({f.quantity_grams}g)</p>
                        )}
                        {f.meal_type && (
                          <p className="text-[10px] text-surface-100">{mealLabels[f.meal_type] || f.meal_type}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-400">{Math.round(f.calories_estimated)} kcal</p>
                      <p className="text-[10px] text-surface-100">
                        P: {Math.round(f.protein_g)}g · C: {Math.round(f.carbs_g)}g · G: {Math.round(f.fat_g)}g
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasExercises && (
            <div>
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-surface-100">
                Ejercicio registrado
              </p>
              {exercises.map((e, i) => (
                <div key={i} className="mb-1 rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-3 w-3 text-orange-400" />
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-[10px] text-surface-100">
                          {e.duration_minutes ? `${e.duration_minutes} min` : ''}
                          {e.intensity && ` · ${e.intensity === 'low' ? 'Baja' : e.intensity === 'moderate' ? 'Moderada' : e.intensity === 'high' ? 'Alta' : 'Muy alta'} intensidad`}
                        </p>
                        {e.notes && <p className="text-[10px] text-surface-100">{e.notes}</p>}
                      </div>
                    </div>
                    <p className="font-semibold text-orange-400">−{Math.round(e.calories_burned_estimated || e.calories_burned || 0)} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
