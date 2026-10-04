import type { ReactNode } from 'react';

/**
 * Estructura común de entrar y crear cuenta. En celular el botón queda fijo abajo
 * (como en la maqueta); en computador va justo debajo de los campos.
 */
export const FormShell = ({ children, footer, onSubmit }: { children: ReactNode; footer: ReactNode; onSubmit: () => void }) => (
  <form
    noValidate
    onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-[408px] lg:flex-none"
  >
    <div className="flex flex-1 flex-col gap-[18px] px-[22px] pb-[18px] pt-[calc(env(safe-area-inset-top)+14px)] lg:flex-none lg:px-0 lg:pt-0">
      {children}
    </div>
    <div className="sticky bottom-0 grid gap-2.5 border-t border-line bg-paper px-[22px] pb-[max(env(safe-area-inset-bottom),14px)] pt-2.5 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
      {footer}
    </div>
  </form>
);
