import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { profileSchema, profileFormDefaults } from '../../constants/profileConstants';
import { ProfileFormData } from '../../types/profile';
import { PersonalDataSection } from './PersonalDataSection';
import { FitnessGoalSection } from './FitnessGoalSection';
import { NutritionTargetsDisplay } from './NutritionTargetsDisplay';

interface ProfileFormProps {
  profile: UserProfile | undefined;
  isProfileLoading: boolean;
  isPending: boolean;
  onSubmit: (values: ProfileFormData) => void;
}

export const ProfileForm = ({ profile, isProfileLoading, isPending, onSubmit }: ProfileFormProps) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileFormDefaults,
  });

  useEffect(() => {
    if (profile) {
      form.reset(profile as ProfileFormData);
    }
  }, [profile, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PersonalDataSection form={form} isLoading={isProfileLoading} />
      <FitnessGoalSection form={form} isLoading={isProfileLoading} />
      <NutritionTargetsDisplay profile={profile} isLoading={isProfileLoading} />
      <button
        type="submit"
        disabled={isPending || isProfileLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar cambios
      </button>
    </form>
  );
};
