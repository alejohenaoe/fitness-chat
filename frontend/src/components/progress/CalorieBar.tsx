import { useEffect, useState } from 'react';

interface CalorieBarProps {
  consumed: number;
  burned: number;
  target: number;
}

export const CalorieBar = ({ consumed, burned, target }: CalorieBarProps) => {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = consumed > target;
  const excess = isOver ? consumed - target : 0;
  const [animWidth, setAnimWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${isOver ? 'bg-red-400' : 'bg-brand-400'}`}
          style={{ width: `${animWidth * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-xl font-bold ${isOver ? 'text-red-400' : 'text-surface-50'}`}>
          {Math.round(consumed)} kcal
        </span>
        <span className="text-sm text-surface-100">/ {target} kcal</span>
      </div>
      {isOver && <div className="my-1 h-px bg-red-400 opacity-50" />}
      <div className="flex items-baseline justify-between">
        <p className={`text-xs ${isOver ? 'text-red-400' : 'text-surface-100'}`}>
          Consumidas: {Math.round(consumed)} · Quemadas: {Math.round(burned)}
        </p>
        {isOver && (
          <p className="text-xs font-semibold text-red-400">
            {Math.round(excess)} kcal sobre tu meta
          </p>
        )}
      </div>
      {burned > 0 && (
        <p className="mt-1 text-sm font-semibold text-brand-400">
          Quemaste {Math.round(burned)} kcal en ejercicio
        </p>
      )}
    </div>
  );
};
