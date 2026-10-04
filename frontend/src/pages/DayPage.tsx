import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { ChatMessage } from '../components/chat/ChatMessage';
import { EmptyNote, Kpi, MacroRows, SectionTitle } from '../components/progress/parts';
import { formatKcal } from '../utils/format';
import { targetsOf } from '../utils/targets';
import { remainingByMessage } from '../utils/remaining';
import { longDay, relativeDay, todayIso } from '../utils/days';
import type { ChatSession, DayHistory, ExerciseLog, MealLog } from '../types';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
    <path d="m15 6-6 6 6 6" />
  </svg>
);

/** Un día del Diario: resumen, macros y su conversación (solo lectura). */
export const DayPage = () => {
  const { date = '' } = useParams();
  const goals = targetsOf(useAppStore((s) => s.user?.profile));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const day = useQuery({
    queryKey: ['day', date],
    queryFn: async () => (await api.get<{ days: DayHistory[] }>(`/dashboard/history/?start_date=${date}&end_date=${date}`)).data.days[0],
    enabled: valid,
  });
  const session = useQuery({
    queryKey: ['day-session', date],
    queryFn: async () => {
      try {
        return (await api.get<ChatSession>(`/chat/sessions/${date}/`)).data;
      } catch (e) {
        if ((e as AxiosError)?.response?.status === 404) return null; // ese día no hubo conversación
        throw e;
      }
    },
    enabled: valid,
  });
  const meals = useQuery({ queryKey: ['day-meals', date], queryFn: async () => (await api.get<{ logs: MealLog[] }>(`/nutrition/date/${date}/`)).data.logs, enabled: valid });
  const exercises = useQuery({ queryKey: ['day-exercises', date], queryFn: async () => (await api.get<{ logs: ExerciseLog[] }>(`/exercise/date/${date}/`)).data.logs, enabled: valid });

  const messages = session.data?.messages ?? [];
  const remaining = useMemo(
    () => remainingByMessage(messages, meals.data ?? [], exercises.data ?? [], goals.kcal),
    [messages, meals.data, exercises.data, goals.kcal],
  );

  if (!valid) return <Navigate to="/sessions" replace />;
  if (date === todayIso()) return <Navigate to="/" replace />;

  const d = day.data;
  const rel = relativeDay(date);
  const diff = d ? d.net_calories - goals.kcal : 0;

  return (
    <div className="flex flex-col">
      <ScreenHeader>
        <Link to="/sessions" className="inline-flex items-center gap-0.5 text-sm font-semibold text-ink-2">
          <BackIcon />Diario
        </Link>
      </ScreenHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-[18px] pb-[18px] pt-2">
        <h1 className="font-num text-[26px] font-extrabold uppercase leading-none">
          {rel ? `${rel} · ` : ''}{longDay(date)}
        </h1>

        {day.isLoading ? (
          <EmptyNote>Cargando…</EmptyNote>
        ) : day.isError || !d ? (
          <EmptyNote>No se pudo cargar este día. Revisa tu conexión e intenta de nuevo.</EmptyNote>
        ) : (
          <>
            <Kpi
              label="Calorías netas"
              value={d.net_calories}
              sub={
                <>
                  <b className="font-semibold">{formatKcal(Math.abs(diff))} kcal</b> {diff <= 0 ? 'por debajo' : 'por encima'} de tu meta de {formatKcal(goals.kcal)}.
                  {' '}Comiste {formatKcal(d.calories_consumed)}{d.calories_burned > 0 ? ` y quemaste ${formatKcal(d.calories_burned)}` : ''}.
                </>
              }
            />
            <section>
              <SectionTitle aside="meta de tu perfil">Macros del día</SectionTitle>
              <MacroRows
                values={{ protein: d.protein_g, carbs: d.carbs_g, fat: d.fat_g }}
                goals={{ protein: goals.protein, carbs: goals.carbs, fat: goals.fat }}
              />
            </section>
          </>
        )}

        <section>
          <SectionTitle>Conversación</SectionTitle>
          {session.isLoading ? (
            <EmptyNote>Cargando…</EmptyNote>
          ) : messages.length ? (
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <ChatMessage key={m.id ?? i} message={m} remaining={m.id != null ? remaining.get(m.id) : undefined} />
              ))}
            </div>
          ) : (
            <EmptyNote>Ese día no hubo conversación en el chat.</EmptyNote>
          )}
        </section>

        <p className="border-t border-line pt-3 text-[13px] text-muted">
          ¿Olvidaste algo? Cuéntaselo al chat en Hoy, por ejemplo: «el {longDay(date).split(' ')[0].toLowerCase()} en la noche cené salmón al horno con espárragos».
        </p>
      </div>
    </div>
  );
};
