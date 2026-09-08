import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Team } from '../models/Team';
import { Comment } from '../models/Comment';
import { Notification } from '../models/Notification';
import { Activity } from '../models/Activity';
import { AuditLog } from '../models/AuditLog';
import { SystemSetting } from '../models/SystemSetting';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const at = (days: number) => new Date(now + days * DAY);

export async function seed() {
  await Promise.all([
    User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({}), Team.deleteMany({}),
    Comment.deleteMany({}), Notification.deleteMany({}), Activity.deleteMany({}),
    AuditLog.deleteMany({}), SystemSetting.deleteMany({}),
  ]);
  await SystemSetting.create({ key: 'global', allowRegistration: true });

  /* ---------- Users ---------- */
  const [admin, john, priya, alex, rahul, sara] = await User.create([
    {
      name: 'System Admin', email: 'admin@example.com', password: 'Admin@123',
      role: 'admin', memberType: null, jobTitle: 'Platform Administrator', avatarColor: '#ef4444',
      lastLogin: at(0),
    },
    {
      name: 'John Doe', email: 'john@example.com', password: 'John@1234',
      role: 'member', memberType: 'team_lead', jobTitle: 'Engineering Lead', avatarColor: '#6366f1',
      lastLogin: at(0),
    },
    {
      name: 'Priya Sharma', email: 'priya@example.com', password: 'Priya@1234',
      role: 'member', memberType: 'team_lead', jobTitle: 'Design Lead', avatarColor: '#ec4899',
      lastLogin: at(-1),
    },
    {
      name: 'Alex Kumar', email: 'alex@example.com', password: 'Alex@1234',
      role: 'member', memberType: 'regular_member', jobTitle: 'Backend Developer', avatarColor: '#10b981',
      lastLogin: at(0),
    },
    {
      name: 'Rahul Verma', email: 'rahul@example.com', password: 'Rahul@1234',
      role: 'member', memberType: 'regular_member', jobTitle: 'Frontend Developer', avatarColor: '#f59e0b',
      lastLogin: at(-2),
    },
    {
      name: 'Sara Iyer', email: 'sara@example.com', password: 'Sara@1234',
      role: 'member', memberType: 'regular_member', jobTitle: 'QA Engineer', avatarColor: '#06b6d4',
      lastLogin: at(-1),
    },
  ]);

  /* ---------- Projects ---------- */
  const [freshmart, aiDash, banking, portfolio] = await Project.create([
    {
      name: 'FreshMart E-Commerce', description: 'Full-featured online grocery store with real-time inventory, payments and delivery scheduling.',
      status: 'active', priority: 'high', color: '#10b981', owner: admin, deadline: at(8), startDate: at(-40),
      tags: ['ecommerce', 'react', 'node'], members: [
        { user: john._id, projectRole: 'lead' }, { user: alex._id, projectRole: 'member' },
        { user: rahul._id, projectRole: 'member' }, { user: sara._id, projectRole: 'member' },
      ],
    },
    {
      name: 'AI Analytics Dashboard', description: 'Executive analytics platform with ML-powered forecasting and natural-language querying.',
      status: 'active', priority: 'urgent', color: '#8b5cf6', owner: admin, deadline: at(21), startDate: at(-25),
      tags: ['ai', 'charts', 'python'], members: [
        { user: priya._id, projectRole: 'lead' }, { user: alex._id, projectRole: 'member' },
        { user: sara._id, projectRole: 'member' },
      ],
    },
    {
      name: 'Mobile Banking App', description: 'Secure mobile banking experience with biometric auth, instant transfers and spending insights.',
      status: 'planning', priority: 'medium', color: '#6366f1', owner: admin, deadline: at(60), startDate: at(-5),
      tags: ['mobile', 'security'], members: [
        { user: john._id, projectRole: 'lead' }, { user: priya._id, projectRole: 'member' },
        { user: rahul._id, projectRole: 'member' },
      ],
    },
    {
      name: 'Company Portfolio', description: 'Marketing site refresh showcasing case studies, careers and company culture.',
      status: 'completed', priority: 'low', color: '#f59e0b', owner: admin, deadline: at(-6), startDate: at(-70),
      tags: ['marketing', 'design'], members: [
        { user: priya._id, projectRole: 'lead' }, { user: sara._id, projectRole: 'member' },
      ],
    },
  ]);

  /* ---------- Tasks ---------- */
  type Seed = { t: string; p: any; a?: any; s: string; pr: string; d?: number; tags?: string[]; desc?: string };
  const seeds: Seed[] = [
    // FreshMart
    { t: 'Build authentication API', p: freshmart, a: alex, s: 'completed', pr: 'high', d: -12, tags: ['api', 'auth'], desc: 'JWT login/register/refresh endpoints with bcrypt hashing and rate limiting.' },
    { t: 'Design landing page', p: freshmart, a: rahul, s: 'in_progress', pr: 'high', d: 2, tags: ['ui', 'design'], desc: 'Hero, featured categories and testimonials sections.' },
    { t: 'Create MongoDB schema', p: freshmart, a: alex, s: 'completed', pr: 'medium', d: -8, tags: ['database'], desc: 'Products, orders, carts and users collections with indexes.' },
    { t: 'Implement payment integration', p: freshmart, a: alex, s: 'review', pr: 'urgent', d: 3, tags: ['payments'], desc: 'Card + UPI checkout flow with idempotent webhooks.' },
    { t: 'Fix responsive navbar', p: freshmart, a: rahul, s: 'todo', pr: 'medium', d: -2, tags: ['bug', 'css'], desc: 'Hamburger menu overlaps content on tablet breakpoints.' },
    { t: 'Inventory sync worker', p: freshmart, a: alex, s: 'todo', pr: 'high', d: 5, tags: ['backend'], desc: 'Nightly stock reconciliation against supplier feeds.' },
    { t: 'Delivery slot picker UI', p: freshmart, a: rahul, s: 'todo', pr: 'medium', d: 6, tags: ['ui'] },
    { t: 'Write E2E checkout tests', p: freshmart, a: sara, s: 'in_progress', pr: 'high', d: 4, tags: ['testing'] },
    { t: 'SEO meta & sitemap', p: freshmart, a: rahul, s: 'completed', pr: 'low', d: -5, tags: ['seo'] },
    { t: 'Set up CI pipeline', p: freshmart, a: john, s: 'completed', pr: 'medium', d: -15, tags: ['devops'] },

    // AI Analytics
    { t: 'Forecast model prototype', p: aiDash, a: alex, s: 'in_progress', pr: 'urgent', d: 3, tags: ['ml'], desc: 'Baseline ARIMA vs gradient boosting on revenue series.' },
    { t: 'Natural-language query parser', p: aiDash, a: alex, s: 'todo', pr: 'high', d: 12, tags: ['nlp'] },
    { t: 'Dashboard layout design', p: aiDash, a: priya, s: 'completed', pr: 'high', d: -6, tags: ['design'] },
    { t: 'KPI widget library', p: aiDash, a: rahul, s: 'review', pr: 'medium', d: 2, tags: ['frontend'] },
    { t: 'Data ingestion pipeline', p: aiDash, s: 'todo', pr: 'high', d: 9, tags: ['backend'], desc: 'Unassigned — needs a backend owner.' },
    { t: 'Chart theming pass', p: aiDash, a: priya, s: 'in_progress', pr: 'low', d: 7, tags: ['design'] },
    { t: 'Export to PDF report', p: aiDash, a: sara, s: 'todo', pr: 'low', d: 14, tags: ['feature'] },

    // Banking
    { t: 'Security threat model', p: banking, a: john, s: 'in_progress', pr: 'urgent', d: 5, tags: ['security'] },
    { t: 'Wireframe key flows', p: banking, a: priya, s: 'todo', pr: 'high', d: 8, tags: ['ux'] },
    { t: 'Choose state architecture', p: banking, a: rahul, s: 'todo', pr: 'medium', d: 10, tags: ['architecture'] },
    { t: 'Biometric auth spike', p: banking, s: 'todo', pr: 'high', d: 13, tags: ['research'] },
    { t: 'Regulatory compliance checklist', p: banking, a: sara, s: 'completed', pr: 'high', d: -3, tags: ['compliance'] },

    // Portfolio (completed)
    { t: 'Case studies copywriting', p: portfolio, a: priya, s: 'completed', pr: 'medium', d: -30, tags: ['content'] },
    { t: 'Deploy production build', p: portfolio, a: john, s: 'completed', pr: 'high', d: -8, tags: ['deploy'], desc: 'CDN, caching headers and uptime monitoring configured.' },
    { t: 'Careers page animation', p: portfolio, a: rahul, s: 'completed', pr: 'low', d: -20, tags: ['motion'] },
  ];

  const tasks = await Task.insertMany(
    seeds.map((s, i) => ({
      title: s.t,
      description: s.desc || '',
      project: s.p._id,
      assignee: s.a?._id,
      createdBy: (s.p === freshmart ? john : s.p === aiDash ? priya : admin)._id,
      status: s.s as any,
      priority: s.pr as any,
      dueDate: s.d !== undefined ? at(s.d) : undefined,
      tags: s.tags || [],
      order: i,
      completedAt: s.s === 'completed' ? at((s.d ?? 0) - 1) : undefined,
      createdAt: at(Math.min(s.d ?? -1, -0) - 3),
    }))
  );

  const byTitle = new Map(tasks.map((t) => [t.title, t]));

  /* ---------- Comments ---------- */
  await Comment.insertMany([
    { task: byTitle.get('Build authentication API')!._id, author: john._id, body: 'Nice work on the refresh-token rotation. Ship it.', createdAt: at(-11) },
    { task: byTitle.get('Build authentication API')!._id, author: sara._id, body: 'Added brute-force cases to the test suite — all green.', createdAt: at(-10.5) },
    { task: byTitle.get('Implement payment integration')!._id, author: john._id, body: '@alex please double-check webhook retries before review.', createdAt: at(-1) },
    { task: byTitle.get('Fix responsive navbar')!._id, author: rahul._id, body: 'Reproduces on iPad landscape only. Working on a fix.', createdAt: at(-0.5) },
    { task: byTitle.get('Forecast model prototype')!._id, author: priya._id, body: 'Can we surface confidence intervals in the chart tooltip?', createdAt: at(-0.8) },
  ]);

  /* ---------- Activity ---------- */
  await Activity.insertMany([
    { actor: alex._id, action: 'completed_task', entityType: 'task', entityId: byTitle.get('Build authentication API')!._id, project: freshmart._id, meta: { title: 'Build authentication API' }, createdAt: at(-12) },
    { actor: john._id, action: 'created_project', entityType: 'project', entityId: freshmart._id, project: freshmart._id, meta: { name: 'FreshMart E-Commerce' }, createdAt: at(-40) },
    { actor: priya._id, action: 'changed_status', entityType: 'task', entityId: byTitle.get('KPI widget library')!._id, project: aiDash._id, meta: { title: 'KPI widget library', from: 'in_progress', to: 'review' }, createdAt: at(-1.2) },
    { actor: admin._id, action: 'added_member', entityType: 'project', entityId: banking._id, project: banking._id, meta: { member: 'Sara Iyer', projectName: 'Mobile Banking App' }, createdAt: at(-4) },
    { actor: rahul._id, action: 'added_comment', entityType: 'comment', project: freshmart._id, meta: { taskTitle: 'Fix responsive navbar' }, createdAt: at(-0.5) },
    { actor: sara._id, action: 'created_task', entityType: 'task', entityId: byTitle.get('Write E2E checkout tests')!._id, project: freshmart._id, meta: { title: 'Write E2E checkout tests' }, createdAt: at(-3) },
  ]);

  /* ---------- Notifications ---------- */
  await Notification.insertMany([
    { user: alex._id, type: 'task_assigned', title: 'New task assigned', message: 'John Doe assigned you “Inventory sync worker” in FreshMart E-Commerce.', link: '/my-tasks', read: false, createdAt: at(-0.2) },
    { user: alex._id, type: 'deadline', title: 'Deadline approaching', message: '“Implement payment integration” is due in 3 days.', link: '/my-tasks', read: false, createdAt: at(-0.1) },
    { user: john._id, type: 'comment', title: 'New comment on your task', message: 'Rahul Verma commented on “Fix responsive navbar”.', link: '/projects', read: false, createdAt: at(-0.4) },
    { user: admin._id, type: 'project', title: 'Project completed', message: 'Company Portfolio was marked complete. Great work!', link: '/projects', read: true, createdAt: at(-6) },
    { user: priya._id, type: 'mention', title: 'You were mentioned', message: 'Alex Kumar mentioned you in AI Analytics Dashboard.', link: '/projects', read: false, createdAt: at(-0.7) },
    { user: sara._id, type: 'status_changed', title: 'Task moved to review', message: '“KPI widget library” is awaiting QA review.', link: '/my-tasks', read: false, createdAt: at(-1.2) },
  ]);

  /* ---------- Audit logs ---------- */
  await AuditLog.insertMany([
    { actorName: 'System', action: 'system_bootstrap', targetModel: 'System', result: 'success', ip: '127.0.0.1', userAgent: 'seed-script', createdAt: now - 1000 },
    { actor: admin._id, actorName: 'System Admin', action: 'user_created', targetModel: 'User', targetId: john._id, targetLabel: 'john@example.com', result: 'success', ip: '10.0.0.14', userAgent: 'Chrome/126', createdAt: at(-45) },
    { actor: admin._id, actorName: 'System Admin', action: 'role_changed', targetModel: 'User', targetId: priya._id, targetLabel: 'priya@example.com', result: 'success', meta: { changes: ['role member→team_lead'] }, ip: '10.0.0.14', userAgent: 'Chrome/126', createdAt: at(-44) },
    { actor: admin._id, actorName: 'System Admin', action: 'password_reset_by_admin', targetModel: 'User', targetId: rahul._id, targetLabel: 'rahul@example.com', result: 'success', ip: '10.0.0.14', userAgent: 'Chrome/126', createdAt: at(-20) },
    { actorName: 'unknown@attacker.test', action: 'login_failed', result: 'failure', ip: '203.0.113.9', userAgent: 'curl/8.1', createdAt: at(-0.05) },
    { actor: admin._id, actorName: 'System Admin', action: 'user_deactivated', targetModel: 'User', targetLabel: 'contractor@example.com', result: 'success', ip: '10.0.0.14', userAgent: 'Firefox/128', createdAt: at(-9) },
  ]);

  /* ---------- Teams ---------- */
  await Team.create([
    { name: 'Core Engineering', description: 'Platform and API development', lead: john._id, members: [john._id, alex._id, rahul._id] },
    { name: 'Design Studio', description: 'Product design and research', lead: priya._id, members: [priya._id, rahul._id, sara._id] },
  ]);

  console.log('[seed] Demo data loaded:');
  console.log('   admin@example.com / Admin@123          → ADMIN');
  console.log('   john@example.com  / John@1234          → TEAM LEAD');
  console.log('   priya@example.com / Priya@1234         → TEAM LEAD');
  console.log('   alex@example.com  / Alex@1234          → REGULAR MEMBER');
  console.log(`[seed] ${tasks.length} tasks across 4 projects.`);
}

if (require.main === module) {
  (async () => {
    const { connectDB } = await import('../config/db');
    await connectDB();
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
