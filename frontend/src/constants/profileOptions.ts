// Opciones del perfil, compartidas por crear cuenta y Perfil. Los valores coinciden con el servidor.
export const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

// Las descripciones reflejan cómo el servidor ajusta la meta (UserProfile.recalculate_targets):
// −20 % para perder peso, +10 % para ganar músculo, −10 % en recomposición y el gasto diario
// en mantenimiento y rendimiento.
export const GOALS = [
  { value: 'weight_loss', label: 'Perder peso', detail: 'Comer un poco menos de lo que gastas' },
  { value: 'muscle_gain', label: 'Ganar músculo', detail: 'Un poco más de calorías y más proteína' },
  { value: 'body_recomposition', label: 'Recomposición', detail: 'Bajar grasa y ganar músculo a la vez' },
  { value: 'maintenance', label: 'Mantenerme', detail: 'Comer lo mismo que gastas' },
  { value: 'athletic_performance', label: 'Rendimiento deportivo', detail: 'Energía para entrenar fuerte' },
];

export const ACTIVITY = [
  { value: 'sedentary', label: 'Sedentario', detail: 'Casi todo el día sentado' },
  { value: 'light', label: 'Ligero', detail: 'Ejercicio 1 a 3 días por semana' },
  { value: 'moderate', label: 'Moderado', detail: 'Ejercicio 3 a 5 días por semana' },
  { value: 'active', label: 'Activo', detail: 'Ejercicio 6 o 7 días por semana' },
  { value: 'very_active', label: 'Muy activo', detail: 'Entrenas fuerte o tu trabajo es físico' },
];

export type ProfileOption = { value: string; label: string; detail?: string };

export const labelOf = (options: ProfileOption[], value?: string) => options.find((o) => o.value === value)?.label ?? value ?? '';
