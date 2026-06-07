import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/useAppStore';
import {
  Target,
  Flame,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Utensils,
  Dumbbell,
} from 'lucide-react';
import { useState } from 'react';

const MacroRing = ({ label, current, target, unit, color }: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}) => {
  const pct = target > 0 ? (current / target) * 100 : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const normalPct = Math.min(100, pct);
  const offset = circumference - (normalPct / 100) * circumference;

  const excessPct = Math.max(0, pct - 100);
  const displayExcess = Math.min(25, excessPct);
  const excessOffset = circumference - (displayExcess / 100) * circumference;
  const hasExcess = excessPct > 0;
  const excessColor = excessPct > 20 ? '#ef4444' : '#f59e0b';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          {hasExcess && (
            <motion.circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={excessColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={excessOffset}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: excessOffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          {hasExcess ? (
            <>
              <span className="text-xs font-semibold" style={{ color: excessColor }}>{Math.round(current)}</span>
              <span className="text-[10px] text-surface-100">+{Math.round(current - target)}{unit}</span>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold">{Math.round(current)}</span>
              <span className="text-[10px] text-surface-100">/ {target}{unit}</span>
            </>
          )}
        </div>
      </div>
      <span className="text-[11px] text-surface-100">{label}</span>
    </div>
  );
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  morning_snack: 'Media mañana',
  lunch: 'Almuerzo',
  afternoon_snack: 'Merienda',
  dinner: 'Cena',
  late_snack: 'Snack nocturno',
  beverage: 'Bebida',
  other: 'Otro',
};

const MealSection = ({ meals }: { meals: { name: string; meal_type?: string; calories?: number; calories_estimated?: number }[] }) => {
  const [open, setOpen] = useState(true);
  if (!meals.length) return null;

  const grouped = meals.reduce<Record<string, typeof meals>>((acc, m) => {
    const key = m.meal_type || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="glass noise rounded-xl p-3 glow-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-brand-400" />
          Comidas del día
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-2 space-y-1.5 overflow-hidden"
        >
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-surface-100">{MEAL_TYPE_LABELS[type] || type}</p>
              {items.map((item, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
                  <span>{item.name}</span>
                  <span className="font-medium text-brand-400">{Math.round(item.calories ?? item.calories_estimated ?? 0)} kcal</span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const ExerciseSection = ({ exercises }: { exercises: { name: string; duration_minutes?: number; calories_burned: number }[] }) => {
  const [open, setOpen] = useState(true);
  if (!exercises.length) return null;

  return (
    <div className="glass noise rounded-xl p-3 glow-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-orange-400" />
          Ejercicio del día
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-2 space-y-1.5 overflow-hidden"
        >
          {exercises.map((ex, i) => (
            <div key={i} className="flex justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
              <span>{ex.name}{ex.duration_minutes ? ` · ${ex.duration_minutes}min` : ''}</span>
              <span className="font-medium text-orange-400">−{Math.round(ex.calories_burned)} kcal</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const getBarStyle = (pct: number) => {
  if (pct <= 100) return {};
  const stop = `${(100 / pct) * 100}%`;
  const shadowColor = pct > 120 ? 'rgba(239,68,68,0.45)' : 'rgba(245,158,11,0.35)';
  return {
    background: `linear-gradient(90deg, #22c55e 0%, #4ade80 calc(${stop} - 1%), #f59e0b ${stop}, #ef4444 100%)`,
    boxShadow: `0 0 8px ${shadowColor}`,
  };
};

export const DashboardPanel = () => {
  const d = useAppStore((s) => s.dailyProgress);
  const profile = useAppStore((s) => s.user?.profile);
  const remaining = Math.max(0, Math.round(d.calorieTarget - d.netCalories));
  const pct = d.calorieTarget > 0 ? (d.caloriesConsumed / d.calorieTarget) * 100 : 0;

  return (
    <aside className="noise hidden w-80 border-l border-white/5 bg-surface-900/80 p-4 lg:block overflow-y-auto">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
          <TrendingUp className="h-4 w-4 text-brand-400" />
        </div>
        <h3 className="text-base font-semibold tracking-tight">Dashboard</h3>
      </div>

      {/* Calorie progress card */}
      <div className="glass noise rounded-xl p-4 glow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-surface-100" />
            <span className="text-xs text-surface-100">Meta diaria</span>
          </div>
          <span className="text-lg font-bold">{Math.round(d.calorieTarget)}</span>
        </div>
        <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className={`h-full rounded-full ${pct <= 100 ? 'progress-gradient' : ''}`}
            style={getBarStyle(pct)}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Flame className="h-3.5 w-3.5 text-brand-400" />
            <div>
              <p className="text-[10px] text-surface-100">Consumidas</p>
              <p className="text-sm font-semibold">{Math.round(d.caloriesConsumed)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-orange-400" />
            <div>
              <p className="text-[10px] text-surface-100">Quemadas</p>
              <p className="text-sm font-semibold">{Math.round(d.caloriesBurned)}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
          <span className="text-[11px] text-surface-100">Netas</span>
          <span className="text-sm font-bold">{Math.round(d.netCalories)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-500/10 px-3 py-2">
          <span className="text-[11px] text-brand-400">Restantes</span>
          <span className="text-sm font-bold text-brand-400">{remaining}</span>
        </div>
      </div>

      {/* Macros */}
      <div className="glass noise mt-3 rounded-xl p-4 glow-card">
        <p className="mb-3 text-xs font-medium text-surface-100">Macronutrientes</p>
        <div className="flex items-center justify-around">
          <MacroRing
            label="Proteína"
            current={d.proteinG}
            target={profile?.protein_target_g ?? 150}
            unit="g"
            color="#22c55e"
          />
          <MacroRing
            label="Carbos"
            current={d.carbsG}
            target={profile?.carbs_target_g ?? 250}
            unit="g"
            color="#3b82f6"
          />
          <MacroRing
            label="Grasas"
            current={d.fatG}
            target={profile?.fat_target_g ?? 70}
            unit="g"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Meals */}
      <div className="mt-3">
        <MealSection meals={d.mealsLogged} />
      </div>

      {/* Exercises */}
      <div className="mt-3">
        <ExerciseSection exercises={d.exercisesLogged} />
      </div>
    </aside>
  );
};
