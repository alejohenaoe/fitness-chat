import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Trash2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';

const profileSchema = z.object({
  age: z.coerce.number().min(10).max(120),
  weight_kg: z.coerce.number().min(20).max(500),
  height_cm: z.coerce.number().min(50).max(300),
  gender: z.string().min(1),
  goal: z.string().min(1),
  activity_level: z.string().min(1),
});

type ProfileForm = z.infer<typeof profileSchema>;

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Perder peso',
  muscle_gain: 'Ganar músculo',
  body_recomposition: 'Recomposición',
  maintenance: 'Mantenimiento',
  athletic_performance: 'Rendimiento',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
};

interface UserProfile {
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  goal: string;
  activity_level: string;
  daily_calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

export const ProfilePage = () => {
  const { user, logout } = useAppStore();
  const queryClient = useQueryClient();
  const [showData, setShowData] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile/');
      return data;
    },
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          age: profile.age,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          gender: profile.gender,
          goal: profile.goal,
          activity_level: profile.activity_level,
        }
      : undefined,
  });

  const { isDirty } = form.formState;

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const { data } = await api.put('/profile/', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch {}
    logout();
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/auth/delete-account/', { data: { password: deletePassword } });
      logout();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail ?? 'Contraseña incorrecta');
      setDeleting(false);
    }
  };

  const dataSummary = profile
    ? `${profile.age} años · ${profile.weight_kg} kg · ${profile.height_cm} cm · ${GOAL_LABELS[profile.goal] ?? profile.goal}`
    : '';

  const nutritionSummary = profile
    ? `Calorías: ${profile.daily_calorie_target} · Prot: ${profile.protein_target_g}g`
    : '';

  const nutritionItems = profile
    ? [
        { label: 'Calorías', value: `${profile.daily_calorie_target} kcal` },
        { label: 'Proteína', value: `${profile.protein_target_g} g` },
        { label: 'Carbohidratos', value: `${profile.carbs_target_g} g` },
        { label: 'Grasas', value: `${profile.fat_target_g} g` },
      ]
    : [];

  if (isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-auto p-4 pb-8 sm:p-6">

      <h1 className="text-xl font-bold text-surface-50">Perfil</h1>

      {/* User info row */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
          {user?.first_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div className="text-base font-semibold text-surface-50">{user?.first_name}</div>
          <div className="text-sm text-surface-100">{user?.email}</div>
        </div>
      </div>

      {/* Accordion: Tus datos */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
        <button
          onClick={() => setShowData((s) => !s)}
          className="flex w-full items-center gap-2"
        >
          {showData ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-surface-50" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-surface-50" />
          )}
          <span className="text-base font-semibold text-surface-50">Tus datos</span>
        </button>
        {!showData && dataSummary && (
          <p className="mt-1 truncate text-sm text-surface-100">{dataSummary}</p>
        )}
        {showData && (
          <div className="mt-3 space-y-3">
            <NumericField form={form} name="age" label="Edad" />
            <NumericField form={form} name="weight_kg" label="Peso (kg)" />
            <NumericField form={form} name="height_cm" label="Altura (cm)" />
            <PillField form={form} name="gender" label="Género" options={GENDER_LABELS} />
            <PillField form={form} name="goal" label="Objetivo fitness" options={GOAL_LABELS} />
            <PillField form={form} name="activity_level" label="Nivel de actividad" options={ACTIVITY_LABELS} />
            {saved && (
              <p className="text-center text-sm font-semibold text-brand-500">✓ Cambios guardados</p>
            )}
            <button
              onClick={form.handleSubmit((v) => updateMutation.mutate(v))}
              disabled={updateMutation.isPending || !isDirty}
              className={`mx-auto rounded-full px-6 py-2 text-sm font-bold text-white transition-all ${
                isDirty ? 'bg-brand-500 hover:bg-brand-600' : 'bg-surface-700'
              }`}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Accordion: Objetivos nutricionales */}
      {profile && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
          <button
            onClick={() => setShowNutrition((s) => !s)}
            className="flex w-full items-center gap-2"
          >
            {showNutrition ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-surface-50" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-surface-50" />
            )}
            <span className="text-base font-semibold text-surface-50">Objetivos nutricionales</span>
          </button>
          {!showNutrition && nutritionSummary && (
            <p className="mt-1 truncate text-sm text-surface-100">{nutritionSummary}</p>
          )}
          {showNutrition && (
            <div className="mt-3 space-y-1">
              {nutritionItems.map((item) => (
                <div key={item.label} className="flex justify-between py-1">
                  <span className="text-sm text-surface-100">{item.label}</span>
                  <span className="text-sm font-semibold text-brand-500">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-900"
        >
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4 text-surface-100" />
            <span className="text-sm text-surface-50">Cerrar sesión</span>
          </div>
          <ChevronRight className="h-4 w-4 text-surface-700" />
        </button>
        <div className="mx-4 h-px bg-[#E5E7EB]" />
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-900"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">Eliminar cuenta</span>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400" />
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h3 className="text-lg font-bold text-surface-50">⚠️ Eliminar cuenta</h3>
            <p className="mt-2 text-sm text-surface-100">
              Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.
            </p>
            <p className="mt-3 text-sm font-medium text-surface-100">
              Introduce tu contraseña para confirmar:
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
              placeholder="Contraseña"
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-surface-50 placeholder:text-surface-100"
            />
            {deleteError && (
              <p className="mt-1 text-xs text-red-400">{deleteError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                className="flex-1 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-surface-100 transition-all hover:bg-surface-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-400 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function NumericField({ form, name, label }: { form: any; name: string; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-surface-100">{label}</label>
      <input
        type="number"
        {...form.register(name)}
        className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-surface-50"
      />
      {form.formState.errors[name] && (
        <p className="mt-0.5 text-xs text-red-400">{form.formState.errors[name]?.message as string}</p>
      )}
    </div>
  );
}

function PillField({ form, name, label, options }: { form: any; name: string; label: string; options: Record<string, string> }) {
  const value = form.watch(name);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-surface-100">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([key, lbl]) => (
          <button
            key={key}
            type="button"
            onClick={() => form.setValue(name, key, { shouldDirty: true })}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              value === key
                ? 'bg-brand-500 font-semibold text-white'
                : 'border border-[#E5E7EB] bg-white text-surface-100 hover:bg-surface-900'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
