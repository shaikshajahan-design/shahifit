import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
  duration?: number;
}

const Ctx = createContext<(t: ToastOptions) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((t: ToastOptions) => {
    window.clearTimeout(timer.current);
    setToast({ ...t, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), t.duration ?? (t.onAction ? 5000 : 2800));
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.key} className={`toast ${toast.tone === 'error' ? 'toast-error' : ''}`}>
            <span>{toast.message}</span>
            {toast.onAction && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
              >
                {toast.actionLabel ?? 'Undo'}
              </button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
