import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Menu, CheckCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { api } from '../../api/client';
import type { NotificationItem } from '../../types';
import { Avatar } from '../ui/primitives';
import { useAuth } from '../../hooks/useAuth';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  task_assigned: '📋',
  status_changed: '🔄',
  comment: '💬',
  mention: '@',
  deadline: '⏰',
  project: '📁',
  security: '🔐',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => (await api.get('/notifications?limit=8')).data,
    refetchInterval: 30000,
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread: number = data?.unreadCount ?? 0;
  const items: NotificationItem[] = data?.notifications ?? [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass relative rounded-2xl p-2.5 text-muted transition hover:text-white hover:shadow-glow"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 px-1 text-[10px] font-extrabold text-white shadow-lg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="glass-strong fixed right-4 top-[64px] z-[85] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl shadow-glass-lg"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <p className="font-display text-sm font-bold">Notifications</p>
                <button
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/15"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-2">
                {items.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-muted">You're all caught up. 🎉</p>
                )}
                {items.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      if (!n.read) markOne.mutate(n._id);
                      setOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                    className={`mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[.06] ${
                      !n.read ? 'bg-indigo-500/[.08]' : ''
                    }`}
                  >
                    <span className="mt-0.5 text-base leading-none">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400" />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{n.message}</span>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Topbar({
  onToggleSidebar,
  onOpenMobile,
  collapsed,
}: {
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  collapsed: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 mb-6 px-1 pt-1">
      <div className="glass flex items-center justify-between rounded-2xl px-4 py-3 shadow-glass">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="hidden rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-white lg:block"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            onClick={onOpenMobile}
            className="rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 rounded-2xl py-1 pl-1 pr-3 transition hover:bg-white/[.06]"
              title={`${user.name} — view profile`}
            >
              <Avatar name={user.name} color={user.avatarColor} size={34} />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[140px] truncate text-sm font-bold">{user.name}</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {user.role === 'admin' ? 'Admin' : user.memberType === 'team_lead' ? 'Team Lead' : 'Member'}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
