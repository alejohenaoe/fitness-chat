import type { AxiosError } from 'axios';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensaje para errores de red o del servidor que no son de un campo concreto. */
export const requestErrorMessage = (e: unknown, action: string) => {
  const err = e as AxiosError;
  if (!err?.response) return 'No hay conexión a internet. Revisa tu conexión e intenta de nuevo.';
  return `No se pudo ${action}. Intenta de nuevo en un momento.`;
};
