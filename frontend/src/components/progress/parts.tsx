import type { ReactNode } from 'react';
import { formatKcal } from '../../utils/format';

/** Encabezado de sección: "MACROS PROMEDIO ........ meta de tu perfil". */
export const SectionTitle = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => (
  <h3 className="mb-2 flex items-baseline justify-between gap-3 font-num text-[13px] font-bold uppercase tracking-[.1em]">
    {children}
    {aside && <span className="font-sans text-[12.5px] font-semibold normal-case leading-[inherit] tracking-[.04em] text-muted">{aside}</span>}
  </h3>
);

/** Cifra principal de la pantalla: etiqueta, número grande y una línea de contexto. */
export const Kpi = ({ label, value, sub }: { label: string; value: number | null; sub: ReactNode }) => (
  <div>
    <div className="font-num text-[12.5px] font-semibold uppercase tracking-[.12em] text-muted">{label}</div>
    <div className="num text-[66px] font-extrabold leading-[.86] tracking-[-.01em]">
      {value === null ? '—' : formatKcal(value)}
      <small className="ml-1 text-[20px] font-semibold tracking-[.02em] text-muted">kcal</small>
    </div>
    <div className="mt-1 text-[13.5px] text-ink-2">{sub}</div>
  </div>
);

const MACRO_ROWS = [
  { key: 'protein', label: 'Proteína', color: 'bg-protein' },
  { key: 'carbs', label: 'Carbohidratos', color: 'bg-carbs' },
  { key: 'fat', label: 'Grasas', color: 'bg-fat' },
] as const;

type Macros = { protein: number; carbs: number; fat: number };

/** Macros contra la meta del perfil, con la barra del color de cada macro. */
export const MacroRows = ({ values, goals }: { values: Macros; goals: Macros }) => (
  <div className="grid gap-3">
    {MACRO_ROWS.map((m) => (
      <div key={m.key}>
        <div className="flex items-baseline gap-2 text-[14.5px]">
          <span className={`h-[9px] w-[9px] flex-none -translate-y-px rounded-full ${m.color}`} />
          <span className="flex-1">{m.label}</span>
          <span className="num text-lg font-semibold">
            {Math.round(values[m.key])} <small className="text-sm font-medium text-muted">/ {goals[m.key]} g</small>
          </span>
        </div>
        <div className="relative mt-[5px] h-1.5 overflow-hidden rounded-md bg-line-2">
          <span className={`absolute inset-y-0 left-0 rounded-md ${m.color}`} style={{ width: `${Math.min(100, (values[m.key] / goals[m.key]) * 100)}%` }} />
        </div>
      </div>
    ))}
  </div>
);

/** Lista tipo recibo: "Lun  Pesas, tren superior ........ 310". */
export const Ledger = ({ rows, wideLead }: { rows: { key: string; lead?: string; label: string; value: string; accent?: boolean }[]; wideLead?: boolean }) => (
  <ul className="grid grid-cols-1">
    {rows.map((r) => (
      <li key={r.key} className="flex items-baseline gap-1.5 border-b border-line py-[7px] text-[14.5px]">
        {r.lead !== undefined && <span className={`${wideLead ? 'w-[38px]' : 'w-[30px]'} flex-none font-num text-muted`}>{r.lead}</span>}
        <span className="min-w-0 truncate">{r.label}</span>
        <span className="min-w-3 flex-1 -translate-y-1 border-b-[1.5px] border-dotted border-leader" />
        <span className={`num flex-none text-[17px] font-semibold ${r.accent ? 'text-volt-ink' : ''}`}>{r.value}</span>
      </li>
    ))}
  </ul>
);

export const EmptyNote = ({ children }: { children: ReactNode }) => <p className="text-[14.5px] text-muted">{children}</p>;
