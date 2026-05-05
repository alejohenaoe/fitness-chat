import { useState } from 'react';
import { Send } from 'lucide-react';

const suggestions = [
  '📸 Registrar desayuno',
  '🥗 ¿Cómo van mis macros?',
  '💪 Registrar ejercicio',
  '📊 Resumen del día',
  '🍽️ ¿Qué puedo comer?',
];

export const ChatInput = ({ onSend }: { onSend: (value: string) => void }) => {
  const [value, setValue] = useState('');

  return (
    <div className="noise glass-border border-t bg-surface-900/40 p-3">
      <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {suggestions.map((s) => (
          <button
            key={s}
            className="glass whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium text-surface-50 transition-all hover:bg-white/10"
            onClick={() => setValue(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          aria-label="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe lo que comiste o tu ejercicio..."
          className="glass flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm placeholder:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (value.trim()) {
                onSend(value.trim());
                setValue('');
              }
            }
          }}
        />
        <button
          onClick={() => {
            if (value.trim()) {
              onSend(value.trim());
              setValue('');
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30 disabled:opacity-50"
          disabled={!value.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
