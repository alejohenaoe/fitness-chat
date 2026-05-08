import { UserProfile } from '../../types';

interface NutritionTargetsDisplayProps {
  profile: UserProfile | undefined;
  isLoading: boolean;
  className?: string;
}

const SkeletonCell = () => (
  <div className="glass rounded-xl px-3.5 py-2.5 space-y-2 animate-pulse">
    <div className="h-3 w-24 rounded bg-surface-700/60" />
    <div className="h-6 w-14 rounded bg-surface-600/60" />
  </div>
);

export const NutritionTargetsDisplay = ({ profile, isLoading, className }: NutritionTargetsDisplayProps) => {
  return (
    <div className={`glass noise rounded-xl p-5 glow-card space-y-4 ${className ?? ''}`}>
      <h2 className="text-lg font-semibold text-brand-400">Objetivos Nutricionales</h2>
      <p className="text-xs text-surface-100">
        Calculados automáticamente según tu perfil y objetivo fitness
      </p>
      <div className="grid grid-cols-2 gap-3">
        {isLoading || !profile ? (
          <>
            <SkeletonCell />
            <SkeletonCell />
            <SkeletonCell />
            <SkeletonCell />
          </>
        ) : (
          <>
            <div className="glass rounded-xl px-3.5 py-2.5">
              <div className="text-xs text-surface-100">Calorías diarias</div>
              <div className="text-lg font-semibold">{profile.daily_calorie_target}</div>
            </div>
            <div className="glass rounded-xl px-3.5 py-2.5">
              <div className="text-xs text-surface-100">Proteína (g)</div>
              <div className="text-lg font-semibold">{profile.protein_target_g}</div>
            </div>
            <div className="glass rounded-xl px-3.5 py-2.5">
              <div className="text-xs text-surface-100">Carbohidratos (g)</div>
              <div className="text-lg font-semibold">{profile.carbs_target_g}</div>
            </div>
            <div className="glass rounded-xl px-3.5 py-2.5">
              <div className="text-xs text-surface-100">Grasas (g)</div>
              <div className="text-lg font-semibold">{profile.fat_target_g}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
