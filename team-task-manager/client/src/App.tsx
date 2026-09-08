import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { AppShell } from './components/layout/AppShell';
import { BrandLoader } from './components/layout/BackgroundFX';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const KanbanBoard = lazy(() => import('./pages/KanbanBoard'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Team = lazy(() => import('./pages/Team'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const TaskDetails = lazy(() => import('./pages/TaskDetails'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin'));
const Permissions = lazy(() => import('./pages/admin/Permissions'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const SystemSettingsAdmin = lazy(() => import('./pages/admin/SystemSettingsAdmin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function Protected({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <BrandLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <BrandLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<BrandLoader label="Loading module…" />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
              <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
              <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />

              {/* App shell */}
              <Route element={<Protected><AppShell /></Protected>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-tasks" element={<MyTasks />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/projects/:id/board" element={<KanbanBoard />} />
                <Route path="/tasks/:id" element={<TaskDetails />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/team" element={<Team />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />

                {/* Admin only */}
                <Route path="/admin" element={<Protected adminOnly><AdminDashboard /></Protected>} />
                <Route path="/admin/users" element={<Protected adminOnly><UsersAdmin /></Protected>} />
                <Route path="/admin/permissions" element={<Protected adminOnly><Permissions /></Protected>} />
                <Route path="/admin/audit-logs" element={<Protected adminOnly><AuditLogs /></Protected>} />
                <Route path="/admin/settings" element={<Protected adminOnly><SystemSettingsAdmin /></Protected>} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
