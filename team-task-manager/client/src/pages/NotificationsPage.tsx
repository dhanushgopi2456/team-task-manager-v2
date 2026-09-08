import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BellRing, CheckCheck } from 'lucide-react';
import { api } from '../api/client';
import type { NotificationItem } from '../types';
import { PageHeader } from '../components/ui/primitives';
import { EmptyState, SkeletonCard } from '../components/ui/feedback';
import { useToast } from '../hooks/useToast';

const TYPE_ICON: Record<string, string> = {
  task_assigned: '📋',
  status_changed: '🔄',
  comment: '💬',
  mention: '@',
  deadline: '⏰',
  project: '📁',
  security: '🔐',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => (await api.get(`/notifications?limit=50${filter === 'unread' ? '&unread=true' : ''}`)).data,
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast(res.data.message || 'All notifications marked as read');
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items: NotificationItem[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} waiting for you.` : 'You are all caught up.'}
        actions={
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending || unreadCount === 0} className="btn-ghost">
            <CheckCheck size={15} /> Mark all read
          </button>
        }
      />

      <div className="card3d mb-5 flex gap-1 p-1.5">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              filter === f ? 'raised text-white' : 'text-muted hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<BellRing size={34} />} title="No notifications here" message="Assignments, comments, mentions and deadline reminders will appear in this feed." />
      ) : (
        <div className="space-y-3">
          {items.map((n, i) => (
            <motion.button
              key={n._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              onClick={() => {
                if (!n.read) markOne.mutate(n._id);
                if (n.link) navigate(n.link);
              }}
              className={`card3d card3d-hover flex w-full items-start gap-4 !rounded-2xl p-5 text-left ${!n.read ? '!border-indigo-400/30' : ''}`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/10 text-lg shadow-glass">
                {TYPE_ICON[n.type] ?? '🔔'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-sm font-bold">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400 shadow-glow" />}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{n.message}</span>
                <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
