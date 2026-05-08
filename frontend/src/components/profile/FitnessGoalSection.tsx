import { UseFormReturn } from 'react-hook-form';
import { ProfileFormData } from '../../types/profile';
import { selectCls, goalLabels } from '../../constants/profileConstants';

interface FitnessGoalSectionProps {
  form: UseFormReturn<ProfileFormData>;
  isLoading?: boolean;
  className?: string;
}

const SkeletonSelect = () => (
  <div className="glass w-full rounded-xl px-3.5 py-2.5 h-10 animate-pulse bg-surface-700/30" />
);

export const FitnessGoalSection = ({ form, isLoading = false, className }: FitnessGoalSectionProps) => {
  const { register } = form;

  return (
    <div className={`glass noise rounded-xl p-5 glow-card space-y-4 ${className ?? ''}`}>
      <h2 className="text-lg font-semibold text-brand-400">Objetivo Fitness</h2>
      {isLoading ? (
        <SkeletonSelect />
      ) : (
        <select aria-label="goal" {...register('goal')} className={selectCls}>
          {Object.entries(goalLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      )}
    </div>
  );
};
