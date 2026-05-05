import { motion, AnimatePresence } from 'framer-motion';
import { useLogManager } from '../../hooks/useLogManager';
import { useAppStore } from '../../stores/useAppStore';
import { UtensilsCrossed, Dumbbell, Trash2, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface MealEntry { id?: number; name: string; meal_type?: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number; quantity_description?: string; created_at?: string; type: 'meal' }
interface ExerciseEntry { id?: number; name: string; duration_minutes?: number; calories_burned: number; exercise_type?: string; intensity?: string; created_at?: string; type: 'exercise' }
type Entry = MealEntry | ExerciseEntry;

export const EntriesPanel = () => {
  const { showEntries, toggleEntries } = useAppStore();
  const { deleteMeal, deleteExercise, meals, exercises } = useLogManager();

  const allItems: Entry[] = [
    ...meals.map((m) => ({ ...m, type: 'meal' as const })),
    ...exercises.map((e) => ({ ...e, type: 'exercise' as const })),
  ].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  if (!showEntries) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm"
        onClick={toggleEntries}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="noise glass-strong absolute bottom-0 left-0 right-0 flex max-h-[70vh] flex-col rounded-t-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold">Registros de hoy</h3>
              <p className="text-xs text-surface-100">
                {allItems.length === 0 ? 'Sin registros aún' : `${allItems.length} registro${allItems.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={toggleEntries}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 space-y-2 overflow-auto p-5">
            {allItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <Clock className="h-5 w-5 text-surface-100" />
                </div>
                <p className="text-sm text-surface-100">Aún no has registrado nada hoy</p>
                <p className="text-xs text-surface-100/60">Escribe en el chat para comenzar</p>
              </div>
            ) : (
              allItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {item.type === 'meal' ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                          <UtensilsCrossed className="h-4 w-4 text-brand-400" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                          <Dumbbell className="h-4 w-4 text-orange-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-surface-100">
                          {item.type === 'meal' && (
                            <>
                              {item.meal_type && <span>{mealLabels[item.meal_type] || item.meal_type}</span>}
                              {item.quantity_description && <span>{item.quantity_description}</span>}
                              <span>P: {Math.round(item.protein_g ?? 0)}g · C: {Math.round(item.carbs_g ?? 0)}g · G: {Math.round(item.fat_g ?? 0)}g</span>
                            </>
                          )}
                          {item.type === 'exercise' && (
                            <>
                              {item.duration_minutes && <span>{item.duration_minutes} min</span>}
                              {item.intensity && <span>{item.intensity === 'low' ? 'Baja' : item.intensity === 'moderate' ? 'Moderada' : item.intensity === 'high' ? 'Alta' : 'Muy alta'} intensidad</span>}
                            </>
                          )}
                          <span>{item.created_at ? format(new Date(item.created_at), 'HH:mm', { locale: es }) : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-sm font-bold ${item.type === 'meal' ? 'text-brand-400' : 'text-orange-400'}`}>
                        {item.type === 'meal' ? `${Math.round(item.calories)} kcal` : `−${Math.round(item.calories_burned)} kcal`}
                      </span>
                      {item.id && (
                        <button
                          onClick={() => {
                            if (item.type === 'meal') deleteMeal(item.id!);
                            else deleteExercise(item.id!);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
