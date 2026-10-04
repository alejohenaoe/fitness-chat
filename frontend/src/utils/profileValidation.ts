// Validación de los datos del perfil, compartida por crear cuenta y Perfil.

/** Acepta coma decimal ("78,5"), como se escribe en Colombia. */
export const toNumber = (v: string) => Number(v.replace(',', '.'));

const inRange = (value: string, min: number, max: number) => {
  const n = toNumber(value);
  return Number.isFinite(n) && n >= min && n <= max;
};

type Measures = { age: string; weight: string; height: string; gender: string };
type Goals = { goal: string; activity: string };

export const validateMeasures = (f: Measures) => {
  const e: Partial<Record<keyof Measures, string>> = {};
  if (!f.age) e.age = 'Escribe tu edad.';
  else if (!inRange(f.age, 13, 100)) e.age = 'Entre 13 y 100.';
  if (!f.weight) e.weight = 'Escribe tu peso.';
  else if (!inRange(f.weight, 30, 300)) e.weight = 'Entre 30 y 300.';
  if (!f.height) e.height = 'Escribe tu estatura.';
  else if (!inRange(f.height, 100, 250)) e.height = 'Entre 100 y 250.';
  if (!f.gender) e.gender = 'Elige una opción.';
  return e;
};

export const validateGoals = (f: Goals) => {
  const e: Partial<Record<keyof Goals, string>> = {};
  if (!f.goal) e.goal = 'Elige tu objetivo.';
  if (!f.activity) e.activity = 'Elige qué tan activo eres.';
  return e;
};
