import { Trash2 } from 'lucide-react';

interface DeleteAccountButtonProps {
  onClick: () => void;
  className?: string;
}

export const DeleteAccountButton = ({ onClick, className }: DeleteAccountButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 ${className ?? ''}`}
    >
      <Trash2 className="h-4 w-4" />
      Eliminar cuenta
    </button>
  );
};
