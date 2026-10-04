// Opciones del perfil, compartidas por crear cuenta y Perfil. Los valores coinciden con el servidor.
export const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

// Las descripciones no prometen déficit de calorías: el servidor usa la misma meta de
// calorías para todos los objetivos y solo cambia el reparto de macros.
export const GOALS = [
  { value: 'weight_loss', label: 'Perder peso', detail: 'Bajar de peso cuidando el músculo' },
  { value: 'muscle_gain', label: 'Ganar músculo', detail: 'Más proteína para subir masa muscular' },
  { value: 'body_recomposition', label: 'Recomposición', detail: 'Bajar grasa y ganar músculo a la vez' },
  { value: 'maintenance', label: 'Mantenerme', detail: 'Conservar tu peso actual' },
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
