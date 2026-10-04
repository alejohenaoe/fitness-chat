import { RECEIPT_TITLES, INTENSITY_LABELS } from '../../constants/meals';
import { formatKcal } from '../../utils/format';
import type { ExtractedExercise, ExtractedFood } from '../../types';

const CheckBadge = () => (
  <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-volt">
    <svg viewBox="0 0 24 24" fill="none" stroke="rgb(var(--ink))" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  </span>
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Line = ({ name, detail, kcal }: { name: string; detail?: string; kcal: string }) => (
  // items-end: con nombres largos, los puntos y las calorías quedan en la última línea.
  <li className="flex items-end gap-1.5 text-sm text-ink-2">
    <span className="min-w-0">
      {capitalize(name)}
      {detail && <span className="text-muted"> {detail}</span>}
    </span>
    <span className="mb-[8.9px] min-w-3 flex-1 border-b-[1.5px] border-dotted border-leader" />
    <span className="num text-base font-semibold text-ink">{kcal}</span>
  </li>
);

const foodDetail = (f: ExtractedFood) => {
  const grams = f.quantity_grams ? `${Math.round(f.quantity_grams)}\u00a0g` : '';
  if (f.quantity_description) return `· ${f.quantity_description}${grams ? ` (${grams})` : ''}`;
  return grams ? `(${grams})` : undefined;
};

const exerciseDetail = (e: ExtractedExercise) => {
  const parts = [e.duration_minutes ? `${e.duration_minutes}\u00a0min` : '', e.intensity ? INTENSITY_LABELS[e.intensity] ?? '' : ''].filter(Boolean);
  return parts.length ? `· ${parts.join(', ')}` : undefined;
};

const burnedOf = (e: ExtractedExercise) => e.calories_burned_estimated ?? e.calories_burned ?? 0;

const titleFor = (foods: ExtractedFood[], exercises: ExtractedExercise[]) => {
  if (foods.length && exercises.length) return 'Comida y ejercicio registrados';
  if (exercises.length) return 'Ejercicio registrado';
  const types = new Set(foods.map((f) => f.meal_type ?? 'other'));
  return types.size === 1 ? RECEIPT_TITLES[[...types][0]] ?? RECEIPT_TITLES.other : RECEIPT_TITLES.other;
};

/**
 * Recibo de un registro: una línea por alimento o ejercicio con puntos guía,
 * macros del registro y, si es de hoy, cuánto quedaba después de registrarlo.
 */
export const Receipt = ({ foods, exercises, remaining }: { foods: ExtractedFood[]; exercises: ExtractedExercise[]; remaining?: number }) => {
  const eaten = foods.reduce((s, f) => s + f.calories_estimated, 0);
  const burned = exercises.reduce((s, e) => s + burnedOf(e), 0);
  const macro = (k: 'protein_g' | 'carbs_g' | 'fat_g') => Math.round(foods.reduce((s, f) => s + (f[k] ?? 0), 0));

  return (
    <div className="rounded-[14px] border border-line bg-card px-3.5 pb-2.5 pt-3">
      <div className="flex items-center gap-2 text-[15px] font-bold">
        <CheckBadge />
        {titleFor(foods, exercises)}
      </div>
      <ul className="mt-2 grid gap-1">
        {foods.map((f, i) => <Line key={`f${i}`} name={f.name} detail={foodDetail(f)} kcal={formatKcal(f.calories_estimated)} />)}
        {exercises.map((e, i) => <Line key={`e${i}`} name={e.name} detail={exerciseDetail(e)} kcal={formatKcal(burnedOf(e))} />)}
      </ul>
      {foods.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {([['protein_g', 'bg-protein', 'Proteína'], ['carbs_g', 'bg-carbs', 'Carbohidratos'], ['fat_g', 'bg-fat', 'Grasas']] as const).map(([k, color, label]) => (
            <span key={k} title={label} className="inline-flex items-center gap-[5px] rounded-full bg-line-2 px-2 py-0.5 text-xs font-semibold text-ink-2">
              <i className={`inline-block h-[7px] w-[7px] rounded-full ${color}`} aria-hidden="true" />
              <span className="sr-only">{label} </span>{macro(k)} g
            </span>
          ))}
        </div>
      )}
      <div className="mt-[9px] flex items-baseline justify-between gap-3 border-t border-line pt-[7px]">
        <span className="flex items-baseline gap-2">
          {foods.length > 0 && <span className="num text-xl font-bold">+{formatKcal(eaten)} kcal</span>}
          {exercises.length > 0 && (
            <span className="rounded-full bg-volt px-2 py-0.5 text-xs font-semibold text-ink">−{formatKcal(burned)} kcal</span>
          )}
        </span>
        {remaining !== undefined && (
          <span className="text-[13px] text-muted">
            {remaining >= 0 ? 'quedan' : 'te pasaste por'} <span className="num text-base font-semibold text-ink">{formatKcal(Math.abs(remaining))}</span>
          </span>
        )}
      </div>
    </div>
  );
};
