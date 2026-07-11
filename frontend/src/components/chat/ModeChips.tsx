import { UtensilsCrossed, Activity, MessageCircle } from 'lucide-react';
import { MODE_COLORS } from './constants';

export type InputMode = 'food' | 'exercise' | 'ask';

interface Props {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const MODES: { mode: InputMode; label: string; icon: typeof UtensilsCrossed }[] = [
  { mode: 'food', label: 'Comida', icon: UtensilsCrossed },
  { mode: 'exercise', label: 'Ejercicio', icon: Activity },
  { mode: 'ask', label: 'Preguntar', icon: MessageCircle },
];

export const ModeChips = ({ mode, onModeChange }: Props) => (
  <div className="px-4 pt-2 pb-1.5">
    <div className="flex rounded-full border border-white/25 bg-surface-900/40 p-0.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-lg">
      {MODES.map((chip) => {
        const active = mode === chip.mode;
        const Icon = chip.icon;
        return (
          <button
            key={chip.mode}
            onClick={() => onModeChange(chip.mode)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-all ${
              active
                ? 'text-white shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
            style={active ? { backgroundColor: MODE_COLORS[chip.mode] } : undefined}
          >
            <Icon className="h-4 w-4" />
            {chip.label}
          </button>
        );
      })}
    </div>
  </div>
);
