// Logo "Marcador F" del concepto original. Usa el mismo archivo que los íconos (public/logo-mark.svg,
// generado desde brand/logo-mark.svg con npm run generate-icons), así nunca se desalinean.
export const LogoMark = ({ size = 32, className = '' }: { size?: number; className?: string }) => (
  <img src="/logo-mark.svg" width={size} height={size} alt="" aria-hidden="true" className={`flex-none ${className}`} />
);

export const Wordmark = ({ size = 32, textClass = 'text-[19px]' }: { size?: number; textClass?: string }) => (
  <div className="flex items-center gap-[9px]">
    <LogoMark size={size} />
    <b className={`font-num font-extrabold uppercase tracking-[.03em] ${textClass}`}>FitnessChat</b>
  </div>
);
