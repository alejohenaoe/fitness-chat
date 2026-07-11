export type InputMode = 'register' | 'ask';

export const MODE_COLORS: Record<InputMode, string> = {
  register: '#10B981',
  ask: '#3B82F6',
};

export const PLACEHOLDERS: Record<InputMode, string> = {
  register: '¿Qué comiste o hiciste?',
  ask: 'Pregunta lo que quieras',
};
