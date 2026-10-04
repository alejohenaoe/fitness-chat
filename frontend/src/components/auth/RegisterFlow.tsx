import { useState } from 'react';
import type { AxiosError } from 'axios';
import api from '../../services/api';
import { useAppStore } from '../../stores/useAppStore';
import { Wordmark } from '../brand/Logo';
import { Banner, Choices, Eyebrow, Field, PrimaryButton, Segmented, TextLink, Title } from './fields';
import { ACTIVITY, GENDERS, GOALS } from '../../constants/profileOptions';
import { GoalsCard } from '../profile/GoalsCard';
import { FormShell } from './FormShell';
import { EMAIL_RE, requestErrorMessage } from './errors';
import { toNumber, validateGoals, validateMeasures } from '../../utils/profileValidation';
import type { User } from '../../types';

type Form = {
  name: string; email: string; password: string; confirm: string;
  age: string; weight: string; height: string; gender: string;
  goal: string; activity: string;
};
type Errors = Partial<Record<keyof Form, string>>;
type Registered = { user: User; access: string; refresh: string };

const EMPTY: Form = { name: '', email: '', password: '', confirm: '', age: '', weight: '', height: '', gender: '', goal: '', activity: '' };

const validate = (step: number, f: Form): Errors => {
  const e: Errors = {};
  if (step === 1) {
    if (!f.name.trim()) e.name = 'Escribe tu nombre.';
    if (!f.email.trim()) e.email = 'Escribe tu correo.';
    else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Revisa el correo: falta algo (ej.: nombre@correo.com).';
    if (f.password.length < 8) e.password = 'Usa al menos 8 caracteres.';
    if (!f.confirm) e.confirm = 'Repite tu contraseña.';
    else if (f.confirm !== f.password) e.confirm = 'Las contraseñas no coinciden.';
  }
  if (step === 2) Object.assign(e, validateMeasures(f));
  if (step === 3) Object.assign(e, validateGoals(f));
  return e;
};

export const RegisterFlow = ({ onLogin }: { onLogin: () => void }) => {
  const setAuth = useAppStore((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Registered | null>(null);

  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const go = (n: number) => { setStep(n); setBanner(''); window.scrollTo(0, 0); };

  const register = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<Registered>('/auth/register/', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        age: Math.round(toNumber(form.age)),
        weight_kg: toNumber(form.weight),
        height_cm: toNumber(form.height),
        gender: form.gender,
        goal: form.goal,
        activity_level: form.activity,
      });
      setResult(data);
      go(4);
    } catch (e) {
      const emailError = ((e as AxiosError)?.response?.data as { email?: string[] } | undefined)?.email?.[0];
      if (emailError) {
        setErrors({ email: emailError });
        go(1);
      } else {
        setBanner(requestErrorMessage(e, 'crear la cuenta'));
      }
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (step === 4) {
      if (result) setAuth(result.user, result.access, result.refresh);
      return;
    }
    const found = validate(step, form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step === 3) register();
    else go(step + 1);
  };

  const passwordHint = form.password && form.password.length < 8
    ? <span className="font-medium text-danger">Mínimo 8 caracteres.</span>
    : <span className="text-muted">Mínimo 8 caracteres.</span>;
  const confirmHint = form.confirm && form.confirm === form.password && form.password.length >= 8
    ? <span className="font-semibold text-volt-ink">✓ Las contraseñas coinciden.</span>
    : undefined;
  const liveConfirmError = form.confirm && form.confirm !== form.password && !form.password.startsWith(form.confirm)
    ? 'Las contraseñas no coinciden.'
    : undefined;

  const profile = result?.user.profile;

  return (
    <FormShell
      onSubmit={next}
      footer={
        <>
          <PrimaryButton type="submit" busy={busy} volt={step === 4}>
            {step === 4 ? 'Empezar' : step === 3 ? (busy ? 'Calculando…' : 'Calcular mis metas') : 'Siguiente'}
          </PrimaryButton>
          {step === 1 && (
            <p className="my-3.5 text-center text-sm text-ink-2">¿Ya tienes cuenta? <TextLink onClick={onLogin}>Entrar</TextLink></p>
          )}
          {(step === 2 || step === 3) && (
            <p className="my-3.5 text-center text-sm"><TextLink onClick={() => go(step - 1)}>Atrás</TextLink></p>
          )}
        </>
      }
    >
      <div className="grid gap-[18px] lg:mb-[18px]">
        <Wordmark size={28} />
        <div className="grid grid-cols-3 gap-1.5" aria-label={`Paso ${Math.min(step, 3)} de 3`}>
          {[1, 2, 3].map((i) => <i key={i} className={`h-1 rounded ${i <= step ? 'bg-ink' : 'bg-line'}`} />)}
        </div>
      </div>

      {banner && <Banner>{banner}</Banner>}

      {step === 1 && (
        <>
          <div><Eyebrow>Paso 1 de 3</Eyebrow><Title>Tu cuenta</Title></div>
          <Field id="r-name" label="Nombre" autoComplete="given-name" value={form.name} error={errors.name} onChange={(e) => set('name')(e.target.value)} />
          <Field id="r-email" label="Correo" type="email" inputMode="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => set('email')(e.target.value)} />
          <Field id="r-pass" label="Contraseña" type="password" autoComplete="new-password" value={form.password} error={errors.password}
            hint={passwordHint} onChange={(e) => set('password')(e.target.value)} />
          <Field id="r-pass2" label="Confirmar contraseña" type="password" autoComplete="new-password" value={form.confirm}
            error={errors.confirm ?? liveConfirmError} hint={confirmHint} onChange={(e) => set('confirm')(e.target.value)} />
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <Eyebrow>Paso 2 de 3</Eyebrow>
            <Title lede="Con esto calculamos cuántas calorías necesitas al día.">Tus datos</Title>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field id="r-age" label="Edad" compact unit="años" inputMode="numeric" value={form.age} error={errors.age} onChange={(e) => set('age')(e.target.value)} />
            <Field id="r-weight" label="Peso" compact unit="kg" inputMode="decimal" value={form.weight} error={errors.weight} onChange={(e) => set('weight')(e.target.value)} />
            <Field id="r-height" label="Estatura" compact unit="cm" inputMode="decimal" value={form.height} error={errors.height} onChange={(e) => set('height')(e.target.value)} />
          </div>
          <Segmented id="gender" label="Género" options={GENDERS} value={form.gender} error={errors.gender} onChange={set('gender')} />
        </>
      )}

      {step === 3 && (
        <>
          <div><Eyebrow>Paso 3 de 3</Eyebrow><Title>Tu objetivo</Title></div>
          <Choices label="¿Qué quieres lograr?" options={GOALS} value={form.goal} error={errors.goal} onChange={set('goal')} />
          <Choices label="¿Qué tan activo eres?" options={ACTIVITY} value={form.activity} error={errors.activity} onChange={set('activity')} />
        </>
      )}

      {step === 4 && profile && (
        <>
          <div>
            <Eyebrow>Listo</Eyebrow>
            <Title lede="Las calculamos con tus datos y tu objetivo.">Tus metas</Title>
          </div>
          <GoalsCard profile={profile} />
          <p className="text-ink-2">Puedes cambiarlas cuando quieras en Perfil.</p>
        </>
      )}
    </FormShell>
  );
};
