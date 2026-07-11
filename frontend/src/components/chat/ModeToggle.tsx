import { motion } from 'framer-motion';
import type { InputMode } from './constants';
import { MODE_COLORS } from './constants';

export const ModeToggle = ({
  mode,
  onModeChange,
}: {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}) => {
  const options: { key: InputMode; label: string }[] = [
    { key: 'register', label: 'Registrar' },
    { key: 'ask', label: 'Preguntar' },
  ];

  return (
    <button
      type="button"
      className="relative mx-auto flex overflow-hidden rounded-t-full border border-b-0 border-white/25 bg-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-lg"
      onClick={() => onModeChange(mode === 'register' ? 'ask' : 'register')}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute inset-y-0.5 w-1/2 rounded-t-full"
        style={{ backgroundColor: `${MODE_COLORS[mode]}60` }}
        animate={{ left: mode === 'register' ? '2px' : '50%' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      {/* Labels */}
      {options.map((o) => (
        <span
          key={o.key}
          className={`relative z-10 px-5 py-1.5 text-xs font-semibold select-none ${mode === o.key ? 'text-white' : 'text-gray-700'}`}
        >
          {o.label}
        </span>
      ))}
    </button>
  );
};
