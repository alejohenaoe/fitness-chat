import { useState, useEffect } from 'react';
import { Workbox } from 'workbox-window';

export function PWAUpdater() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [sw, setSW] = useState<Workbox | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js');
      wb.addEventListener('waiting', () => setNeedRefresh(true));
      wb.register();
      setSW(wb);
    }
  }, []);

  const updateServiceWorker = () => {
    if (sw) {
      sw.messageSW({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-brand-500/20 bg-white p-4 shadow-lg sm:bottom-4">
      <p className="text-sm text-surface-50">Nueva versión disponible</p>
      <button
        onClick={updateServiceWorker}
        className="mt-2 rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white"
      >
        Actualizar
      </button>
    </div>
  );
}
