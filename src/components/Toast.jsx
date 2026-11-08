import { useCallback, useState } from 'react';
import { ToastContext } from '../lib/toast';
import { IconCheck, IconAlert, IconX } from './icons';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-pop flex items-start gap-3 w-full sm:w-auto sm:max-w-sm rounded-xl border border-line bg-surface px-4 py-3 shadow-2xl"
          >
            <span className={t.tone === 'error' ? 'text-risk mt-0.5' : 'text-ok mt-0.5'}>
              {t.tone === 'error' ? <IconAlert size={16} /> : <IconCheck size={16} />}
            </span>
            <p className="text-sm text-ink flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-faint hover:text-ink cursor-pointer" aria-label="Dismiss">
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
