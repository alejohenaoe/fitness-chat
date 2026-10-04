import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// parseISO lee "2026-10-04" como fecha local. new Date("2026-10-04") la leía como medianoche
// UTC, que en Colombia es el día anterior: por eso Diario mostraba hoy como "Ayer" (fallo nº 2).
export const parseDay = (iso: string) => parseISO(iso);

export const relativeDay = (iso: string) => {
  const d = parseDay(iso);
  return isToday(d) ? 'Hoy' : isYesterday(d) ? 'Ayer' : '';
};

export const shortWeekday = (iso: string) => WEEKDAYS[parseDay(iso).getDay()];

/** "Viernes 2 de octubre" */
export const longDay = (iso: string) => {
  const s = format(parseDay(iso), "EEEE d 'de' MMMM", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const monthName = (iso: string) => {
  const s = format(parseDay(iso), 'MMMM', { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const todayIso = () => format(new Date(), 'yyyy-MM-dd');
