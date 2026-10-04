import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAppStore } from '../../stores/useAppStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { DayScore } from './DayScore';
import { TypingIndicator } from './TypingIndicator';
import { formatDayLabel } from '../../utils/format';
import type { ChatMessage as Msg, ExerciseLog, MealLog, UserProfile } from '../../types';
import type { InputMode } from './constants';

/**
 * Cuánto quedaba después de cada registro, para el pie de los recibos.
 * Los registros apuntan al mensaje del usuario que los originó; se suman los de hoy
 * hasta ese mensaje. Si el registro no está entre los de hoy (otro día, o se borró),
 * el recibo no muestra "quedan".
 */
const remainingByMessage = (messages: Msg[], meals: MealLog[], exercises: ExerciseLog[], target: number) => {
  const result = new Map<number, number>();
  let lastUserId: number | undefined;
  for (const m of messages) {
    if (m.role === 'user') { lastUserId = m.id; continue; }
    if (m.id == null || lastUserId == null) continue;
    const uid = lastUserId;
    const linked = meals.some((x) => x.source_message === uid) || exercises.some((x) => x.source_message === uid);
    if (!linked) continue;
    const upTo = (sourceId?: number | null) => sourceId != null && sourceId <= uid;
    const eaten = meals.filter((x) => upTo(x.source_message)).reduce((s, x) => s + x.calories, 0);
    const burned = exercises.filter((x) => upTo(x.source_message)).reduce((s, x) => s + x.calories_burned, 0);
    result.set(m.id, target - eaten + burned);
  }
  return result;
};

const targetOf = (profile: UserProfile | undefined, fallback: number) => profile?.daily_calorie_target ?? fallback;

export const ChatPage = () => {
  const { sendMessage, sendScan, messages, isTyping } = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>('register');
  const { todayMeals, todayExercises, user, dailyProgress } = useAppStore();

  const target = targetOf(user?.profile, dailyProgress.calorieTarget);
  const remaining = useMemo(
    () => remainingByMessage(messages, todayMeals, todayExercises, target),
    [messages, todayMeals, todayExercises, target],
  );
  const firstDate = messages[0]?.created_at ? new Date(messages[0].created_at) : new Date();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-3xl flex-none">
        <DayScore />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex max-w-3xl flex-col gap-3.5 px-4 pb-2.5 pt-3.5">
          <div className="self-center font-num text-xs uppercase tracking-[.12em] text-muted">
            {formatDayLabel(firstDate)}
          </div>
          {messages.length === 0 ? (
            <p className="mx-auto max-w-[30ch] py-6 text-center text-ink-2">
              Cuéntame qué comiste o qué ejercicio hiciste, escribiendo o con el micrófono.
              <span className="mt-2 block text-[13px] text-muted">Por ejemplo: «Almorcé arroz con pollo y un jugo de mora».</span>
            </p>
          ) : (
            messages.map((m, i) => (
              <ChatMessage key={m.id ?? `tmp-${i}`} message={m} remaining={m.id != null ? remaining.get(m.id) : undefined} />
            ))
          )}
          {isTyping && <TypingIndicator />}
          <div ref={endRef} />
        </div>
      </div>

      {/* Campo de escritura: ocupa su propio espacio, no tapa los mensajes */}
      <div className="flex-none border-t border-line bg-paper px-2.5 pb-2 pt-2">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={(value) => sendMessage(value, inputMode)}
            onScan={sendScan}
            disabled={isTyping}
            mode={inputMode}
            onModeChange={setInputMode}
          />
        </div>
      </div>
    </div>
  );
};
