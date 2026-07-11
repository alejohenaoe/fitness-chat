import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      ref={chatRef}
      className="relative flex h-full flex-col"
    >
      {/* Messages */}
      <div className="flex-1 overflow-auto overscroll-contain pb-28">
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

      {/* Input area: toggle + pill */}
      <div className="absolute bottom-0 left-0 right-0 z-50 mx-4 mb-4">
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
