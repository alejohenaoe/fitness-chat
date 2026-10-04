import type { SVGProps } from 'react';

// Íconos del campo de escribir, trazados igual que en la maqueta.
type P = SVGProps<SVGSVGElement>;
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const MicIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
);
export const SendIcon = (p: P) => (
  <svg {...base} strokeWidth={2.4} {...p}><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} strokeWidth={2.4} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} strokeWidth={2.8} {...p}><path d="m5 12 5 5 9-10" /></svg>
);
export const CameraIcon = (p: P) => (
  <svg {...base} strokeWidth={1.9} {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const PencilIcon = (p: P) => (
  <svg {...base} strokeWidth={2.2} {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const AlertIcon = (p: P) => (
  <svg {...base} strokeWidth={2.2} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>
);
