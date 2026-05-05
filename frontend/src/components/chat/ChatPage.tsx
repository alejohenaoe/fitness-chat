import { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EntriesPanel } from './EntriesPanel';
import { Sparkles, ListTodo, LogOut } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ChatPage = () => {
  const { sendMessage, messages, isTyping } = useChat();
  const { toggleEntries, todayMeals, todayExercises, logout } = useAppStore();
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const totalEntries = todayMeals.length + todayExercises.length;

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="noise glass-border border-b bg-surface-900/40 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium">NutriCoach</p>
              <p className="text-[11px] text-surface-100">
                {isTyping ? 'Escribiendo...' : 'En línea'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEntries}
              className="relative flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/10"
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Registros</span>
              {totalEntries > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {totalEntries}
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-surface-100 transition-all hover:bg-red-500/10 hover:text-red-400 md:hidden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 glass">
              <Sparkles className="h-8 w-8 text-brand-400" />
            </div>
            <h2 className="mb-1 text-lg font-semibold">Bienvenido a FitnessChat</h2>
            <p className="max-w-sm text-sm text-surface-100">
              Cuéntame qué comiste o qué ejercicio hiciste, y lo registraré por ti.
            </p>
          </div>
        )}
        {messages.map((m, i) => <ChatMessage key={m.id ?? i} message={m} />)}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-surface-100">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-100" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-100" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-100" style={{ animationDelay: '300ms' }} />
            </div>
            NutriCoach está escribiendo...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <ChatInput onSend={sendMessage} />

      <EntriesPanel />
    </div>
  );
};
