export type InputMode = 'register' | 'ask';

export const MODE_COLORS: Record<InputMode, string> = {
  register: '#3B82F6',
  ask: '#000000',
};

export const PLACEHOLDERS: Record<InputMode, string> = {
  register: 'Registra tu comida o ejercicio',
  ask: 'Pregunta lo que quieras',
};
