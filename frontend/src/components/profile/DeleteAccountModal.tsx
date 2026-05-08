import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteAccountModal = ({ isOpen, isLoading, onConfirm, onCancel }: DeleteAccountModalProps) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleCancel = () => {
    setConfirmed(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass noise rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-6 w-6" />
          <h3 className="text-lg font-bold">¿Eliminar cuenta permanentemente?</h3>
        </div>
        <p className="text-sm text-surface-100">
          Esta acción no se puede deshacer. Se eliminarán todos tus datos, historial y progreso.
        </p>
        <label className="flex items-center gap-2 text-sm text-surface-100 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="rounded border-surface-600 bg-surface-800 text-red-500 focus:ring-red-500"
          />
          Entiendo que se eliminarán todos mis datos
        </label>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-surface-600 px-4 py-2.5 text-sm font-medium text-surface-100 hover:bg-surface-800 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};
