import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useLogManager } from '../../hooks/useLogManager';
import { MEAL_LABELS } from '../../constants/meals';
import { formatClockTime, formatKcal } from '../../utils/format';
import type { ExerciseLog, MealLog } from '../../types';

const MACROS = [
  { key: 'proteinG', target: 'protein_target_g', label: 'Proteína', color: 'bg-protein' },
  { key: 'carbsG', target: 'carbs_target_g', label: 'Carbos', color: 'bg-carbs' },
  { key: 'fatG', target: 'fat_target_g', label: 'Grasas', color: 'bg-fat' },
] as const;

// Se usan solo si el perfil no trae metas (el fallo de metas por defecto se corrige en la fase 4).
const FALLBACK_TARGETS = { protein_target_g: 130, carbs_target_g: 230, fat_target_g: 70 };

type Row =
  | { kind: 'meal'; key: string; time?: string; label: string; kcal: number; items: MealLog[] }
  | { kind: 'exercise'; key: string; time?: string; label: string; kcal: number; item: ExerciseLog };

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Una fila por registro, como en la maqueta: "Almuerzo · arroz, pollo, jugo". */
const buildRows = (meals: MealLog[], exercises: ExerciseLog[]): Row[] => {
  const groups = new Map<string, MealLog[]>();
  for (const m of meals) {
    const key = m.source_message != null ? `msg-${m.source_message}-${m.meal_type ?? ''}` : `meal-${m.id}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  const rows: Row[] = [...groups].map(([key, items]) => ({
    kind: 'meal',
    key,
    time: items[0].occurred_at ?? items[0].created_at,
    label: `${MEAL_LABELS[items[0].meal_type ?? 'other'] ?? 'Comida'} · ${items.map((i) => lowerFirst(i.name)).join(', ')}`,
    kcal: items.reduce((sum, i) => sum + i.calories, 0),
    items,
  }));
  for (const e of exercises) {
    rows.push({
      kind: 'exercise',
      key: `ex-${e.id}`,
      time: e.occurred_at ?? e.created_at,
      label: e.duration_minutes ? `${e.name} · ${e.duration_minutes} min` : e.name,
      kcal: e.calories_burned,
      item: e,
    });
  }
  return rows.sort((a, b) => new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime());
};

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-[15px] w-[15px]" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
const ChevronIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const delBtn = 'grid h-[26px] w-[26px] flex-none place-items-center rounded-lg text-[#8C8E93] hover:bg-night-track hover:text-paper disabled:opacity-40';

export const DayScore = () => {
  const { dailyProgress, user } = useAppStore();
  const { meals, exercises, deleteMeal, deleteExercise } = useLogManager();
  const isAiTyping = useAppStore((s) => s.isAiTyping);
  const [open, setOpen] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ text: string; burn: boolean; on: boolean }>({ text: '', burn: false, on: false });

  const profile = user?.profile;
  const target = profile?.daily_calorie_target ?? dailyProgress.calorieTarget;
  const remaining = target - dailyProgress.caloriesConsumed + dailyProgress.caloriesBurned;
  const over = remaining < 0;
  const rows = useMemo(() => buildRows(meals, exercises), [meals, exercises]);
  const macros = MACROS.map((m) => ({ ...m, value: dailyProgress[m.key], goal: profile?.[m.target] ?? FALLBACK_TARGETS[m.target] }));

  // Aviso breve en la barra compacta tras registrar: "+604" (comida) o "−210" (ejercicio).
  // Se compara contra los totales de cuando la IA empezó a responder, para no avisar al cargar el día.
  const before = useRef<{ eaten: number; burned: number } | null>(null);
  useEffect(() => {
    if (isAiTyping) before.current = { eaten: dailyProgress.caloriesConsumed, burned: dailyProgress.caloriesBurned };
  }, [isAiTyping]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const b = before.current;
    if (!b) return;
    const ate = dailyProgress.caloriesConsumed - b.eaten;
    const burned = dailyProgress.caloriesBurned - b.burned;
    if (ate <= 0 && burned <= 0) return;
    before.current = null;
    setFlash({ text: ate > 0 ? `+${formatKcal(ate)}` : `−${formatKcal(burned)}`, burn: ate <= 0, on: true });
    const t = window.setTimeout(() => setFlash((f) => ({ ...f, on: false })), 1500);
    return () => window.clearTimeout(t);
  }, [dailyProgress.caloriesConsumed, dailyProgress.caloriesBurned]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const remove = async (id: string, action: () => Promise<void>) => {
    setDeleting(id);
    try { await action(); } finally { setDeleting(null); }
  };

  return (
    <div className="relative">
      {/* Barra compacta: siempre visible, ocupa poco para dejar espacio al chat */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="day-detail"
        aria-label={`${over ? 'Te pasaste por' : 'Quedan'} ${formatKcal(Math.abs(remaining))} kcal. Ver detalle del día`}
        className="mx-2.5 mt-1 flex h-12 w-[calc(100%-20px)] items-center gap-2.5 rounded-[14px] bg-ink pl-3.5 pr-3 text-left text-paper"
      >
        <span className="font-num text-[11.5px] font-semibold uppercase tracking-[.12em] text-night-muted">
          {over ? 'Te pasaste' : 'Quedan'}
        </span>
        <span className="num relative whitespace-nowrap text-[28px] font-extrabold leading-none">
          <span key={remaining} className="inline-block animate-[tick_.45s_cubic-bezier(.2,.8,.2,1)]">
            {formatKcal(Math.abs(remaining))}
          </span>
          <small className="ml-[3px] text-[13px] font-semibold tracking-[.02em] text-night-muted">kcal</small>
          <span
            aria-hidden="true"
            className={`absolute left-full top-[2px] ml-1.5 rounded-full px-[7px] py-[3px] text-[13px] font-bold leading-[1.4] transition duration-300 ${
              flash.on ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            } ${flash.burn ? 'bg-volt text-ink' : 'bg-night-rule text-paper'}`}
          >
            {flash.text}
          </span>
        </span>
        <span className="grid min-w-0 flex-1 grid-cols-3 gap-[5px]" aria-hidden="true">
          {macros.map((m) => (
            <span key={m.key} className="h-1 overflow-hidden rounded bg-night-track">
              <span
                className={`block h-full rounded ${m.color} transition-[width] duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)]`}
                style={{ width: `${Math.min(100, (m.value / m.goal) * 100)}%` }}
              />
            </span>
          ))}
        </span>
        <ChevronIcon className="h-4 w-4 flex-none text-night-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-paper/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <section
            id="day-detail"
            role="dialog"
            aria-label="Detalle del día"
            className="absolute inset-x-0 top-0 z-40 mx-2.5 mt-1 rounded-[20px] bg-ink px-[18px] pb-3 pt-3.5 text-paper shadow-[0_18px_40px_-14px_rgb(var(--ink)/0.5)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="block w-full text-left"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="font-num text-[12.5px] font-semibold uppercase tracking-[.12em] text-night-muted">
                    {over ? 'Te pasaste por' : 'Quedan hoy'}
                  </div>
                  <div className="num text-[66px] font-extrabold leading-[.86] tracking-[-.01em]">
                    <span key={remaining} className="inline-block animate-[tick_.45s_cubic-bezier(.2,.8,.2,1)]">
                      {formatKcal(Math.abs(remaining))}
                    </span>
                    <small className="ml-1 text-[20px] font-semibold tracking-[.02em] text-night-muted">kcal</small>
                  </div>
                </div>
                <div className="text-right text-[12.5px] leading-[1.5] text-night-muted">
                  Meta <span className="num text-base font-semibold text-paper">{formatKcal(target)}</span><br />
                  Comido <span className="num text-base font-semibold text-paper">{formatKcal(dailyProgress.caloriesConsumed)}</span><br />
                  Ejercicio <span className="num text-base font-semibold text-paper">{dailyProgress.caloriesBurned > 0 ? '−' : ''}{formatKcal(dailyProgress.caloriesBurned)}</span>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-3">
                {macros.map(({ value, goal, ...m }) => {
                  return (
                    <div key={m.key}>
                      <div className="flex justify-between text-xs text-night-text">
                        <span>{m.label}</span>
                        <span><span className="num text-sm font-semibold text-paper">{Math.round(value)}</span> / {goal} g</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded bg-night-track">
                        <span
                          className={`block h-full rounded ${m.color} transition-[width] duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)]`}
                          style={{ width: `${Math.min(100, (value / goal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[12.5px] text-night-muted">
                {rows.length ? 'Ocultar registros' : 'Aún no hay registros hoy'}
                <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
              </div>
            </button>

            {rows.length > 0 && (
              <ul id="day-entries" className="mt-2.5 max-h-[38vh] overflow-y-auto border-t border-night-track">
                {rows.map((row) => {
                  const expandable = row.kind === 'meal' && row.items.length > 1;
                  const expanded = openRow === row.key;
                  return (
                    <li key={row.key} className="border-b border-night-rule">
                      <div className="flex items-center gap-2.5 py-[9px] text-sm">
                        <span className="num w-[38px] flex-none text-sm text-night-muted">{formatClockTime(row.time)}</span>
                        <span className="min-w-0 flex-1 truncate">{row.label}</span>
                        <span className={`num text-base font-semibold ${row.kind === 'exercise' ? 'text-volt' : ''}`}>
                          {row.kind === 'exercise' ? '−' : ''}{formatKcal(row.kcal)}
                        </span>
                        {expandable ? (
                          <button
                            type="button"
                            onClick={() => setOpenRow(expanded ? null : row.key)}
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Ocultar ingredientes' : 'Ver ingredientes para borrar'}
                            className={delBtn}
                          >
                            <ChevronIcon className={`h-[15px] w-[15px] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={deleting !== null}
                            aria-label={`Borrar ${row.label}`}
                            onClick={() =>
                              row.kind === 'meal'
                                ? remove(row.key, () => deleteMeal(row.items[0].id!))
                                : remove(row.key, () => deleteExercise(row.item.id!))
                            }
                            className={delBtn}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      {expandable && expanded && (
                        <ul className="pb-2 pl-12">
                          {row.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-2.5 py-1 text-[13px] text-night-text">
                              <span className="min-w-0 flex-1 truncate">{item.name}</span>
                              <span className="num text-sm text-paper">{formatKcal(item.calories)}</span>
                              <button
                                type="button"
                                disabled={deleting !== null}
                                aria-label={`Borrar ${item.name}`}
                                onClick={() => remove(`m-${item.id}`, () => deleteMeal(item.id!))}
                                className={delBtn}
                              >
                                <TrashIcon />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

