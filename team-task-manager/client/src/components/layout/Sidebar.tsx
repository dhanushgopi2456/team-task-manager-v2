import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, ListChecks, FolderKanban, Columns3, CalendarDays, Users,
  Bell, BarChart3, Settings, UserCircle, LogOut, ShieldCheck, UserCog,
  KeyRound, ScrollText, Wrench, ChevronLeft, X,
} from 'lucide-react';
import { BrandLockup } from '../ui/primitives';
import { useAuth } from '../../hooks/useAuth';

const MEMBER_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/kanban', label: 'Kanban Board', icon: Columns3 },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck },
  { to: '/admin/users', label: 'User Management', icon: UserCog },
  { to: '/admin/permissions', label: 'Permissions', icon: KeyRound },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'System Settings', icon: Wrench },
];

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ${
          isActive
            ? 'raised text-white'
            : 'text-muted hover:translate-x-1 hover:bg-white/[.06] hover:text-white'
        }`
      }
    >
      <Icon size={17} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function Sidebar({
  open,
  mobileOpen,
  onCloseMobile,
}: {
  open: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-6 pt-6">
        <BrandLockup compact={!open} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {open && <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Workspace</p>}
        {MEMBER_NAV.map((n) => (
          <NavItem key={n.to} to={n.to} label={n.label} Icon={n.icon} />
        ))}

        {isAdmin && (
          <>
            {open && (
              <p className="mb-2 mt-6 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Administration
              </p>
            )}
            {!open && <div className="mx-2 my-4 border-t border-white/10" />}
            {ADMIN_NAV.map((n) => (
              <NavItem key={n.to} to={n.to} label={n.label} Icon={n.icon} />
            ))}
          </>
        )}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[.06] ${isActive ? 'text-white' : 'text-muted'} hover:text-white`
          }
        >
          <UserCircle size={17} />
          {open && <span className="text-sm font-semibold">Profile</span>}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[.06] ${isActive ? 'text-white' : 'text-muted'} hover:text-white`
          }
        >
          <Settings size={17} />
          {open && <span className="text-sm font-semibold">Settings</span>}
        </NavLink>
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut size={17} />
          {open && <span className="text-sm font-semibold">Logout</span>}
        </button>
        {user && (
          <div className={`mt-2 rounded-xl bg-black/20 p-2.5 ${open ? '' : 'hidden'}`}>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${user.avatarColor}, #8b5cf6)` }}
              >
                {user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-bold">{user.name}</p>
                <p className="truncate text-[10px] capitalize text-muted">
                  {user.role === 'admin' ? 'Administrator' : (user.memberType ?? '').replace('_', ' ') || 'Member'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop floating sidebar */}
      <motion.aside
        animate={{ width: open ? 264 : 84 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="glass fixed bottom-4 left-4 top-4 z-40 hidden flex-col overflow-hidden rounded-3xl shadow-glass-lg lg:flex"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="glass-strong fixed bottom-3 left-3 top-3 z-[70] flex w-[272px] flex-col overflow-y-auto rounded-3xl shadow-glass-lg lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                className="absolute right-3 top-4 rounded-full p-1.5 text-muted hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
