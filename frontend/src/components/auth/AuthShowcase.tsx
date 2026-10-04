import { useEffect, useRef, useState } from 'react';
import { formatKcal } from '../../utils/format';

// Un día de ejemplo en bucle (desayuno, almuerzo, ejercicio), con los mismos números de la maqueta.
const DAY = [
  { left: 2150, p: 0, c: 0, f: 0 },
  { left: 1941, p: 8, c: 26, f: 13, chip: '+209' },
  { left: 1337, p: 56, c: 98, f: 24, chip: '+604' },
  { left: 1547, p: 56, c: 98, f: 24, chip: '−210', burn: true },
] as const;
const GOALS = { p: 130, c: 240, f: 70 };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lado derecho del login en computador: el marcador del día, animado y casi sin texto. */
export const AuthShowcase = () => {
  const [step, setStep] = useState(() => (reducedMotion() ? DAY.length - 1 : 0));
  const [shown, setShown] = useState<number>(DAY[step].left);
  const [chipOn, setChipOn] = useState(false);
  const shownRef = useRef(shown);

  useEffect(() => {
    if (reducedMotion()) return;
    const t = window.setTimeout(() => setStep((s) => (s + 1) % DAY.length), step === 0 ? 1200 : step === DAY.length - 1 ? 3600 : 2200);
    return () => window.clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const to = DAY[step].left;
    if (reducedMotion()) { setShown(to); return; }
    const from = shownRef.current, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 900);
      const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    if ('chip' in DAY[step]) {
      setChipOn(true);
      const t = window.setTimeout(() => setChipOn(false), 1500);
      return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
    }
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const st = DAY[step];
  const bars = [
    { w: st.p / GOALS.p, color: 'bg-protein' },
    { w: st.c / GOALS.c, color: 'bg-carbs' },
    { w: st.f / GOALS.f, color: 'bg-fat' },
  ];
  const lastChip = [...DAY.slice(0, step + 1)].reverse().find((d) => 'chip' in d) as { chip: string; burn?: boolean } | undefined;

  return (
    <div
      className="relative hidden place-items-center overflow-hidden bg-ink text-paper lg:grid"
      aria-label="Animación: el marcador del día baja con cada registro"
      role="img"
    >
      <div className="absolute inset-0 bg-[radial-gradient(rgb(var(--night-rule))_1.2px,transparent_1.2px)] bg-[length:22px_22px] opacity-90" />
      <div className="relative w-[380px]">
        <div className="font-num text-[15px] font-semibold uppercase tracking-[.16em] text-night-muted">Quedan hoy</div>
        <div className="num relative mt-1.5 text-[168px] font-extrabold leading-[.86] tracking-[-.01em]">
          {formatKcal(shown)}
          <span
            className={`absolute -top-[34px] right-0 rounded-full px-3 py-1.5 text-[26px] leading-none tracking-normal transition duration-300 ${
              chipOn ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0'
            } ${lastChip?.burn ? 'bg-volt text-ink' : 'bg-night-rule text-paper'}`}
          >
            {lastChip?.chip}
          </span>
        </div>
        <div className="mt-[26px] grid grid-cols-3 gap-3">
          {bars.map((b, i) => (
            <span key={i} className="h-1.5 overflow-hidden rounded-md bg-night-track">
              <i className={`block h-full rounded-md ${b.color} transition-[width] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]`} style={{ width: `${Math.min(100, b.w * 100)}%` }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
