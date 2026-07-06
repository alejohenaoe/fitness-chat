import { useState } from 'react';
import type { ExerciseLog } from '../../types';

interface ExerciseSectionProps {
  exercises: ExerciseLog[];
}

export const ExerciseSection = ({ exercises }: ExerciseSectionProps) => {
  const [showAll, setShowAll] = useState(false);

  if (exercises.length === 0) {
    return <p className="text-sm italic text-surface-100">Sin ejercicios registrados</p>;
  }

  const LIMIT = 5;
  const hasMore = exercises.length > LIMIT;
  const visible = showAll ? exercises : exercises.slice(0, LIMIT);
  const hiddenCount = exercises.length - LIMIT;

  return (
    <div>
      {visible.map((ex, i) => (
        <div key={ex.id ?? i} className="flex items-center justify-between border-b border-[#E5E7EB] py-1.5">
          <div>
            <p className="text-sm font-medium text-surface-50">{ex.name}</p>
            {ex.duration_minutes && (
              <p className="text-xs text-surface-100">
                {ex.duration_minutes} min{ex.exercise_type ? ` · ${ex.exercise_type}` : ''}
              </p>
            )}
          </div>
          <span className="text-sm text-surface-100">{ex.calories_burned} kcal</span>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-center text-sm font-semibold text-brand-500"
        >
          {showAll ? 'Ver menos' : `Ver ${hiddenCount} más`}
        </button>
      )}
    </div>
  );
};
