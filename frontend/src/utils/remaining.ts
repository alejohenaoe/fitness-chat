import type { ChatMessage as Msg, ExerciseLog, MealLog } from '../types';

/**
 * Cuánto quedaba después de cada registro, para el pie de los recibos.
 * Los registros apuntan al mensaje del usuario que los originó; se suman los de hoy
 * hasta ese mensaje. Si el registro no está entre los de hoy (otro día, o se borró),
 * el recibo no muestra "quedan".
 */
export const remainingByMessage = (messages: Msg[], meals: MealLog[], exercises: ExerciseLog[], target: number) => {
  const result = new Map<number, number>();
  let lastUserId: number | undefined;
  for (const m of messages) {
    if (m.role === 'user') { lastUserId = m.id; continue; }
    if (m.id == null || lastUserId == null) continue;
    const uid = lastUserId;
    const linked = meals.some((x) => x.source_message === uid) || exercises.some((x) => x.source_message === uid);
    if (!linked) continue;
    const upTo = (sourceId?: number | null) => sourceId != null && sourceId <= uid;
    const eaten = meals.filter((x) => upTo(x.source_message)).reduce((s, x) => s + x.calories, 0);
    const burned = exercises.filter((x) => upTo(x.source_message)).reduce((s, x) => s + x.calories_burned, 0);
    result.set(m.id, target - eaten + burned);
  }
  return result;
};
