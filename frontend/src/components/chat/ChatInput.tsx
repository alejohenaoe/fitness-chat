import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import api from '../../services/api';
import { useVoiceRecorder, MAX_RECORDING_SECONDS, type VoiceError } from '../../hooks/useVoiceRecorder';
import type { InputMode } from './constants';
import { PLACEHOLDERS } from './constants';
import { AlertIcon, CameraIcon, CheckIcon, CloseIcon, MicIcon, PencilIcon, SendIcon } from './icons';

const VOICE_ERRORS: Record<VoiceError, string> = {
  denied: 'El micrófono está bloqueado. En iPhone: Ajustes › Safari › Micrófono › Permitir. En Android: toca el candado junto a la dirección › Permisos › Micrófono.',
  unsupported: 'Este navegador no permite grabar audio. Escribe tu mensaje.',
  empty: 'No se escuchó nada. Acércate al micrófono e intenta de nuevo.',
  limit: 'Se alcanzó el límite de notas de voz por ahora. Intenta en unos minutos o escribe tu mensaje.',
  failed: 'No se pudo transcribir el audio. Intenta de nuevo o escribe tu mensaje.',
};

const MODES: { key: InputMode; label: string }[] = [
  { key: 'register', label: 'Registrar' },
  { key: 'ask', label: 'Preguntar' },
];

const MAX_TEXTAREA_PX = 120;

const audioFileName = (type: string) => `nota.${type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'}`;

const formatClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const iconBtn = 'grid h-10 w-10 flex-none place-items-center rounded-full text-ink-2 disabled:opacity-45';
const fieldCls = 'flex min-h-[50px] items-end gap-1.5 rounded-[24px] border border-line bg-card p-[5px]';

export const ChatInput = ({
  onSend,
  onScan,
  disabled,
  mode,
  onModeChange,
}: {
  onSend: (value: string) => void;
  onScan?: (file: File) => void;
  disabled?: boolean;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}) => {
  const [value, setValue] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const transcribe = async (audio: Blob) => {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append('audio', audio, audioFileName(audio.type));
      const { data } = await api.post('/chat/transcribe/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      // Si ya había texto escrito, la nota de voz se agrega al final.
      setValue((v) => (v.trim() ? `${v.trim()} ${data.text}` : data.text));
      setReviewing(true);
      requestAnimationFrame(() => textRef.current?.focus());
    } catch (e) {
      const status = (e as AxiosError)?.response?.status;
      voice.setError(status === 422 ? 'empty' : status === 429 ? 'limit' : 'failed');
    } finally {
      setTranscribing(false);
    }
  };

  const voice = useVoiceRecorder(transcribe);

  // El campo crece con el texto (p. ej. una nota de voz larga) hasta unas 5 líneas.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [value, transcribing, voice.recording]);

  useEffect(() => {
    if (!value.trim()) setReviewing(false);
  }, [value]);

  const hasText = value.trim().length > 0;

  const send = () => {
    if (!hasText || disabled) return;
    onSend(value.trim());
    setValue('');
    setReviewing(false);
  };

  const startRecording = () => {
    setReviewing(false);
    voice.start();
  };

  if (voice.recording) {
    return (
      <div>
        <div className={`${fieldCls} items-center gap-2`}>
          <button type="button" onClick={voice.cancel} aria-label="Cancelar grabación" className={`${iconBtn} text-danger`}>
            <CloseIcon className="h-[22px] w-[22px]" />
          </button>
          <span className="h-[9px] w-[9px] flex-none animate-[rec-pulse_1.2s_ease-in-out_infinite] rounded-full bg-danger" />
          <div className="flex h-8 min-w-0 flex-1 items-center justify-end gap-[2.5px] overflow-hidden" aria-hidden="true">
            {voice.levels.map((l, i) => (
              <span
                key={i}
                className="w-[3px] flex-none rounded-[3px] bg-ink transition-[height] duration-[120ms]"
                style={{ height: `${3 + l * 27}px`, opacity: 0.35 + 0.65 * (i / voice.levels.length) }}
              />
            ))}
          </div>
          <span className="num w-[38px] text-right text-[17px] font-semibold" aria-live="off">{formatClock(voice.seconds)}</span>
          <button type="button" onClick={voice.stop} aria-label="Terminar grabación" className={`${iconBtn} bg-volt text-ink`}>
            <CheckIcon className="h-[22px] w-[22px]" />
          </button>
        </div>
        <p className="mt-[5px] text-center text-[11.5px] text-muted">
          Se detiene solo al llegar a {formatClock(MAX_RECORDING_SECONDS)}
        </p>
      </div>
    );
  }

  const notice = voice.error
    ? { tone: 'bg-danger-soft text-danger-ink', icon: <AlertIcon className="h-3.5 w-3.5 flex-none" />, text: VOICE_ERRORS[voice.error] }
    : reviewing
      ? { tone: 'bg-volt-soft text-volt-ink', icon: <PencilIcon className="h-3.5 w-3.5 flex-none" />, text: 'Revisa el texto antes de enviarlo' }
      : null;

  return (
    <div>
      {notice ? (
        <div role={voice.error ? 'alert' : undefined} className={`mb-1.5 flex items-start gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs ${notice.tone}`}>
          <span className="mt-px">{notice.icon}</span>
          <span className="flex-1">{notice.text}</span>
          {voice.error && (
            <button type="button" onClick={() => voice.setError(null)} aria-label="Cerrar aviso" className="-m-0.5 p-0.5">
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        !transcribing && (
          <div role="group" aria-label="Modo" className="mb-1.5 ml-1 inline-flex gap-0.5 rounded-full bg-line-2 p-0.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={mode === m.key}
                onClick={() => onModeChange(m.key)}
                className={`rounded-full px-2.5 py-[3px] text-xs font-semibold leading-[1.4] ${
                  mode === m.key ? 'bg-card text-ink shadow-[0_1px_2px_rgb(var(--ink)/0.12)]' : 'text-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )
      )}

      <div className={fieldCls}>
        {onScan && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onScan(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || transcribing}
              aria-label="Escanear etiqueta con la cámara"
              className={iconBtn}
            >
              <CameraIcon className="h-[22px] w-[22px]" />
            </button>
          </>
        )}

        {transcribing ? (
          <div className="flex min-h-10 flex-1 items-center gap-2.5 px-2.5 text-ink-2">
            <span className="h-[18px] w-[18px] animate-spin rounded-full border-[2.5px] border-line border-t-ink [animation-duration:.8s]" />
            Transcribiendo…
          </div>
        ) : (
          <textarea
            ref={textRef}
            rows={1}
            aria-label="Mensaje"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (voice.error) voice.setError(null);
            }}
            placeholder={PLACEHOLDERS[mode]}
            // 16 px evita que el iPhone haga zoom al tocar el campo.
            className="min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-[1.35] text-ink outline-none placeholder:text-muted"
            style={{ touchAction: 'manipulation' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
        )}

        {hasText && !transcribing ? (
          <button type="button" onClick={send} disabled={disabled} aria-label="Enviar" className={`${iconBtn} bg-volt text-ink`}>
            <SendIcon className="h-[22px] w-[22px]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={transcribing}
            aria-label="Grabar nota de voz"
            className={`${iconBtn} bg-ink text-paper`}
          >
            <MicIcon className="h-[22px] w-[22px]" />
          </button>
        )}
      </div>
    </div>
  );
};
