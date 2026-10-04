import { MEAL_LABELS } from '../constants/meals';
import type { ExerciseLog, MealLog } from '../types';

export type DayRow =
  | { kind: 'meal'; key: string; time?: string; label: string; kcal: number; items: MealLog[] }
  | { kind: 'exercise'; key: string; time?: string; label: string; kcal: number; item: ExerciseLog };

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Una fila por registro, como en la maqueta: "Almuerzo · arroz, pollo, jugo". */
export const buildDayRows = (meals: MealLog[], exercises: ExerciseLog[]): DayRow[] => {
  const groups = new Map<string, MealLog[]>();
  for (const m of meals) {
    const key = m.source_message != null ? `msg-${m.source_message}-${m.meal_type ?? ''}` : `meal-${m.id}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  const rows: DayRow[] = [...groups].map(([key, items]) => ({
    kind: 'meal',
    key,
    time: items[0].occurred_at ?? items[0].created_at,
    label: `${MEAL_LABELS[items[0].meal_type ?? 'other'] ?? 'Comida'} · ${items.map((i) => lowerFirst(i.name)).join(', ')}`,
    kcal: items.reduce((sum, i) => sum + i.calories, 0),
    items,
  }));
  for (const e of exercises) {
    rows.push({
      kind: 'exercise',
      key: `ex-${e.id}`,
      time: e.occurred_at ?? e.created_at,
      label: e.duration_minutes ? `${e.name} · ${e.duration_minutes} min` : e.name,
      kcal: e.calories_burned,
      item: e,
    });
  }
  return rows.sort((a, b) => new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime());
};
