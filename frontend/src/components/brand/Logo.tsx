// Logo "Marcador F" (dirección elegida para la fase 6, donde se afinan proporciones e íconos).
export const LogoMark = ({ size = 32, className = '' }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`flex-none rounded-[22.5%] ${className}`} aria-hidden="true">
    <rect width="100" height="100" fill="rgb(var(--ink))" />
    <rect x="32" y="24" width="15" height="52" rx="2" fill="rgb(var(--paper))" />
    <rect x="32" y="24" width="38" height="14" rx="2" fill="rgb(var(--paper))" />
    <rect x="32" y="45" width="27" height="13" rx="2" fill="rgb(var(--paper))" />
    <rect x="58" y="62" width="14" height="14" rx="3" fill="rgb(var(--volt))" />
  </svg>
);

export const Wordmark = ({ size = 32, textClass = 'text-[19px]' }: { size?: number; textClass?: string }) => (
  <div className="flex items-center gap-[9px]">
    <LogoMark size={size} />
    <b className={`font-num font-extrabold uppercase tracking-[.03em] ${textClass}`}>FitnessChat</b>
  </div>
);
