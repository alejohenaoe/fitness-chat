import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModeChips, type InputMode } from './ModeChips';
import { TypingIndicator } from './TypingIndicator';
import { Drawer } from './Drawer';
import { EntriesPanel } from './EntriesPanel';
import { Menu, Sparkles, ListTodo } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ChatPage = () => {
  const { sendMessage, sendScan, messages, isTyping } = useChat();
  const { toggleEntries, todayMeals, todayExercises } = useAppStore();
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('food');
  const [kbPadding, setKbPadding] = useState(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleKb = useCallback(() => {
    const vv = window.visualViewport;
    if (vv) {
      const gap = window.innerHeight - vv.height;
      setKbPadding(Math.max(0, gap));
      if (gap > 0) {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleKb);
      return () => vv.removeEventListener('resize', handleKb);
    }
  }, [handleKb]);

  const totalEntries = todayMeals.length + todayExercises.length;

  return (
    <div
      ref={chatRef}
      className="relative flex h-full flex-col"
      style={{ paddingBottom: kbPadding }}
    >
      {/* Header */}
      <div className="flex items-center border-b border-[#E5E7EB] bg-white px-4 py-3 pt-[env(safe-area-inset-top)]">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-1.5 hover:bg-surface-900"
        >
          <Menu className="h-5 w-5 text-brand-500" />
        </button>
        <div className="flex flex-1 flex-col items-center">
          <p className="text-sm font-bold text-surface-50">✨ NutriCoach</p>
          <p className="text-[11px] text-surface-100">
            {isTyping ? 'Escribiendo...' : 'En línea'}
          </p>
        </div>
        <button
          onClick={toggleEntries}
          className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-surface-100 transition-all hover:bg-surface-900"
        >
          <ListTodo className="h-4 w-4" />
          <span className="hidden sm:inline">Registros</span>
          {totalEntries > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {totalEntries}
            </span>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto overscroll-contain">
        <div className="px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10">
                <Sparkles className="h-8 w-8 text-brand-500" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-surface-50">¡Hola! Soy NutriCoach</h2>
              <p className="max-w-sm text-sm text-surface-100">
                Selecciona una categoría abajo y cuéntame qué comiste, qué ejercicio hiciste o pregunta lo que quieras.
              </p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <ChatMessage key={m.id ?? i} message={m} />)}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Mode chips */}
      <ModeChips mode={inputMode} onModeChange={setInputMode} />

      {/* Input */}
      <ChatInput
        onSend={(value) => sendMessage(value, inputMode)}
        onScan={sendScan}
        disabled={isTyping}
        inputMode={inputMode}
      />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <EntriesPanel />
    </div>
  );
};
