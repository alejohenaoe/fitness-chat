import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { useLogManager } from '../hooks/useLogManager';
import { buildDayRows } from '../utils/dayRows';
import { targetsOf } from '../utils/targets';
import { formatClockTime, formatKcal } from '../utils/format';
import { CaloriesChart, type ChartDay } from '../components/progress/CaloriesChart';
import { EmptyNote, Kpi, Ledger, MacroRows, SectionTitle } from '../components/progress/parts';
import type { DayHistory, ExerciseLog, PeriodSummary } from '../types';

const PERIODS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
] as const;
type PeriodKey = (typeof PERIODS)[number]['key'];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const todayIso = () => format(new Date(), 'yyyy-MM-dd');
const shortDate = (iso: string) => format(parseISO(iso), 'd MMM', { locale: es }).replace('.', '');
const weekdayName = (iso: string) => format(parseISO(iso), 'EEEE', { locale: es });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ProgressPage = () => {
  const [params, setParams] = useSearchParams();
  const requested = params.get('periodo');
  const period: PeriodKey = PERIODS.some((p) => p.key === requested) ? (requested as PeriodKey) : 'hoy';

  return (
    <div className="flex flex-col">
      <header className="px-[18px] pb-1 pt-2">
        <h1 className="font-num text-[30px] font-extrabold uppercase leading-none tracking-[.01em]">Progreso</h1>
        <div role="group" aria-label="Periodo" className="mb-1 mt-3 grid grid-cols-3 rounded-xl bg-line-2 p-[3px]">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              aria-pressed={period === key}
              onClick={() => setParams(key === 'hoy' ? {} : { periodo: key }, { replace: true })}
              className={`rounded-[9px] py-[7px] text-sm font-semibold ${
                period === key ? 'bg-card text-ink shadow-[0_1px_2px_rgb(var(--ink)/0.12)]' : 'text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-[18px] pb-[18px] pt-2">
        {period === 'hoy' ? <TodayView /> : <PeriodView key={period} days={period === 'semana' ? 7 : 30} />}
      </div>
    </div>
  );
};

/* ---------------- Hoy ---------------- */

const TodayView = () => {
  const { dailyProgress, user } = useAppStore();
  const { meals, exercises } = useLogManager();
  const goals = targetsOf(user?.profile);
  const rows = useMemo(() => buildDayRows(meals, exercises), [meals, exercises]);
  const mealRows = rows.filter((r) => r.kind === 'meal');
  const exerciseRows = rows.filter((r) => r.kind === 'exercise');
  const remaining = goals.kcal - dailyProgress.caloriesConsumed + dailyProgress.caloriesBurned;

  return (
    <>
      <Kpi
        label={`Comido hoy · ${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}`}
        value={dailyProgress.caloriesConsumed}
        sub={
          <>
            {dailyProgress.caloriesBurned > 0 && <>Ejercicio −{formatKcal(dailyProgress.caloriesBurned)} · </>}
            {remaining >= 0 ? <>quedan <b className="font-semibold">{formatKcal(remaining)} kcal</b></> : <>te pasaste por <b className="font-semibold">{formatKcal(-remaining)} kcal</b></>}{' '}
            de tu meta de {formatKcal(goals.kcal)}.
          </>
        }
      />

      <section>
        <SectionTitle aside="meta de tu perfil">Macros de hoy</SectionTitle>
        <MacroRows
          values={{ protein: dailyProgress.proteinG, carbs: dailyProgress.carbsG, fat: dailyProgress.fatG }}
          goals={{ protein: goals.protein, carbs: goals.carbs, fat: goals.fat }}
        />
      </section>

      <section>
        <SectionTitle aside={mealRows.length ? `${plural(mealRows.length, 'registro', 'registros')} · ${formatKcal(dailyProgress.caloriesConsumed)} kcal` : undefined}>
          Comidas
        </SectionTitle>
        {mealRows.length ? (
          <Ledger wideLead rows={mealRows.map((r) => ({ key: r.key, lead: formatClockTime(r.time), label: r.label, value: formatKcal(r.kcal) }))} />
        ) : (
          <EmptyNote>Aún no registras comidas hoy. Cuéntaselo al chat en la pestaña Hoy.</EmptyNote>
        )}
      </section>

      <section>
        <SectionTitle aside={exerciseRows.length ? `${plural(exerciseRows.length, 'sesión', 'sesiones')} · ${formatKcal(dailyProgress.caloriesBurned)} kcal` : undefined}>
          Ejercicio
        </SectionTitle>
        {exerciseRows.length ? (
          <Ledger wideLead rows={exerciseRows.map((r) => ({ key: r.key, lead: formatClockTime(r.time), label: r.label, value: formatKcal(r.kcal) }))} />
        ) : (
          <EmptyNote>Sin ejercicio registrado hoy.</EmptyNote>
        )}
      </section>
    </>
  );
};

/* ---------------- Semana / Mes ---------------- */

type HistoryResponse = { days: DayHistory[]; calorie_target: number; period_summary: PeriodSummary };

const PeriodView = ({ days }: { days: 7 | 30 }) => {
  const user = useAppStore((s) => s.user);
  const goals = targetsOf(user?.profile);
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const range = custom && start && end ? { start, end } : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['history', days, range?.start, range?.end],
    queryFn: async () =>
      (await api.get<HistoryResponse>(range ? `/dashboard/history/?start_date=${range.start}&end_date=${range.end}` : `/dashboard/history/?days=${days}`)).data,
    staleTime: 60_000,
    enabled: !custom || !!range,
  });

  // El detalle de ejercicios solo existe para los últimos 7 días (/exercise/summary/).
  const showExerciseList = days === 7 && !range;
  const { data: exerciseData } = useQuery({
    queryKey: ['exercise-summary'],
    queryFn: async () => (await api.get<{ total_burned: number; logs: ExerciseLog[] }>('/exercise/summary/')).data,
    staleTime: 60_000,
    enabled: showExerciseList,
  });

  const today = todayIso();
  const list = data?.days ?? [];
  const target = data?.calorie_target ?? goals.kcal;
  // El promedio solo cuenta días completos con registros: hoy va en curso (por eso
  // el promedio del servidor, que sí incluye hoy, salía más bajo de lo real).
  const complete = list.filter((d) => d.date !== today && d.meals_count > 0);
  const includesToday = list.some((d) => d.date === today);
  const avg = (key: 'net_calories' | 'protein_g' | 'carbs_g' | 'fat_g') =>
    complete.length ? complete.reduce((s, d) => s + d[key], 0) / complete.length : 0;
  const avgKcal = complete.length ? Math.round(avg('net_calories')) : null;
  const pastDays = list.filter((d) => d.date !== today).length;
  const sessions = list.reduce((s, d) => s + d.exercises_count, 0);
  const burned = list.reduce((s, d) => s + d.calories_burned, 0);

  const chartDays: ChartDay[] = list.map((d) => ({
    date: d.date,
    label: list.length > 10 ? format(parseISO(d.date), 'd') : WEEKDAYS[parseISO(d.date).getDay()],
    value: d.net_calories,
    today: d.date === today,
  }));

  const diff = avgKcal === null ? 0 : avgKcal - target;

  return (
    <>
      <div className="-mt-2">
        <button
          type="button"
          onClick={() => setCustom((c) => !c)}
          className="text-[13px] font-semibold text-ink-2 underline decoration-line underline-offset-4"
        >
          {custom ? `Volver a ${days === 7 ? 'la semana' : 'el mes'}` : 'Elegir fechas'}
        </button>
        {custom && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <label className="sr-only" htmlFor="range-start">Desde</label>
            <input id="range-start" type="date" value={start} max={end || today} onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-line bg-card px-3 py-1.5" />
            <span className="text-muted">a</span>
            <label className="sr-only" htmlFor="range-end">Hasta</label>
            <input id="range-end" type="date" value={end} min={start} max={today} onChange={(e) => setEnd(e.target.value)}
              className="rounded-lg border border-line bg-card px-3 py-1.5" />
          </div>
        )}
      </div>

      {custom && !range ? (
        <EmptyNote>Elige la fecha de inicio y la de fin.</EmptyNote>
      ) : isLoading ? (
        <EmptyNote>Cargando…</EmptyNote>
      ) : isError ? (
        <EmptyNote>No se pudo cargar el progreso. Revisa tu conexión e intenta de nuevo.</EmptyNote>
      ) : (
        <>
          <Kpi
            label={complete.length ? `Promedio diario · ${shortDate(complete[0].date)} – ${shortDate(complete[complete.length - 1].date)}` : 'Promedio diario'}
            value={avgKcal}
            sub={
              avgKcal === null ? (
                'Aún no hay días completos registrados en este periodo.'
              ) : (
                <>
                  {diff === 0 ? (
                    <>Justo en tu meta de {formatKcal(target)}.</>
                  ) : (
                    <>
                      <b className="font-semibold">{formatKcal(Math.abs(diff))} kcal</b> {diff < 0 ? 'por debajo' : 'por encima'} de tu meta de {formatKcal(target)}.
                    </>
                  )}
                  {includesToday && <> Hoy ({weekdayName(today)}) va en curso y no cuenta en el promedio.</>}
                  {complete.length < pastDays && <> Registraste {complete.length} de {pastDays} días.</>}
                  {(data?.period_summary.streak_days ?? 0) > 1 && <> Racha: {data!.period_summary.streak_days} días seguidos.</>}
                </>
              )
            }
          />

          <CaloriesChart days={chartDays} target={target} />

          <section>
            <SectionTitle aside="meta de tu perfil">Macros promedio</SectionTitle>
            {complete.length ? (
              <MacroRows
                values={{ protein: avg('protein_g'), carbs: avg('carbs_g'), fat: avg('fat_g') }}
                goals={{ protein: goals.protein, carbs: goals.carbs, fat: goals.fat }}
              />
            ) : (
              <EmptyNote>Sin días completos para promediar.</EmptyNote>
            )}
          </section>

          <section>
            <SectionTitle aside={sessions ? `${plural(sessions, 'sesión', 'sesiones')} · ${formatKcal(burned)} kcal` : undefined}>Ejercicio</SectionTitle>
            {!sessions ? (
              <EmptyNote>Sin ejercicio registrado en este periodo.</EmptyNote>
            ) : showExerciseList && exerciseData?.logs.length ? (
              <Ledger
                rows={[...exerciseData.logs]
                  .sort((a, b) => (a.occurred_at ?? '').localeCompare(b.occurred_at ?? ''))
                  .map((e) => ({
                    key: String(e.id),
                    lead: e.occurred_at ? WEEKDAYS[new Date(e.occurred_at).getDay()] : '',
                    label: e.duration_minutes ? `${e.name} · ${e.duration_minutes} min` : e.name,
                    value: formatKcal(e.calories_burned),
                  }))}
              />
            ) : !showExerciseList ? (
              <EmptyNote>El detalle de cada sesión está en Semana.</EmptyNote>
            ) : null}
          </section>
        </>
      )}
    </>
  );
};
