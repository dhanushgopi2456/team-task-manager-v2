import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, Inbox } from 'lucide-react';

/* ─── Modal ───────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`glass-strong w-full ${width} max-h-[88vh] overflow-y-auto rounded-3xl p-6 shadow-glass-lg`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Confirm dialog ──────────────────────────────────────────────── */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-2.5 ${danger ? 'bg-rose-500/15 text-rose-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
          <AlertTriangle size={22} />
        </div>
        <p className="text-sm leading-relaxed text-muted">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <button className="btn-ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className={danger ? 'btn-primary !from-rose-600 !via-rose-500 !to-red-500' : 'btn-primary'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card3d flex flex-col items-center justify-center gap-3 px-8 py-14 text-center"
    >
      <div className="animate-float-y rounded-3xl bg-gradient-to-br from-indigo-500/25 to-violet-500/10 p-5 text-indigo-300 shadow-glow">
        {icon ?? <Inbox size={34} />}
      </div>
      <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
      {message && <p className="max-w-sm text-sm leading-relaxed text-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

/* ─── Skeletons ───────────────────────────────────────────────────── */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card3d space-y-3 p-5">
      <div className="skeleton h-5 w-2/3 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3.5 rounded" style={{ width: `${90 - i * 18}%` }} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-indigo-400"
      style={{ width: size, height: size }}
    />
  );
}
