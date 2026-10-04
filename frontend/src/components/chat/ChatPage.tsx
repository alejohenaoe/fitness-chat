import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAppStore } from '../../stores/useAppStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModeToggle } from './ModeToggle';
import { TypingIndicator } from './TypingIndicator';
import type { InputMode } from './constants';

export const ChatPage = () => {
  const { sendMessage, sendScan, messages, isTyping } = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>('register');
  const { toggleEntries, todayMeals, todayExercises } = useAppStore();
  const totalEntries = todayMeals.length + todayExercises.length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      ref={chatRef}
      className="flex h-full flex-col"
    >
      {/* Provisional hasta la fase 3, cuando el marcador del día ocupe este lugar */}
      <div className="flex flex-none items-center justify-between px-4 py-2">
        <span className="font-num text-[13px] font-semibold uppercase tracking-[.12em] text-muted">Hoy</span>
        <button
          onClick={toggleEntries}
          className="flex items-center gap-1.5 rounded-full bg-line-2 px-3 py-1 text-[13px] font-semibold text-ink-2"
        >
          Registros
          <span className="num rounded-full bg-ink px-1.5 text-[12px] leading-[18px] text-paper">{totalEntries}</span>
        </button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain pb-3">
        <div className="px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <img src="/fitnesschat-logo.png" alt="" className="mb-4 h-16 w-16" />
              <h2 className="mb-1 text-lg font-bold text-surface-50">¡Hola! Soy FitnessChat</h2>
              <p className="max-w-sm text-sm text-surface-100">
                Registra lo que comiste, cuéntame tu ejercicio o pregunta lo que quieras.
              </p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <ChatMessage
                  key={m.id ?? i}
                  message={m}
                  isConsecutive={i > 0 && messages[i - 1].role === m.role}
                />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Campo de escritura: ocupa su propio espacio, no tapa los mensajes */}
      <div className="flex-none border-t border-line bg-paper px-2.5 pb-2 pt-2">
        <ModeToggle mode={inputMode} onModeChange={setInputMode} />
        <ChatInput
          onSend={(value) => sendMessage(value, inputMode)}
          onScan={sendScan}
          disabled={isTyping}
          inputMode={inputMode}
        />
      </div>
    </div>
  );
};
