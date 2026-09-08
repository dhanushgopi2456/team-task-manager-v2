import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, KeyRound, ShieldCheck, ShieldOff,
  ChevronLeft, ChevronRight, Eye, EyeOff, X,
} from 'lucide-react';
import { api, apiError } from '../../api/client';
import type { User } from '../../types';
import { PageHeader, Avatar, RoleBadge } from '../../components/ui/primitives';
import { Modal, ConfirmDialog, EmptyState } from '../../components/ui/feedback';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);

  const { data, isLoading }: any = useQuery({
    queryKey: ['admin-users', search, roleFilter, activeFilter, page],
    queryFn: async () =>
      (
        await api.get(
          `/users?search=${encodeURIComponent(search)}&role=${roleFilter}&active=${activeFilter}&page=${page}&limit=12`
        )
      ).data,
  });

  const users: User[] = data?.users ?? [];
  const pagination = data?.pagination;

  useEffect(() => setPage(1), [search, roleFilter, activeFilter]);

  const toggleActive = useMutation({
    mutationFn: async (u: User) => (await api.patch(`/users/${u.id}`, { active: !u.active })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast('User updated successfully');
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create accounts, assign roles and member types, reset passwords and control access."
        actions={
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={16} /> Create User
          </button>
        }
      />

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card3d mb-5 flex flex-wrap items-center gap-3 p-4">
        <span className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input pl-9"
          />
        </span>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-auto cursor-pointer capitalize">
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="input w-auto cursor-pointer">
          <option value="all">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" message="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="card3d overflow-x-auto p-2">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted">
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Tasks</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="table-row border-b border-white/[.04] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} size={36} />
                        <div className="min-w-0 leading-tight">
                          <p className="truncate font-bold">{u.name}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} memberType={u.memberType} /></td>
                    <td className="px-4 py-3">
                      <span className={`chip border ${u.active ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' : 'border-slate-400/20 bg-slate-500/10 text-slate-400'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-bold text-emerald-300">{u.stats?.completed ?? 0}</span>{' '}
                      <span className="text-muted">done ·</span>{' '}
                      <span className="font-bold text-sky-300">{u.stats?.pending ?? 0}</span>{' '}
                      <span className="text-muted">open</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setEditing(u)} className="rounded-lg bg-white/[.05] p-2 text-indigo-300 transition hover:bg-indigo-500/25" title="Edit user">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setResetting(u)} className="rounded-lg bg-white/[.05] p-2 text-amber-300 transition hover:bg-amber-500/25" title="Reset password">
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive.mutate(u)}
                          disabled={u.id === me?.id}
                          className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-30 ${u.active ? 'bg-white/[.05] text-orange-300 hover:bg-orange-500/25' : 'bg-white/[.05] text-emerald-300 hover:bg-emerald-500/25'}`}
                          title={u.active ? 'Deactivate account' : 'Activate account'}
                        >
                          {u.active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          disabled={u.id === me?.id}
                          className="rounded-lg bg-white/[.05] p-2 text-rose-300 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} users)
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost !p-2 disabled:opacity-30">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-ghost !p-2 disabled:opacity-30">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal user={editing} onClose={() => setEditing(null)} />

      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this user?"
        message={`${deleting?.name} (${deleting?.email}) will be permanently removed. Their tasks will be unassigned and owned projects archived.`}
        onConfirm={async () => {
          try {
            await api.delete(`/users/${deleting!.id}`);
            toast('User deleted successfully');
            qc.invalidateQueries({ queryKey: ['admin-users'] });
          } catch (e: any) {
            toast(apiError(e), 'error');
          }
          setDeleting(null);
        }}
        confirmLabel="Delete User"
      />
    </div>
  );
}

/* ─── Create user ─────────────────────────────────────────────────── */
function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [memberType, setMemberType] = useState<'team_lead' | 'regular_member'>('regular_member');
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    if (!open) {
      setName(''); setEmail(''); setPassword(''); setRole('member'); setMemberType('regular_member'); setJobTitle('');
    }
  }, [open]);

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/users', {
          name, email, password, role, jobTitle,
          memberType: role === 'admin' ? 'none' : memberType,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast('User created successfully');
      onClose();
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create New User" width="max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Full name *</span>
          <input required minLength={2} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Kumar" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Email *</span>
          <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Temporary password * (min 8 chars)</span>
          <span className="relative block">
            <input required minLength={8} type={showPw ? 'text' : 'password'} className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set an initial password" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Job title</span>
          <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Backend Developer" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">System role *</span>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {(['member', 'admin'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-lg px-2 py-2 text-xs font-bold capitalize transition ${role === r ? 'raised text-white' : 'text-muted hover:text-white'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Member type {role === 'member' && '*'}</span>
            <div className={`grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1 ${role === 'admin' ? 'pointer-events-none opacity-40' : ''}`}>
              {(['team_lead', 'regular_member'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMemberType(m)} className={`rounded-lg px-2 py-2 text-[11px] font-bold leading-tight transition ${memberType === m ? 'raised text-white' : 'text-muted hover:text-white'}`}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {role === 'admin' && (
          <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
            Admins have full system access — create admins with care.
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Edit user ───────────────────────────────────────────────────── */
function EditUserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [memberType, setMemberType] = useState<'team_lead' | 'regular_member'>('regular_member');
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role as any);
      setMemberType((user.memberType as any) ?? 'regular_member');
      setJobTitle(user.jobTitle || '');
    }
  }, [user]);

  const save = useMutation({
    mutationFn: async () =>
      (
        await api.patch(`/users/${user!.id}`, {
          name, email, jobTitle, role,
          memberType: role === 'admin' ? 'none' : memberType,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast('User updated successfully');
      onClose();
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit ${user?.name ?? ''}`} width="max-w-lg">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Full name</span>
            <input required minLength={2} className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Email</span>
            <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Job title</span>
          <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">System role</span>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {(['member', 'admin'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-lg px-2 py-2 text-xs font-bold capitalize transition ${role === r ? 'raised text-white' : 'text-muted hover:text-white'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Member type</span>
            <div className={`grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1 ${role === 'admin' ? 'pointer-events-none opacity-40' : ''}`}>
              {(['team_lead', 'regular_member'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMemberType(m)} className={`rounded-lg px-2 py-2 text-[11px] font-bold leading-tight transition ${memberType === m ? 'raised text-white' : 'text-muted hover:text-white'}`}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost"><X size={14} /> Cancel</button>
          <button type="submit" disabled={save.isPending} className="btn-primary">{save.isPending ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Reset password ──────────────────────────────────────────────── */
function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) setNewPassword('');
  }, [user]);

  const reset = useMutation({
    mutationFn: async () => (await api.post(`/users/${user!.id}/reset-password`, { newPassword })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast(`Password reset for ${user?.name}`);
      onClose();
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  return (
    <Modal open={!!user} onClose={onClose} title={`Reset password — ${user?.name ?? ''}`} width="max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); reset.mutate(); }} className="space-y-4">
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-200">
          All existing sessions for this user will be signed out immediately.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">New temporary password *</span>
          <input required minLength={8} type="text" className="input font-mono" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="e.g. Tmp#2026-Secure" />
        </label>
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={reset.isPending} className="btn-primary">{reset.isPending ? 'Resetting…' : 'Reset Password'}</button>
        </div>
      </form>
    </Modal>
  );
}
