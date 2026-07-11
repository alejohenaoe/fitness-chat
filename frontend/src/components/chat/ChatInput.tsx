import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Camera } from 'lucide-react';
import type { InputMode } from './constants';
import { MODE_COLORS, PLACEHOLDERS } from './constants';

export const ChatInput = ({
  onSend,
  onScan,
  disabled,
  inputMode = 'register',
}: {
  onSend: (value: string) => void;
  onScan?: (file: File) => void;
  disabled?: boolean;
  inputMode?: InputMode;
}) => {
  const [value, setValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return (
    <div className="flex items-center gap-1.5 overflow-hidden rounded-full border border-white/25 bg-white/30 px-3 py-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-lg">
      <motion.div
        key={inputMode}
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${MODE_COLORS[inputMode]}30` }}
        initial={isFirstRender.current ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
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
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-surface-900 text-surface-100 transition-all hover:bg-surface-800 disabled:opacity-50"
          >
            <Camera className="h-5 w-5" />
          </button>
        </>
      )}
      <div className="relative flex-1">
        <input
          aria-label="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={PLACEHOLDERS[inputMode]}
          className="relative z-10 w-full rounded-full bg-surface-900/80 px-3 py-1 text-surface-50 placeholder:text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
          style={{ fontSize: '16px', touchAction: 'manipulation' }}
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
      </div>
      <button
        onClick={() => {
          if (value.trim()) {
            onSend(value.trim());
            setValue('');
          }
        }}
        className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 transition-all disabled:opacity-50"
        style={{
          backgroundColor: value.trim() && !disabled ? MODE_COLORS[inputMode] : '#F0F2F5',
          color: value.trim() && !disabled ? '#fff' : '#4B5563',
          boxShadow: value.trim() && !disabled ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : undefined,
        }}
        disabled={!value.trim() || disabled}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};
