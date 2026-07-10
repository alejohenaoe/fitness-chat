import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModeChips, type InputMode } from './ModeChips';
import { TypingIndicator } from './TypingIndicator';
import { useAppStore } from '../../stores/useAppStore';

export const ChatPage = () => {
  const { sendMessage, sendScan, messages, isTyping } = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>('food');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      ref={chatRef}
      className="relative flex h-full flex-col"
    >
      {/* Mode chips */}
      <ModeChips mode={inputMode} onModeChange={setInputMode} />

      {/* Messages */}
      <div className="flex-1 overflow-auto overscroll-contain">
        <div className="px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <img src="/fitnesschat-logo.png" alt="" className="mb-4 h-16 w-16" />
              <h2 className="mb-1 text-lg font-bold text-surface-50">¡Hola! Soy FitnessChat</h2>
              <p className="max-w-sm text-sm text-surface-100">
                Selecciona una categoría arriba y cuéntame qué comiste, qué ejercicio hiciste o pregunta lo que quieras.
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

      {/* Input */}
      <ChatInput
        onSend={(value) => sendMessage(value, inputMode)}
        onScan={sendScan}
        disabled={isTyping}
        inputMode={inputMode}
      />
    </div>
  );
};
