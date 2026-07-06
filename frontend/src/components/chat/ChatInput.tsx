import { useState, useRef } from 'react';
import { Send, Camera } from 'lucide-react';
import type { InputMode } from './ModeChips';

const PLACEHOLDERS: Record<InputMode, string> = {
  food: '¿Qué comiste?',
  exercise: '¿Cómo fue tu ejercicio?',
  ask: 'Pregunta lo que quieras',
};

export const ChatInput = ({
  onSend,
  onScan,
  disabled,
  inputMode = 'food',
}: {
  onSend: (value: string) => void;
  onScan?: (file: File) => void;
  disabled?: boolean;
  inputMode?: InputMode;
}) => {
  const [value, setValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 border-t border-[#E5E7EB] bg-white px-4 py-3">
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
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-900 text-surface-100 transition-all hover:bg-surface-800 disabled:opacity-50"
          >
            <Camera className="h-5 w-5" />
          </button>
        </>
      )}
      <input
        aria-label="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDERS[inputMode]}
        className="flex-1 rounded-xl bg-surface-900 px-4 py-2.5 text-sm text-surface-50 placeholder:text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
              onSend(value.trim());
              setValue('');
            }
          }
        }}
        disabled={disabled}
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onSend(value.trim());
            setValue('');
          }
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
          value.trim() && !disabled
            ? 'bg-brand-500 text-white shadow-sm'
            : 'bg-surface-900 text-surface-100'
        }`}
        disabled={!value.trim() || disabled}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};
