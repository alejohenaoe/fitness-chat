import type { UserProfile } from '../types';

// Valores por defecto del modelo UserProfile en el servidor; solo se usan si el perfil
// aún no cargó. Antes Progreso usaba 150/200/65, que no coincidían con nada (fallo nº 1).
const DEFAULTS = { kcal: 2100, protein: 130, carbs: 230, fat: 70 };

export const targetsOf = (profile?: UserProfile) => ({
  kcal: profile?.daily_calorie_target ?? DEFAULTS.kcal,
  protein: profile?.protein_target_g ?? DEFAULTS.protein,
  carbs: profile?.carbs_target_g ?? DEFAULTS.carbs,
  fat: profile?.fat_target_g ?? DEFAULTS.fat,
});
