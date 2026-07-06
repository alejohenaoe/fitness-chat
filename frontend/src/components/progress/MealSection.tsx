import { useState } from 'react';
import type { MealLog } from '../../types';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  morning_snack: 'Media mañana',
  lunch: 'Almuerzo',
  afternoon_snack: 'Merienda',
  dinner: 'Cena',
  late_snack: 'Snack nocturno',
  beverage: 'Bebida',
  other: 'Otro',
};

interface MealSectionProps {
  meals: MealLog[];
}

export const MealSection = ({ meals }: MealSectionProps) => {
  const [showAll, setShowAll] = useState(false);

  if (meals.length === 0) {
    return <p className="text-sm italic text-surface-100">Sin comidas registradas</p>;
  }

  const grouped: Record<string, MealLog[]> = {};
  for (const meal of meals) {
    const type = meal.meal_type ?? 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(meal);
  }

  const flatItems: { type: string; meal: MealLog }[] = [];
  for (const [type, items] of Object.entries(grouped)) {
    for (const meal of items) {
      flatItems.push({ type, meal });
    }
  }

  const LIMIT = 5;
  const hasMore = flatItems.length > LIMIT;
  const visible = showAll ? flatItems : flatItems.slice(0, LIMIT);
  const hiddenCount = flatItems.length - LIMIT;

  return (
    <div>
      {visible.map(({ type, meal }, i) => (
        <div key={meal.id ?? i}>
          {(i === 0 || visible[i - 1].type !== type) && (
            <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-brand-400 first:mt-0">
              {MEAL_LABELS[type] || type}
            </p>
          )}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] py-1.5">
            <span className="text-sm text-surface-50">{meal.name}</span>
            <span className="text-sm text-surface-100">{meal.calories} kcal</span>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-center text-sm font-semibold text-brand-500"
        >
          {showAll ? 'Ver menos' : `Ver ${hiddenCount} más`}
        </button>
      )}
    </div>
  );
};
