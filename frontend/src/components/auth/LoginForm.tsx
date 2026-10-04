import { useState } from 'react';
import type { AxiosError } from 'axios';
import api from '../../services/api';
import { useAppStore } from '../../stores/useAppStore';
import { Wordmark } from '../brand/Logo';
import { Banner, Field, PrimaryButton, TextLink, Title } from './fields';
import { FormShell } from './FormShell';
import { EMAIL_RE, requestErrorMessage } from './errors';

export const LoginForm = ({ onRegister }: { onRegister: () => void }) => {
  const setAuth = useAppStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Escribe tu correo.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Revisa el correo: falta algo (ej.: nombre@correo.com).';
    if (!password) next.password = 'Escribe tu contraseña.';
    setErrors(next);
    setBanner('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const { data } = await api.post('/auth/login/', { email: email.trim(), password });
      setAuth(data.user, data.access, data.refresh);
    } catch (e) {
      setBanner(
        (e as AxiosError)?.response?.status === 401
          ? 'Correo o contraseña incorrectos. Revísalos e intenta de nuevo.'
          : requestErrorMessage(e, 'entrar'),
      );
      setBusy(false);
    }
  };

  return (
    <FormShell
      onSubmit={submit}
      footer={
        <>
          <PrimaryButton type="submit" busy={busy}>{busy ? 'Entrando…' : 'Entrar'}</PrimaryButton>
          <p className="my-3.5 text-center text-sm text-ink-2">
            ¿No tienes cuenta? <TextLink onClick={onRegister}>Crear cuenta</TextLink>
          </p>
        </>
      }
    >
      <div className="lg:mb-[18px]"><Wordmark /></div>
      <Title lede="Sigue registrando tu día donde lo dejaste.">Entrar</Title>
      {banner && <Banner>{banner}</Banner>}
      <Field id="login-email" label="Correo" type="email" autoComplete="username" inputMode="email" value={email} error={errors.email}
        onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} />
      <Field id="login-password" label="Contraseña" type="password" autoComplete="current-password" value={password} error={errors.password}
        onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }} />
    </FormShell>
  );
};
