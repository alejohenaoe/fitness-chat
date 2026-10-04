import type { ReactNode } from 'react';

/** Título grande de pantalla (Progreso, Diario, Perfil), como en la maqueta. */
export const ScreenHeader = ({ title, children }: { title?: ReactNode; children?: ReactNode }) => (
  <header className="mx-auto w-full max-w-3xl px-[18px] pb-1 pt-2">
    {title && <h1 className="font-num text-[30px] font-extrabold uppercase leading-none tracking-[.01em]">{title}</h1>}
    {children}
  </header>
);
