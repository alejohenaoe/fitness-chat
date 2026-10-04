import { useState } from 'react';
import type { AxiosError } from 'axios';
import api, { getRefreshToken } from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { SectionTitle } from '../components/progress/parts';
import { GoalsCard } from '../components/profile/GoalsCard';
import { Banner, Choices, Field, PrimaryButton, Segmented, TextLink } from '../components/auth/fields';
import { requestErrorMessage } from '../components/auth/errors';
import { ACTIVITY, GENDERS, GOALS, labelOf } from '../constants/profileOptions';
import { toNumber, validateGoals, validateMeasures } from '../utils/profileValidation';
import type { UserProfile } from '../types';

type Draft = { age: string; weight: string; height: string; gender: string; goal: string; activity: string };
const draftOf = (p: UserProfile): Draft => ({
  age: String(p.age), weight: String(p.weight_kg), height: String(p.height_cm),
  gender: p.gender, goal: p.goal, activity: p.activity_level,
});

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

export const ProfilePage = () => {
  const { user, setProfile, logout } = useAppStore();
  const profile = user?.profile;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user || !profile) return null;

  const startEdit = () => { setDraft(draftOf(profile)); setErrors({}); setBanner(''); setSaved(false); setEditing(true); window.scrollTo(0, 0); };
  const set = (key: keyof Draft) => (value: string) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async () => {
    if (!draft) return;
    const found = { ...validateMeasures(draft), ...validateGoals(draft) };
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setBanner('');
    try {
      const { data } = await api.put<UserProfile>('/profile/', {
        age: Math.round(toNumber(draft.age)),
        weight_kg: toNumber(draft.weight),
        height_cm: toNumber(draft.height),
        gender: draft.gender,
        goal: draft.goal,
        activity_level: draft.activity,
      });
      setProfile(data);
      setEditing(false);
      setSaved(true);
      window.scrollTo(0, 0);
    } catch (e) {
      setBanner(requestErrorMessage(e, 'guardar los cambios'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout/', { refresh: getRefreshToken() }); } catch { /* se cierra igual */ }
    logout();
  };

  const rows = [
    ['Edad', `${profile.age} años`],
    ['Peso', `${profile.weight_kg} kg`],
    ['Estatura', `${profile.height_cm} cm`],
    ['Género', labelOf(GENDERS, profile.gender)],
    ['Objetivo', labelOf(GOALS, profile.goal)],
    ['Actividad', labelOf(ACTIVITY, profile.activity_level)],
  ];

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Perfil" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-[18px] pb-[18px] pt-2">
        <div className="flex items-center gap-3.5">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-ink font-num text-[26px] font-extrabold text-paper" aria-hidden="true">
            {(user.first_name || user.email || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate font-num text-[26px] font-extrabold uppercase leading-none">{user.first_name || 'Sin nombre'}</div>
            <div className="mt-1 truncate text-sm text-muted">{user.email}</div>
          </div>
        </div>

        {editing && draft ? (
          <>
            <SectionTitle aside="al guardar se recalculan tus metas">Tus datos</SectionTitle>
            {banner && <Banner>{banner}</Banner>}
            <div className="-mt-2.5 grid grid-cols-3 gap-2">
              <Field id="p-age" label="Edad" compact unit="años" inputMode="numeric" value={draft.age} error={errors.age} onChange={(e) => set('age')(e.target.value)} />
              <Field id="p-weight" label="Peso" compact unit="kg" inputMode="decimal" value={draft.weight} error={errors.weight} onChange={(e) => set('weight')(e.target.value)} />
              <Field id="p-height" label="Estatura" compact unit="cm" inputMode="decimal" value={draft.height} error={errors.height} onChange={(e) => set('height')(e.target.value)} />
            </div>
            <Segmented id="p-gender" label="Género" options={GENDERS} value={draft.gender} error={errors.gender} onChange={set('gender')} />
            <Choices label="Objetivo" options={GOALS} value={draft.goal} error={errors.goal} onChange={set('goal')} />
            <Choices label="Actividad" options={ACTIVITY} value={draft.activity} error={errors.activity} onChange={set('activity')} />
            <div className="grid gap-2.5">
              <PrimaryButton type="button" busy={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar cambios'}</PrimaryButton>
              <p className="my-1 text-center text-sm"><TextLink onClick={() => setEditing(false)}>Cancelar</TextLink></p>
            </div>
          </>
        ) : (
          <>
            {saved && (
              <div role="status" className="flex items-start gap-2 rounded-xl bg-volt-soft px-3 py-2.5 text-[13.5px] text-volt-ink">
                <CheckIcon />Guardado. Tus metas se recalcularon con tus datos nuevos.
              </div>
            )}
            <section>
              <SectionTitle>Tus metas</SectionTitle>
              <GoalsCard profile={profile} note="Se calculan con tus datos y tu objetivo." />
            </section>
            <section>
              <SectionTitle aside={<TextLink onClick={startEdit}>Editar</TextLink>}>Tus datos</SectionTitle>
              <ul className="grid grid-cols-1">
                {rows.map(([label, value]) => (
                  <li key={label} className="flex items-baseline gap-1.5 border-b border-line py-[7px] text-[14.5px]">
                    {label}
                    <span className="min-w-3 flex-1 -translate-y-1 border-b-[1.5px] border-dotted border-leader" />
                    <span className="text-[15px] font-semibold">{value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section>
          <SectionTitle>Cuenta</SectionTitle>
          <div className="grid">
            <button type="button" onClick={handleLogout} className="flex w-full items-center justify-between border-b border-line py-3 text-left text-[15px] font-semibold">
              Cerrar sesión<ChevronRight />
            </button>
            <button type="button" onClick={() => setDeleteOpen(true)} className="flex w-full items-center justify-between border-b border-line py-3 text-left text-[15px] font-semibold text-danger">
              Eliminar cuenta<ChevronRight />
            </button>
          </div>
        </section>
      </div>

      {deleteOpen && <DeleteAccountSheet onClose={() => setDeleteOpen(false)} onDeleted={logout} />}
    </div>
  );
};

/** Hoja inferior para eliminar la cuenta: pide la contraseña y aclara que no se puede deshacer. */
const DeleteAccountSheet = ({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!password) { setError('Escribe tu contraseña.'); return; }
    setBusy(true);
    setError('');
    try {
      await api.delete('/auth/delete-account/', { data: { password } });
      onDeleted();
    } catch (e) {
      setError((e as AxiosError)?.response?.status === 400 ? 'Contraseña incorrecta.' : requestErrorMessage(e, 'eliminar la cuenta'));
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-paper/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="delete-title"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-md gap-3.5 rounded-t-[20px] bg-paper px-[22px] pb-[max(env(safe-area-inset-bottom),22px)] pt-[18px] shadow-[0_-12px_40px_-16px_rgb(var(--ink)/0.4)]">
        <h2 id="delete-title" className="font-num text-2xl font-extrabold uppercase leading-none">Eliminar cuenta</h2>
        <p className="text-sm text-ink-2">Se borran tu cuenta y todos tus registros. No se puede deshacer.</p>
        <Field id="delete-password" label="Escribe tu contraseña para confirmar" type="password" autoComplete="current-password"
          value={password} error={error} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
        <button type="button" onClick={confirm} disabled={busy}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-danger text-base font-bold text-white disabled:opacity-75">
          {busy ? 'Eliminando…' : 'Eliminar mi cuenta'}
        </button>
        <p className="m-0 text-center text-sm"><TextLink onClick={onClose}>Cancelar</TextLink></p>
      </div>
    </>
  );
};
