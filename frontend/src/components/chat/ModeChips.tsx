import { UtensilsCrossed, Activity, MessageCircle } from 'lucide-react';

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
  <div className="flex gap-2 border-t border-[#E5E7EB] bg-white px-4 py-2">
    {MODES.map((chip) => {
      const active = mode === chip.mode;
      const Icon = chip.icon;
      return (
        <button
          key={chip.mode}
          onClick={() => onModeChange(chip.mode)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-all ${
            active
              ? 'bg-brand-500 text-white shadow-sm'
              : 'border border-[#E5E7EB] bg-white text-surface-100 hover:bg-surface-900'
          }`}
        >
          <Icon className="h-4 w-4" />
          {chip.label}
        </button>
      );
    })}
  </div>
);
