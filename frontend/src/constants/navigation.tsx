import type { SVGProps } from 'react';

// Íconos de la barra de pestañas, trazados igual que en la maqueta de la fase 0.
const Icon = ({ children, ...props }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
);

const TodayIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></Icon>
);
const ProgressIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M5 20V12M12 20V5M19 20v-9" /></Icon>
);
const JournalIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></Icon>
);
const ProfileIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></Icon>
);

// Única definición de las secciones: la usan la barra de pestañas (celular)
// y la barra lateral (escritorio).
export const NAV_ITEMS = [
  { to: '/', label: 'Hoy', icon: TodayIcon },
  { to: '/progress', label: 'Progreso', icon: ProgressIcon },
  { to: '/sessions', label: 'Diario', icon: JournalIcon },
  { to: '/profile', label: 'Perfil', icon: ProfileIcon },
] as const;
