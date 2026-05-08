import { UseFormReturn } from 'react-hook-form';
import { ProfileFormData } from '../../types/profile';
import { inputCls, selectCls, activityLabels } from '../../constants/profileConstants';

interface PersonalDataSectionProps {
  form: UseFormReturn<ProfileFormData>;
  isLoading?: boolean;
  className?: string;
}

const SkeletonInput = () => (
  <div className="glass w-full rounded-xl px-3.5 py-2.5 h-10 animate-pulse bg-surface-700/30" />
);

export const PersonalDataSection = ({ form, isLoading = false, className }: PersonalDataSectionProps) => {
  const { register, formState: { errors } } = form;

  return (
    <div className={`glass noise rounded-xl p-5 glow-card space-y-4 ${className ?? ''}`}>
      <h2 className="text-lg font-semibold text-brand-400">Datos Personales</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-surface-100">Peso (kg)</span>
          {isLoading ? <SkeletonInput /> : (
            <>
              <input type="number" step="0.1" {...register('weight_kg')} className={inputCls} />
              {errors.weight_kg && (
                <span className="text-xs text-red-400">{errors.weight_kg.message}</span>
              )}
            </>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-xs text-surface-100">Estatura (cm)</span>
          {isLoading ? <SkeletonInput /> : (
            <>
              <input type="number" step="0.1" {...register('height_cm')} className={inputCls} />
              {errors.height_cm && (
                <span className="text-xs text-red-400">{errors.height_cm.message}</span>
              )}
            </>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-xs text-surface-100">Edad</span>
          {isLoading ? <SkeletonInput /> : (
            <>
              <input type="number" {...register('age')} className={inputCls} />
              {errors.age && (
                <span className="text-xs text-red-400">{errors.age.message}</span>
              )}
            </>
          )}
        </label>

        <label className="space-y-1 col-span-2">
          <span className="text-xs text-surface-100">Género</span>
          {isLoading ? <SkeletonInput /> : (
            <select {...register('gender')} className={selectCls}>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          )}
        </label>

        <label className="space-y-1 col-span-2">
          <span className="text-xs text-surface-100">Nivel de actividad</span>
          {isLoading ? <SkeletonInput /> : (
            <select {...register('activity_level')} className={selectCls}>
              {Object.entries(activityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
        </label>
      </div>
    </div>
  );
};
