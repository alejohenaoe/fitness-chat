import { formatKcal } from '../../utils/format';

export type ChartDay = { date: string; label: string; value: number; today: boolean };

const W = 354, BASE = 140, TOP = 20, LEFT = 34;

/**
 * Calorías netas por día con la línea de la meta, dibujado como en la maqueta.
 * La escala sube de 1.000 en 1.000 hasta cubrir el día más alto y la meta.
 * El día de hoy va en volt con borde punteado: está en curso.
 */
export const CaloriesChart = ({ days, target }: { days: ChartDay[]; target: number }) => {
  const max = Math.max(3000, Math.ceil(Math.max(target, ...days.map((d) => d.value)) / 1000) * 1000);
  const y = (kcal: number) => BASE - (Math.max(0, kcal) / max) * (BASE - TOP);
  const ticks = Array.from({ length: max / 1000 }, (_, i) => (i + 1) * 1000);
  const slot = (W - LEFT) / Math.max(days.length, 1);
  const barW = Math.min(26, slot * 0.7);
  const labelEvery = days.length > 10 ? 7 : 1;
  const last = days.length - 1;
  // En el mes se rotula cada 7 días y hoy; se omite una etiqueta si quedaría encima de la de hoy.
  const showLabel = (i: number, today: boolean) => today || (i % labelEvery === 0 && (labelEvery === 1 || last - i >= 3));

  return (
    <svg viewBox={`0 0 ${W} 170`} className="block h-auto w-full" role="img" aria-label={`Calorías netas por día con la meta de ${formatKcal(target)}`}>
      <g stroke="rgb(var(--line))" strokeWidth="1">
        {ticks.map((t) => <line key={t} x1={LEFT} x2={W} y1={y(t)} y2={y(t)} />)}
      </g>
      <line x1={LEFT} x2={W} y1={BASE} y2={BASE} stroke="rgb(var(--ink))" strokeWidth="1" />
      {ticks.map((t) => (
        <text key={t} x="0" y={y(t) + 4} className="fill-muted font-num text-[12px]">{formatKcal(t)}</text>
      ))}
      {days.map((d, i) => {
        const cx = LEFT + slot * i + slot / 2;
        return (
          <g key={d.date}>
            {d.value > 0 && (
              <rect
                x={cx - barW / 2}
                y={y(d.value)}
                width={barW}
                height={BASE - y(d.value)}
                rx={Math.min(3, barW / 3)}
                fill={d.today ? 'rgb(var(--volt))' : 'rgb(var(--ink))'}
                stroke={d.today ? 'rgb(var(--ink))' : undefined}
                strokeWidth={d.today ? 1 : undefined}
                strokeDasharray={d.today ? '3 2' : undefined}
              >
                <title>{`${d.label}: ${formatKcal(d.value)} kcal`}</title>
              </rect>
            )}
            {showLabel(i, d.today) && (
              <text x={cx} y="158" textAnchor="middle" className={`font-num text-[12px] ${d.today ? 'fill-ink font-bold' : 'fill-muted'}`}>
                {d.label}
              </text>
            )}
          </g>
        );
      })}
      <line x1={LEFT} x2={W} y1={y(target)} y2={y(target)} stroke="rgb(var(--ink))" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={W - 2} y={y(target) - 5} textAnchor="end" className="fill-ink font-num text-[12px] font-semibold">
        Meta {formatKcal(target)}
      </text>
    </svg>
  );
};
