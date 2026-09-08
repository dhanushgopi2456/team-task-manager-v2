import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string }

const ToastContext = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-4), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-glass-lg"
            >
              {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />}
              {t.kind === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />}
              {t.kind === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />}
              <p className="text-sm font-medium leading-snug">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).toast;
}
