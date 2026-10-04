import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { EmptyNote } from '../components/progress/parts';
import { formatKcal } from '../utils/format';
import { targetsOf } from '../utils/targets';
import { monthName, relativeDay, shortWeekday, todayIso } from '../utils/days';
import type { DayHistory } from '../types';

const PAGE = 30;

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-none text-muted" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "3 comidas · trote 5 km" a partir de los tipos de comida y ejercicios del día. */
const describe = (d: DayHistory) => {
  const meals = d.meal_types?.length ?? (d.meals_count ? 1 : 0);
  const parts: string[] = [];
  if (meals) parts.push(`${meals} ${meals === 1 ? 'comida' : 'comidas'}`);
  const names = d.exercise_names ?? [];
  parts.push(names.length ? names.map(lowerFirst).join(', ') : 'sin ejercicio');
  return parts.join(' · ');
};

const hasData = (d: DayHistory) => d.meals_count > 0 || d.exercises_count > 0;

export const DiaryPage = () => {
  const navigate = useNavigate();
  const goal = targetsOf(useAppStore((s) => s.user?.profile)).kcal;
  const [days, setDays] = useState(PAGE);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['diary', days],
    queryFn: async () => (await api.get<{ days: DayHistory[] }>(`/dashboard/history/?days=${days}`)).data.days,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  // Más reciente primero. Los días sin registros más antiguos que el primer registro no se muestran
  // (para alguien nuevo serían 30 filas vacías); los vacíos entre días con registros sí.
  const list = [...(data ?? [])].reverse();
  const lastWithData = list.map(hasData).lastIndexOf(true);
  const visible = list.slice(0, Math.max(lastWithData + 1, 1));
  const today = todayIso();

  let currentMonth = '';
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Diario" />
      <div className="mx-auto flex w-full max-w-3xl flex-col px-[18px] pb-[18px] pt-2">
        {isLoading ? (
          <EmptyNote>Cargando…</EmptyNote>
        ) : isError ? (
          <EmptyNote>No se pudo cargar el diario. Revisa tu conexión e intenta de nuevo.</EmptyNote>
        ) : lastWithData < 0 ? (
          <EmptyNote>Todavía no hay días registrados. Cuando le cuentes al chat lo que comes, aquí aparecerá cada día.</EmptyNote>
        ) : (
          <>
            <div className="flex items-center gap-2 text-[12.5px] text-muted">
              <span className="h-2.5 w-[1.5px] rounded-sm bg-ink" />tu meta de {formatKcal(goal)} kcal
            </div>
            {visible.map((d) => {
              const month = monthName(d.date);
              const header = month !== currentMonth ? month : null;
              currentMonth = month;
              const rel = relativeDay(d.date);
              const isToday = d.date === today;
              const empty = !hasData(d);
              return (
                <div key={d.date}>
                  {header && <div className="mb-5 mt-6 font-num text-[12.5px] font-semibold uppercase tracking-[.12em] text-muted">{header}</div>}
                  <button
                    type="button"
                    disabled={empty}
                    onClick={() => navigate(isToday ? '/' : `/sessions/${d.date}`)}
                    className="flex w-full items-center gap-3 border-b border-line py-[11px] text-left disabled:cursor-default"
                  >
                    <span className="w-10 flex-none leading-none">
                      <span className="block font-num text-[11.5px] font-semibold uppercase tracking-[.08em] text-muted">{rel || shortWeekday(d.date)}</span>
                      <span className={`mt-[3px] block font-num text-[26px] font-extrabold ${empty ? 'text-muted' : ''}`}>{Number(d.date.slice(8))}</span>
                    </span>
                    <span className="grid min-w-0 flex-1 gap-[7px]">
                      <span className={`truncate text-sm ${empty ? 'text-muted' : 'text-ink-2'}`}>
                        {empty ? 'Sin registros' : <>{isToday && <b className="font-semibold text-ink">En curso · </b>}{describe(d)}</>}
                      </span>
                      {!empty && (
                        <span className="relative h-1 rounded bg-line-2">
                          <i className={`absolute inset-y-0 left-0 rounded ${isToday ? 'bg-volt' : 'bg-ink'}`} style={{ width: `${Math.min(100, (d.net_calories / (goal * 1.25)) * 100)}%` }} />
                          {/* rayita de la meta: al 80 % del ancho (la barra llega hasta 125 % de la meta) */}
                          <span className="absolute -bottom-[3px] -top-[3px] left-[80%] w-[1.5px] rounded-sm bg-ink" />
                        </span>
                      )}
                    </span>
                    {!empty && (
                      <span className="num min-w-[50px] text-right text-xl font-bold leading-[1.05]">
                        {formatKcal(d.net_calories)}
                        <small className="block text-[11.5px] font-semibold tracking-[.02em] text-muted">kcal netas</small>
                      </span>
                    )}
                    {empty ? <span className="w-4" /> : <ChevronRight />}
                  </button>
                </div>
              );
            })}
            {/* Solo si el día más antiguo cargado tiene registros: puede haber más atrás. */}
            {lastWithData === list.length - 1 && (
              <button
                type="button"
                onClick={() => setDays((n) => n + PAGE)}
                disabled={isFetching}
                className="mt-3 self-center text-[13px] font-semibold text-ink-2 underline decoration-line underline-offset-4"
              >
                {isFetching ? 'Cargando…' : `Ver ${PAGE} días anteriores`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
