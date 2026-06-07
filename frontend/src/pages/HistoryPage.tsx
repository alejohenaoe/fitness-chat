import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../services/api';
import type { DayHistory, PeriodSummary } from '../types';
import { useAppStore } from '../stores/useAppStore';

type PeriodType = 'week' | 'month' | 'custom';

const fetchHistory = async (days: number, startDate?: string, endDate?: string) => {
  let url = `/dashboard/history/?days=${days}`;
  if (startDate && endDate) {
    url = `/dashboard/history/?start_date=${startDate}&end_date=${endDate}`;
  }
  const { data } = await api.get(url);
  return data as {
    days: DayHistory[];
    calorie_target: number;
    period_summary: PeriodSummary;
    previous_avg_calories: number;
  };
};

const shortDate = (iso: string) => format(parseISO(iso), 'd MMM', { locale: es });
const fullDate = (iso: string) => format(parseISO(iso), 'EEE d MMM', { locale: es });

const periodLabels: Record<PeriodType, string> = {
  week: 'Semana',
  month: 'Mes',
  custom: 'Personalizado',
};

export const HistoryPage = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const calorieTarget = useAppStore((s) => s.dailyProgress.calorieTarget);
  const profile = useAppStore((s) => s.user?.profile);

  const macroTargets = useMemo(() => ({
    protein: profile?.protein_target_g ?? 130,
    carbs: profile?.carbs_target_g ?? 230,
    fat: profile?.fat_target_g ?? 70,
  }), [profile]);

  const queryParams = useMemo(() => {
    if (period === 'custom' && customStart && customEnd) {
      return { days: 0, startDate: customStart, endDate: customEnd };
    }
    const d = period === 'month' ? 30 : 7;
    return { days: d, startDate: undefined as string | undefined, endDate: undefined as string | undefined };
  }, [period, customStart, customEnd]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['history', period, queryParams.days, queryParams.startDate, queryParams.endDate],
    queryFn: () => fetchHistory(queryParams.days, queryParams.startDate, queryParams.endDate),
    staleTime: 60_000,
    enabled: period !== 'custom' || (!!customStart && !!customEnd),
  });

  const daysData: DayHistory[] = data?.days ?? [];
  const target = data?.calorie_target ?? calorieTarget;
  const summary: PeriodSummary | undefined = data?.period_summary;
  const previousAvg: number = data?.previous_avg_calories ?? 0;

  const chartData = useMemo(() => daysData.map(d => ({
    ...d,
    normal_cal: Math.min(target, d.net_calories),
    excess_cal: Math.max(0, d.net_calories - target),
  })), [daysData, target]);

  const insight = useMemo(() => {
    if (!summary || previousAvg === 0) return null;
    const diff = summary.avg_calories - previousAvg;
    const pct = previousAvg > 0 ? Math.round((diff / previousAvg) * 100) : 0;
    const absPct = Math.abs(pct);
    if (absPct < 6) return { text: 'Sin cambios significativos vs el período anterior', up: null };
    if (pct > 0) return { text: `${absPct}% más alto que el período anterior`, up: true };
    return { text: `${absPct}% más bajo que el período anterior`, up: false };
  }, [summary, previousAvg]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-surface-100">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Cargando historial...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-surface-100">
        <p className="text-lg font-medium">Error al cargar el historial</p>
        <p className="text-sm">Intenta de nuevo más tarde.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-auto p-4 pb-8">

      {/* Period filter pills */}
      <div className="flex items-center gap-2">
        {(Object.keys(periodLabels) as PeriodType[]).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              period === key
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-surface-100 hover:bg-white/10'
            }`}
          >
            {periodLabels[key]}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            max={customEnd || todayStr}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-surface-50 [color-scheme:dark]"
          />
          <span className="text-xs text-surface-100">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            min={customStart}
            max={todayStr}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-surface-50 [color-scheme:dark]"
          />
        </div>
      )}

      {/* Metric cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3">
            <div className="text-[11px] text-surface-100">Promedio calórico</div>
            <div className="mt-1 text-lg font-semibold">{summary.avg_calories}</div>
            <div className="text-[11px] text-surface-100">kcal/día</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[11px] text-surface-100">Días registrados</div>
            <div className="mt-1 text-lg font-semibold">{summary.registered_days}/{summary.total_days}</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[11px] text-surface-100">Racha actual</div>
            <div className="mt-1 text-lg font-semibold">{summary.streak_days}</div>
            <div className="text-[11px] text-surface-100">días consecutivos</div>
          </div>
        </div>
      )}

      {/* Insight banner */}
      {insight && (
        <div className="border-l-2 border-brand-400 bg-brand-500/5 rounded-r-xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            {insight.up === true && <TrendingUp className="h-3.5 w-3.5 text-amber-400" />}
            {insight.up === false && <TrendingDown className="h-3.5 w-3.5 text-brand-400" />}
            <span>{insight.text}</span>
          </div>
        </div>
      )}

      {/* Calorie bar chart */}
      <section className="glass rounded-xl p-4">
        <h2 className="mb-3 text-sm font-medium text-surface-100">Calorías netas por día</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#a0aec0' }} />
            <YAxis tick={{ fontSize: 11, fill: '#a0aec0' }} />
            <Tooltip
              formatter={(v: number, name: string) => [name === 'excess_cal' ? `${v} kcal exceso` : `${v} kcal`]}
              labelFormatter={(l: string) => fullDate(l)}
              contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            />
            <ReferenceLine y={target} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Meta', fill: '#6366f1', fontSize: 11 }} />
            <Bar dataKey="normal_cal" name="Cal. netas" stackId="cal" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={24} />
            <Bar dataKey="excess_cal" name="Exceso" stackId="cal" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Macros area chart */}
      <section className="glass rounded-xl p-4">
        <h2 className="mb-3 text-sm font-medium text-surface-100">Tendencia de macros (g)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={daysData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gProtein" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCarbs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#a0aec0' }} />
            <YAxis tick={{ fontSize: 11, fill: '#a0aec0' }} />
            <Tooltip
              labelFormatter={(l: string) => fullDate(l)}
              contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="protein_g" name="Proteína" stroke="#10b981" fill="url(#gProtein)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="carbs_g" name="Carbos" stroke="#f59e0b" fill="url(#gCarbs)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="fat_g" name="Grasas" stroke="#ef4444" fill="url(#gFat)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Day rows */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-surface-100">Detalle por día</h2>
        <div className="space-y-1">
          {daysData.length === 0 && (
            <p className="py-8 text-center text-sm text-surface-100">Sin datos en este período</p>
          )}
          {daysData.map((d) => {
            const isNoData = d.meals_count === 0 && d.exercises_count === 0;
            const dotColor = isNoData
              ? 'bg-surface-700'
              : d.net_calories > target
                ? 'bg-amber-500'
                : 'bg-brand-500';
            const isExpanded = expandedDays.has(d.date);

            return (
              <div key={d.date}>
                <button
                  onClick={() => !isNoData && toggleDay(d.date)}
                  disabled={isNoData}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    isExpanded ? 'bg-white/5 rounded-b-none border border-white/5 border-b-transparent' : 'glass'
                  } ${!isNoData && 'hover:bg-white/[0.07]'}`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  <span className="min-w-[88px] text-xs font-medium capitalize">
                    {fullDate(d.date)}
                  </span>
                  {isNoData ? (
                    <span className="flex-1 text-xs italic text-surface-100">Sin registro</span>
                  ) : (
                    <>
                      <span className="flex-1 text-xs font-semibold tabular-nums">
                        {d.net_calories} kcal
                      </span>
                      <div className="hidden gap-2 text-[11px] sm:flex">
                        <span className="text-emerald-400 tabular-nums">P {d.protein_g}g</span>
                        <span className="text-sky-400 tabular-nums">C {d.carbs_g}g</span>
                        <span className="text-amber-400 tabular-nums">G {d.fat_g}g</span>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 text-surface-100 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </button>

                {isExpanded && !isNoData && (
                  <div className="glass rounded-b-xl px-4 pb-4 pt-3 space-y-3 border border-t-0 border-white/5">
                    <MacroBar label="Proteína" current={d.protein_g} target={macroTargets.protein} barColor="bg-emerald-500" />
                    <MacroBar label="Carbohidratos" current={d.carbs_g} target={macroTargets.carbs} barColor="bg-sky-500" />
                    <MacroBar label="Grasas" current={d.fat_g} target={macroTargets.fat} barColor="bg-amber-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const MacroBar = ({ label, current, target, barColor }: { label: string; current: number; target: number; barColor: string }) => {
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  const excessPct = Math.max(0, pct - 100);
  const hasExcess = excessPct > 0;
  const excessColor = excessPct > 20 ? '#ef4444' : '#f59e0b';

  const normalRatio = hasExcess ? (target / current) * 100 : pct;
  const excessRatio = hasExcess ? ((current - target) / current) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-surface-100">{label}</span>
        <span className="text-surface-50 tabular-nums">
          {Math.round(current)}g / {target}g
          {hasExcess && <span className="ml-1 font-semibold" style={{ color: excessColor }}>+{Math.round(excessPct)}%</span>}
        </span>
      </div>
      {hasExcess ? (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className={`h-full transition-all ${barColor}`} style={{ width: `${normalRatio}%` }} />
          <div className="h-full transition-all" style={{ width: `${excessRatio}%`, backgroundColor: excessColor }} />
        </div>
      ) : (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
};
