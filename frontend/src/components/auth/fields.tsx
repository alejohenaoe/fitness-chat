import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import type { ProfileOption } from '../../constants/profileOptions';

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="mt-px h-[18px] w-[18px] flex-none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" />
  </svg>
);

export const Banner = ({ children }: { children: ReactNode }) => (
  <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger-ink">
    <AlertIcon />
    <span>{children}</span>
  </div>
);

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div className="font-num text-[12.5px] font-semibold uppercase tracking-[.12em] text-muted">{children}</div>
);

export const Title = ({ children, lede }: { children: ReactNode; lede?: ReactNode }) => (
  <div>
    <h1 className="mt-1 font-num text-[40px] font-extrabold uppercase leading-[.95]">{children}</h1>
    {lede && <p className="mt-1.5 text-ink-2">{lede}</p>}
  </div>
);

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  unit?: string;
  compact?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

/** Campo con etiqueta arriba, como en la maqueta. `compact`: números grandes en tres columnas (edad, peso, estatura). */
export const Field = ({ id, label, error, hint, unit, compact, type, ...input }: FieldProps) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">{label}</label>
      <div
        className={`flex items-center rounded-[14px] border bg-card focus-within:border-ink ${
          compact ? 'min-h-[54px] gap-1 px-2.5' : 'min-h-[50px] gap-2 px-3.5'
        } ${error ? 'border-danger shadow-[inset_0_0_0_1px_rgb(var(--danger))]' : 'border-line'}`}
      >
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          // 16 px evita que el iPhone haga zoom al tocar el campo.
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted ${
            compact ? 'num w-full py-2 text-2xl font-bold' : 'py-3 text-base'
          }`}
          {...input}
        />
        {unit && <span className="num text-sm font-semibold text-muted">{unit}</span>}
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="text-[13px] font-semibold text-ink-2">
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      {error ? (
        <span id={`${id}-msg`} className="text-[12.5px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span id={`${id}-msg`} className="text-[12.5px]">{hint}</span>
      ) : null}
    </div>
  );
};

export const PrimaryButton = ({ children, busy, volt, ...props }: { children: ReactNode; busy?: boolean; volt?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    aria-busy={busy}
    disabled={busy || props.disabled}
    className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold disabled:opacity-75 ${
      volt ? 'bg-volt text-ink' : 'bg-ink text-paper'
    }`}
  >
    {busy && <span className="h-4 w-4 animate-spin rounded-full border-[2.5px] border-paper/30 border-t-paper [animation-duration:.8s]" />}
    {children}
  </button>
);

export const TextLink = ({ children, ...props }: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" {...props} className="font-bold text-ink underline decoration-leader underline-offset-[3px]">
    {children}
  </button>
);

const Option = ({ label, detail, selected, onSelect }: { label: string; detail: string; selected: boolean; onSelect: () => void }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`flex w-full items-center gap-3 rounded-[14px] border bg-card px-3.5 py-2.5 text-left ${
      selected ? 'border-ink shadow-[inset_0_0_0_1px_rgb(var(--ink))]' : 'border-line'
    }`}
  >
    <span>
      <span className="block text-[15px] font-semibold">{label}</span>
      <span className="block text-[12.5px] text-muted">{detail}</span>
    </span>
    <span className={`ml-auto grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${selected ? 'border-ink bg-ink' : 'border-line'}`}>
      {selected && <span className="h-2 w-2 rounded-full bg-volt" />}
    </span>
  </button>
);

export const Choices = ({ label, options, value, error, onChange }: { label: string; options: ProfileOption[]; value: string; error?: string; onChange: (v: string) => void }) => (
  <div className="grid gap-1.5">
    <span id={`${label}-label`} className="text-[13px] font-semibold text-ink-2">{label}</span>
    <div role="radiogroup" aria-labelledby={`${label}-label`} className="grid gap-2">
      {options.map((o) => <Option key={o.value} label={o.label} detail={o.detail ?? ''} selected={value === o.value} onSelect={() => onChange(o.value)} />)}
    </div>
    {error && <span className="text-[12.5px] font-medium text-danger">{error}</span>}
  </div>
);

/** Selector de una opción en fila (género), como el de Progreso. */
export const Segmented = ({ id, label, options, value, error, onChange }: { id: string; label: string; options: ProfileOption[]; value: string; error?: string; onChange: (v: string) => void }) => (
  <div className="grid gap-1.5">
    <span id={`${id}-label`} className="text-[13px] font-semibold text-ink-2">{label}</span>
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="grid grid-cols-3 rounded-xl bg-line-2 p-[3px]">
      {options.map((g) => (
        <button key={g.value} type="button" role="radio" aria-checked={value === g.value} onClick={() => onChange(g.value)}
          className={`rounded-[9px] py-2.5 text-[14.5px] font-semibold ${value === g.value ? 'bg-card text-ink shadow-[0_1px_2px_rgb(var(--ink)/0.12)]' : 'text-muted'}`}>
          {g.label}
        </button>
      ))}
    </div>
    {error && <span className="text-[12.5px] font-medium text-danger">{error}</span>}
  </div>
);
