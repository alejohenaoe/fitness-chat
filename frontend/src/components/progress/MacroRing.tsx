interface MacroRingProps {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

const SIZE = 80;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * R;

export const MacroRing = ({ label, value, target, color, unit = 'g' }: MacroRingProps) => {
  const isOver = value > target;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = CIRCUM * (1 - pct);
  const ringColor = isOver ? '#F87171' : color;
  const excess = isOver ? value - target : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={SIZE} height={SIZE}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#E5E7EB" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUM}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-surface-50'}`}>
            {Math.round(value)}
          </span>
          <span className="text-xs text-surface-100">{unit}</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-surface-50">{label}</span>
      <span className={`text-xs ${isOver ? 'font-semibold text-red-400' : 'text-surface-100'}`}>
        {isOver ? `+${Math.round(excess)}` : ''}/{target}{unit}
      </span>
    </div>
  );
};
