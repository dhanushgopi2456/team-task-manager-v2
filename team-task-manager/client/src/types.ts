export type Role = 'admin' | 'member';
export type MemberType = 'team_lead' | 'regular_member';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  memberType: MemberType | null;
  jobTitle: string;
  avatarColor: string;
  active: boolean;
  lastLogin?: string;
  notificationPrefs?: { email: boolean; tasks: boolean; deadlines: boolean };
  createdAt?: string;
  stats?: { total: number; completed: number; pending: number };
}

export interface Session {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
}

export interface ProjectMember {
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarColor' | 'role' | 'memberType'> & { _id?: string };
  projectRole: 'lead' | 'member';
  addedAt: string;
}

export interface ProjectStats {
  total: number;
  completed: number;
  in_progress: number;
  review: number;
  todo: number;
  overdue: number;
  progress: number;
}

export interface Project {
  id?: string;
  _id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  owner: any;
  members: ProjectMember[];
  startDate: string;
  deadline?: string;
  tags: string[];
  stats?: ProjectStats;
  createdAt: string;
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: Pick<Project, '_id' | 'name' | 'color'> & any;
  assignee?: Pick<User, 'id' | 'name' | 'avatarColor'> & { _id?: string } & any;
  createdBy: any;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  order: number;
  completedAt?: string;
  attachments: Attachment[];
  commentCount?: number;
  commentCountMap?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  _id: string;
  task: string;
  author: { _id: string; name: string; avatarColor: string; role: Role; memberType: MemberType | null };
  body: string;
  createdAt: string;
}

export interface ActivityItem {
  _id: string;
  actor: { _id: string; name: string; avatarColor: string; role: Role; memberType: MemberType | null };
  action: string;
  entityType: string;
  meta?: { title?: string; name?: string; member?: string; projectName?: string; from?: string; to?: string; attachment?: string; taskTitle?: string };
  project?: { _id: string; name: string; color: string } | string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  type: 'task_assigned' | 'status_changed' | 'comment' | 'mention' | 'deadline' | 'project' | 'security';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  actorName: string;
  action: string;
  targetModel?: string;
  targetLabel?: string;
  ip?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  meta?: Record<string, any>;
  createdAt: string;
}

export interface DashboardData {
  kpis: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    teamMembers: number;
  };
  statusBreakdown: { todo: number; in_progress: number; review: number; completed: number };
  weeklyProductivity: { day: string; label: string; completed: number }[];
  dueToday: (Task & { project: any })[];
  recentActivity: ActivityItem[];
  me: { open: number; completed: number; productivityScore: number };
}

export interface ReportsData {
  summary: {
    total: number; completed: number; overdue: number; inProgress: number; review: number; todo: number;
    completionRate: number; overduePct: number;
  };
  statusDistribution: { name: string; value: number; key: string }[];
  trend: { label: string; completed: number }[];
  members: {
    id: string; name: string; avatarColor: string; memberType: MemberType | null; jobTitle: string;
    total: number; completed: number; open: number; rate: number;
  }[];
  projects: { id: string; name: string; color: string; deadline?: string; total: number; completed: number; overdue: number; progress: number }[];
}

export interface AdminAnalytics {
  users: { totalUsers: number; activeUsers: number; inactiveUsers: number; admins: number; teamLeads: number; regularMembers: number; recentLogins: number };
  platform: { totalProjects: number; archivedProjects: number; totalTasks: number; securityEvents: number };
  systemActivity: { day: string; events: number }[];
  recentAudit: AuditLogItem[];
}

export interface SystemSettingsData {
  allowRegistration: boolean;
  defaultMemberType: MemberType;
  emailNotifications: boolean;
  taskNotifications: boolean;
  deadlineReminders: boolean;
  maintenanceMode: boolean;
  sessionDays: number;
}
