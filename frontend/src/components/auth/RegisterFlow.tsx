import { useState } from 'react';
import type { AxiosError } from 'axios';
import api from '../../services/api';
import { useAppStore } from '../../stores/useAppStore';
import { formatKcal } from '../../utils/format';
import { Wordmark } from '../brand/Logo';
import { Banner, Eyebrow, Field, PrimaryButton, TextLink, Title } from './fields';
import { FormShell } from './FormShell';
import { EMAIL_RE, requestErrorMessage } from './errors';
import type { User } from '../../types';

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

// Las descripciones no prometen déficit de calorías: el servidor usa la misma meta de
// calorías para todos los objetivos y solo cambia el reparto de macros.
const GOALS = [
  { value: 'weight_loss', label: 'Perder peso', detail: 'Bajar de peso cuidando el músculo' },
  { value: 'muscle_gain', label: 'Ganar músculo', detail: 'Más proteína para subir masa muscular' },
  { value: 'body_recomposition', label: 'Recomposición', detail: 'Bajar grasa y ganar músculo a la vez' },
  { value: 'maintenance', label: 'Mantenerme', detail: 'Conservar tu peso actual' },
  { value: 'athletic_performance', label: 'Rendimiento deportivo', detail: 'Energía para entrenar fuerte' },
];

const ACTIVITY = [
  { value: 'sedentary', label: 'Sedentario', detail: 'Casi todo el día sentado' },
  { value: 'light', label: 'Ligero', detail: 'Ejercicio 1 a 3 días por semana' },
  { value: 'moderate', label: 'Moderado', detail: 'Ejercicio 3 a 5 días por semana' },
  { value: 'active', label: 'Activo', detail: 'Ejercicio 6 o 7 días por semana' },
  { value: 'very_active', label: 'Muy activo', detail: 'Entrenas fuerte o tu trabajo es físico' },
];

type Form = {
  name: string; email: string; password: string; confirm: string;
  age: string; weight: string; height: string; gender: string;
  goal: string; activity: string;
};
type Errors = Partial<Record<keyof Form, string>>;
type Registered = { user: User; access: string; refresh: string };

const EMPTY: Form = { name: '', email: '', password: '', confirm: '', age: '', weight: '', height: '', gender: '', goal: '', activity: '' };
const toNumber = (v: string) => Number(v.replace(',', '.'));

const inRange = (value: string, min: number, max: number) => {
  const n = toNumber(value);
  return Number.isFinite(n) && n >= min && n <= max;
};

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
  if (step === 2) {
    if (!f.age) e.age = 'Escribe tu edad.';
    else if (!inRange(f.age, 13, 100)) e.age = 'Entre 13 y 100.';
    if (!f.weight) e.weight = 'Escribe tu peso.';
    else if (!inRange(f.weight, 30, 300)) e.weight = 'Entre 30 y 300.';
    if (!f.height) e.height = 'Escribe tu estatura.';
    else if (!inRange(f.height, 100, 250)) e.height = 'Entre 100 y 250.';
    if (!f.gender) e.gender = 'Elige una opción.';
  }
  if (step === 3) {
    if (!f.goal) e.goal = 'Elige tu objetivo.';
    if (!f.activity) e.activity = 'Elige qué tan activo eres.';
  }
  return e;
};

const Option = ({ label, detail, selected, onSelect }: { label: string; detail: string; selected: boolean; onSelect: () => void }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`flex w-full items-center gap-3 rounded-[14px] border bg-card px-3.5 py-2.5 text-left ${
      selected ? 'border-ink shadow-[inset_0_0_0_1px_rgb(var(--ink))]' : 'border-line'
    }`}
  >
    <span>
      <span className="block text-[15px] font-semibold">{label}</span>
      <span className="block text-[12.5px] text-muted">{detail}</span>
    </span>
    <span className={`ml-auto grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${selected ? 'border-ink bg-ink' : 'border-line'}`}>
      {selected && <span className="h-2 w-2 rounded-full bg-volt" />}
    </span>
  </button>
);

const Choices = ({ label, options, value, error, onChange }: { label: string; options: typeof GOALS; value: string; error?: string; onChange: (v: string) => void }) => (
  <div className="grid gap-1.5">
    <span id={`${label}-label`} className="text-[13px] font-semibold text-ink-2">{label}</span>
    <div role="radiogroup" aria-labelledby={`${label}-label`} className="grid gap-2">
      {options.map((o) => <Option key={o.value} label={o.label} detail={o.detail} selected={value === o.value} onSelect={() => onChange(o.value)} />)}
    </div>
    {error && <span className="text-[12.5px] font-medium text-danger">{error}</span>}
  </div>
);

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
          <div className="grid gap-1.5">
            <span id="gender-label" className="text-[13px] font-semibold text-ink-2">Género</span>
            <div role="radiogroup" aria-labelledby="gender-label" className="grid grid-cols-3 rounded-xl bg-line-2 p-[3px]">
              {GENDERS.map((g) => (
                <button key={g.value} type="button" role="radio" aria-checked={form.gender === g.value} onClick={() => set('gender')(g.value)}
                  className={`rounded-[9px] py-2.5 text-[14.5px] font-semibold ${form.gender === g.value ? 'bg-card text-ink shadow-[0_1px_2px_rgb(var(--ink)/0.12)]' : 'text-muted'}`}>
                  {g.label}
                </button>
              ))}
            </div>
            {errors.gender && <span className="text-[12.5px] font-medium text-danger">{errors.gender}</span>}
          </div>
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
          <div className="rounded-[20px] bg-ink p-[18px] text-paper">
            <div className="font-num text-[12.5px] font-semibold uppercase tracking-[.12em] text-night-muted">Meta diaria</div>
            <div className="num text-[66px] font-extrabold leading-[.86] tracking-[-.01em]">
              {formatKcal(profile.daily_calorie_target)}
              <small className="ml-1 text-[20px] font-semibold tracking-[.02em] text-night-muted">kcal</small>
            </div>
            <div className="mb-3 mt-4 flex h-2 gap-0.5 overflow-hidden rounded-lg" aria-hidden="true">
              <span className="bg-protein" style={{ flex: profile.protein_target_g * 4 }} />
              <span className="bg-carbs" style={{ flex: profile.carbs_target_g * 4 }} />
              <span className="bg-fat" style={{ flex: profile.fat_target_g * 9 }} />
            </div>
            <ul className="grid gap-2">
              {([['Proteína', 'bg-protein', profile.protein_target_g], ['Carbohidratos', 'bg-carbs', profile.carbs_target_g], ['Grasas', 'bg-fat', profile.fat_target_g]] as const).map(([label, color, grams]) => (
                <li key={label} className="flex items-baseline gap-2 text-[14.5px] text-night-text">
                  <i className={`h-[9px] w-[9px] flex-none -translate-y-px rounded-full ${color}`} />
                  {label}
                  <span className="flex-1 -translate-y-1 border-b-[1.5px] border-dotted border-[#4A4D55]" />
                  <span className="num text-lg font-semibold text-paper">{grams} g</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-ink-2">Puedes cambiarlas cuando quieras en Perfil.</p>
        </>
      )}
    </FormShell>
  );
};
