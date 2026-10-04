import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

/** 1547 → "1.547" (separador de miles colombiano). */
export const formatKcal = (n: number) => Math.round(n).toLocaleString('es-CO');

/** Hora corta del marcador y los registros: "7:40", "18:10". */
export const formatClockTime = (iso?: string) => (iso ? format(new Date(iso), 'H:mm') : '');

/** Separador de día del chat: "Hoy · sábado 3 oct", "Ayer · …", "jueves 1 oct". */
export const formatDayLabel = (date: Date) => {
  const label = format(date, 'EEEE d MMM', { locale: es }).replace('.', '');
  if (isToday(date)) return `Hoy · ${label}`;
  if (isYesterday(date)) return `Ayer · ${label}`;
  return label;
};
