import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Lado derecho del login en computador ("De la charla al marcador"): sin texto, cuenta lo que hace
 * la app. Un mensaje se vuelve recibo y su ficha de macros vuela a la barra del día, que se llena
 * hasta la meta (línea punteada). Tres comidas y vuelve a empezar.
 */

const MEALS = [
  { kcal: 425, mix: [2, 5, 3], lines: [150, 90] },
  { kcal: 717, mix: [3, 4, 3], lines: [170, 120] },
  { kcal: 630, mix: [4, 3, 3], lines: [120, 150] },
];
const MACRO_BG = ['bg-protein', 'bg-carbs', 'bg-fat'];
const BAR_INNER = 528; // alto útil de la barra (540 menos el relleno)
const SCALE = 2150 * 1.25; // la meta queda al 80 % de la barra
const segHeight = (kcal: number) => (kcal / SCALE) * BAR_INNER - 3;

type Item = { id: number; kind: 'me' | 'receipt'; meal: number };
type Fly = { meal: number; x: number; y: number; dx: number; dy: number; go: boolean };

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MacroPill = ({ mix }: { mix: number[] }) => (
  <span className="flex h-3 w-16 flex-none gap-0.5 overflow-hidden rounded-md">
    {mix.map((m, i) => <span key={i} className={`block h-full ${MACRO_BG[i]}`} style={{ flex: m }} />)}
  </span>
);

const Segment = ({ meal }: { meal: number }) => {
  const [h, setH] = useState(reducedMotion() ? segHeight(MEALS[meal].kcal) : 0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setH(segHeight(MEALS[meal].kcal))));
    return () => cancelAnimationFrame(raf);
  }, [meal]);
  return (
    <div className="flex flex-none flex-col-reverse overflow-hidden rounded-xl transition-[height] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]" style={{ height: h }}>
      {MEALS[meal].mix.map((m, i) => <span key={i} className={`block w-full ${MACRO_BG[i]}`} style={{ flex: m }} />)}
    </div>
  );
};

const Receipt = ({ meal, pillRef }: { meal: number; pillRef?: (el: HTMLDivElement | null) => void }) => (
  <div className="grid w-[300px] flex-none animate-[dvin_.45s_cubic-bezier(.2,.8,.2,1)_both] gap-2.5 rounded-[14px] bg-card px-4 pb-3 pt-3.5">
    <div className="flex items-center gap-2.5">
      <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-volt">
        <svg viewBox="0 0 24 24" fill="none" stroke="rgb(var(--ink))" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]"><path d="m5 12 5 5 9-10" /></svg>
      </span>
      <span className="h-[11px] w-[120px] rounded-md bg-ink" />
    </div>
    {[110, 80, 130].map((w) => (
      <div key={w} className="flex items-center gap-2">
        <i className="block h-[9px] flex-none rounded-[5px] bg-leader" style={{ width: w }} />
        <span className="flex-1 border-b-2 border-dotted border-leader-soft" />
        <b className="h-[11px] w-7 flex-none rounded-[5px] bg-ink" />
      </div>
    ))}
    <div className="flex items-center justify-between border-t border-line pt-2.5">
      <div ref={pillRef}><MacroPill mix={MEALS[meal].mix} /></div>
      <span className="h-4 w-[74px] rounded-md bg-ink" />
    </div>
  </div>
);

