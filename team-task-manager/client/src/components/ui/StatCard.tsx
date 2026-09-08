import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/** Animated counter that eases toward its target value. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
  }, [rounded]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}

/** Floating KPI card with icon, counter and optional mini chart / progress. */
export function StatCard({
  label,
  value,
  icon,
  accent,
  footer,
  delay = 0,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent: string;
  footer?: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={typeof value === 'number' ? undefined : undefined}
      className="card3d card3d-hover relative overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </p>
        </div>
        <div
          className="rounded-2xl p-3 text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
            boxShadow: `0 8px 20px -4px ${accent}77, inset 0 1px 0 rgba(255,255,255,.35)`,
          }}
        >
          {icon}
        </div>
      </div>
      {footer && <div className="relative mt-4">{footer}</div>}
    </motion.div>
  );
}
