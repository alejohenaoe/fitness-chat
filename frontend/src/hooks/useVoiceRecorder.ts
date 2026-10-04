import { useCallback, useEffect, useRef, useState } from 'react';

export const MAX_RECORDING_SECONDS = 60;
export const WAVE_BARS = 46;

// Volumen (RMS) a partir del cual consideramos que hubo voz. El ruido de fondo
// con supresión de ruido queda muy por debajo; una voz normal, muy por encima.
const SPEECH_RMS = 0.01;
const MIN_DURATION_MS = 600;

export type VoiceError = 'denied' | 'unsupported' | 'empty' | 'failed' | 'limit';

const pickMimeType = () =>
  ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t));

/**
 * Graba una nota de voz con MediaRecorder (iPhone graba audio/mp4; Chrome y Android, audio/webm).
 * Entrega el audio solo si hubo sonido: así no enviamos silencio a Whisper, que con silencio inventa frases.
 */
export function useVoiceRecorder(onAudio: (audio: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(WAVE_BARS).fill(0));
  const [error, setError] = useState<VoiceError | null>(null);

  const onAudioRef = useRef(onAudio);
  onAudioRef.current = onAudio;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cleanupRef = useRef<() => void>(() => {});
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('unsupported');
      return;
    }
    // El AudioContext se crea antes del primer await para que iPhone lo asocie al toque del usuario.
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = AudioCtx ? new AudioCtx() : null;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      ctx?.close();
      const name = (e as DOMException)?.name;
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'unsupported' : 'failed');
      return;
    }

    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    let maxRms = 0;
    const startedAt = Date.now();

    // Medidor de volumen para la onda y para saber si hubo voz.
    let meter: number | undefined;
    if (ctx) {
      ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      meter = window.setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        maxRms = Math.max(maxRms, rms);
        setLevels((prev) => [...prev.slice(1), Math.min(1, rms * 8)]);
      }, 90);
    }
    const clock = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(Math.min(s, MAX_RECORDING_SECONDS));
      if (s >= MAX_RECORDING_SECONDS) stop();
    }, 250);

    cleanupRef.current = () => {
      window.clearInterval(meter);
      window.clearInterval(clock);
      stream.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
      recorderRef.current = null;
      setRecording(false);
      setSeconds(0);
      setLevels(Array(WAVE_BARS).fill(0));
    };

    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      cleanupRef.current();
      if (cancelledRef.current) return;
      // maxRms en 0 exacto significa que el medidor no funcionó (no que hubo silencio): se envía igual.
      const silent = maxRms > 0 && maxRms < SPEECH_RMS;
      if (silent || Date.now() - startedAt < MIN_DURATION_MS || !chunks.length) {
        setError('empty');
        return;
      }
      onAudioRef.current(new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' }));
    };

    cancelledRef.current = false;
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }, [stop]);

  useEffect(() => () => {
    cancelledRef.current = true;
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  return { recording, seconds, levels, error, setError, start, stop, cancel };
}