export const AuthShowcase = () => {
  const reduced = reducedMotion();
  const [items, setItems] = useState<Item[]>(reduced ? [{ id: 1, kind: 'me', meal: 2 }, { id: 2, kind: 'receipt', meal: 2 }] : []);
  const [segments, setSegments] = useState<number[]>(reduced ? [0, 1, 2] : []);
  const [fly, setFly] = useState<Fly | null>(null);
  const [fading, setFading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lastPill = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    let id = 0;
    const add = (kind: Item['kind'], meal: number) => setItems((list) => [...list, { id: ++id, kind, meal }].slice(-5));

    (async () => {
      while (alive) {
        setFading(false); setItems([]); setSegments([]);
        await wait(400);
        for (let meal = 0; meal < MEALS.length && alive; meal++) {
          add('me', meal);
          await wait(650);
          add('receipt', meal);
          await wait(800);
          const root = rootRef.current, bar = barRef.current, pill = lastPill.current;
          if (!alive || !root || !bar || !pill) break;
          // La ficha sale del recibo y cae sobre lo que ya se llenó de la barra.
          const R = root.getBoundingClientRect(), from = pill.getBoundingClientRect(), B = bar.getBoundingClientRect();
          const filled = [...bar.children].reduce((sum, c) => sum + (c as HTMLElement).offsetHeight + 3, 0);
          const x = from.left - R.left, y = from.top - R.top;
          setFly({ meal, x, y, dx: B.left - R.left + 10 - x, dy: B.bottom - R.top - 6 - filled - 14 - y, go: false });
          await frame();
          setFly((f) => (f ? { ...f, go: true } : f));
          await wait(720);
          setFly(null);
          setSegments((s) => [...s, meal]);
          await wait(980);
        }
        await wait(2600);
        setFading(true);
        await wait(700);
      }
    })();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [reduced]);

  const lastReceiptId = [...items].reverse().find((i) => i.kind === 'receipt')?.id;
  const fadeStyle: CSSProperties = { opacity: fading ? 0 : 1, transition: 'opacity .5s' };

  return (
    <div className="relative hidden place-items-center overflow-hidden bg-ink lg:grid" role="img"
      aria-label="Animación: un mensaje del chat se vuelve recibo y llena la barra del día hasta la meta">
      <div className="absolute inset-0 bg-[radial-gradient(rgb(var(--night-rule))_1.2px,transparent_1.2px)] bg-[length:22px_22px] opacity-90" />
      <div ref={rootRef} className="relative grid h-[540px] grid-cols-[320px_84px] items-end gap-16" aria-hidden="true">
        <div
          className="flex h-[540px] flex-col justify-end gap-3.5 overflow-hidden"
          style={{ ...fadeStyle, maskImage: 'linear-gradient(to bottom, transparent 0, #000 110px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 110px)' }}
        >
          {items.map((item) =>
            item.kind === 'me' ? (
              <div key={item.id} className="grid w-[210px] flex-none animate-[dvin_.45s_cubic-bezier(.2,.8,.2,1)_both] gap-2 self-end rounded-[18px_18px_4px_18px] bg-paper px-4 py-3.5">
                {MEALS[item.meal].lines.map((w) => <i key={w} className="block h-[9px] rounded-[5px] bg-leader" style={{ width: w }} />)}
              </div>
            ) : (
              <Receipt key={item.id} meal={item.meal} pillRef={item.id === lastReceiptId ? (el) => { lastPill.current = el; } : undefined} />
            ),
          )}
        </div>
        <div className="relative h-[540px]">
          <div ref={barRef} className="absolute inset-0 flex flex-col-reverse gap-[3px] overflow-hidden rounded-[18px] bg-night-panel p-1.5" style={fadeStyle}>
            {segments.map((meal, i) => <Segment key={i} meal={meal} />)}
          </div>
          <div className="absolute -left-3.5 -right-3.5 top-[112px] border-t-2 border-dashed border-paper/90">
            <span className="absolute -right-1.5 -top-[7px] h-3 w-3 rounded-full bg-volt" />
          </div>
        </div>
        {fly && (
          <div
            className="absolute z-[3]"
            style={{
              left: fly.x, top: fly.y,
              transform: fly.go ? `translate(${fly.dx}px, ${fly.dy}px)` : undefined,
              opacity: fly.go ? 0 : 1,
              transition: 'transform .75s cubic-bezier(.5,0,.2,1), opacity .25s .6s',
            }}
          >
            <MacroPill mix={MEALS[fly.meal].mix} />
          </div>
        )}
      </div>
    </div>
  );
};
