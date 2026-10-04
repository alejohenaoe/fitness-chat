export type InputMode = 'register' | 'ask';

export const PLACEHOLDERS: Record<InputMode, string> = {
  register: 'Escribe o habla…',
  ask: 'Pregunta lo que quieras…',
};
