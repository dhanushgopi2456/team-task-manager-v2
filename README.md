# TEAM TASK MANAGER

> **Smart Teamwork. Clear Tasks. Better Results.**

A production-quality **Ultra-3D 2026 full-stack team productivity platform** — projects,
kanban drag & drop, calendar, analytics, notifications and strict role-based access control
(Admin / Team Lead / Regular Member).

Built with **React 18 + Vite + TypeScript + Tailwind CSS** on the front, and
**Node.js + Express + TypeScript + MongoDB (Mongoose)** on the back.

---

## ✨ Features

| Area | Highlights |
|---|---|
| 🔐 **Auth** | Single secure login for all roles · JWT (httpOnly cookie + Bearer) · bcrypt hashing · register / forgot / reset / change password · session tracking & remote logout |
| 👥 **RBAC** | `admin`, `member` + `memberType: team_lead | regular_member` — enforced by middleware that reloads the user from the DB on every request; client role data is never trusted |
| 📊 **Dashboard** | Animated greeting hero, productivity score dial, 6 animated KPI cards, weekly productivity chart, due-today list, live activity timeline |
| 📁 **Projects** | Floating glass gallery with progress, deadlines, member avatars, overdue counters · create/edit/archive/delete (admin) · add/remove members (admin + project leads) |
| 🗂️ **Project workspace** | Tabs: Overview · Tasks · Kanban · Team · Activity · Files · Timeline |
| 🧲 **Kanban** | dnd-kit drag & drop with rising card, drag overlay, optimistic updates and instant persistence (`TO DO → IN PROGRESS → REVIEW → COMPLETED`) |
| ✅ **Tasks** | Statuses, priorities, assignees, due dates, tags, comments with mentions, attachments, activity history |
| 📅 **Calendar** | Day / Week / Month views of task deadlines; click any day to drill in |
| 🔔 **Notifications** | Floating bell center + full page; assignments, status changes, comments, mentions, deadlines, security events |
| 📈 **Reports** | Completion rate, status distribution, completion trend, per-project progress, workload & member performance tables, date-range filtering |
| 🛡️ **Admin suite** | Admin Dashboard (system overview viz) · User Management (create / edit / delete / activate / reset password / assign roles) · Permission Matrix · Audit Logs (searchable, filterable) · System Settings |
| 🎨 **Ultra-3D design** | Glassmorphism, layered depth shadows, ambient orbs + particles background, raised sidebar pills, hover elevation, Framer Motion micro-interactions, reduced-motion support |

---

## 🚀 Quick start

```bash
# 1. Install everything
npm install            # root (concurrently)
npm run install:all    # server + client deps

# 2. Run dev (API on :5000, web on :5173)
npm run dev

# The API auto-starts an in-memory MongoDB and seeds demo data on first boot.
# Open http://localhost:5173
```

### Demo accounts (seeded automatically)

| Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@example.com` | `Admin@123` |
| **TEAM LEAD** | `john@example.com` | `John@1234` |
| **TEAM LEAD** | `priya@example.com` | `Priya@1234` |
| **REGULAR MEMBER** | `alex@example.com` | `Alex@1234` |
| **REGULAR MEMBER** | `rahul@example.com` / `sara@example.com` | `Rahul@1234` / `Sara@1234` |

Sample data includes **FreshMart E-Commerce**, **AI Analytics Dashboard**, **Mobile Banking App**
and **Company Portfolio**, with 25 tasks across all statuses, comments, notifications,
activity entries and audit events.

---

## 🧑‍💻 Running the project in VS Code (step by step)

### Prerequisites

| Tool | Version | Check with |
|---|---|---|
| [Node.js](https://nodejs.org) | **18+** (20 LTS recommended) | `node --version` |
| npm | 9+ (ships with Node) | `npm --version` |
| [Visual Studio Code](https://code.visualstudio.com) | latest | — |
| MongoDB | *optional* — a free in-memory demo DB starts automatically | `mongod --version` |

> 💡 On Windows, install Node from nodejs.org and run everything from **PowerShell**, or use
> **WSL + VS Code Remote** for the smoothest experience.

### Step 1 — Open the project

1. Unzip / copy the project anywhere, e.g. `C:\projects\team-task-manager`.
2. Launch **VS Code** → `File ▸ Open Folder…` → select the `team-task-manager` root folder.
3. When prompted *"Install recommended extensions?"* click **Install** (Tailwind IntelliSense,
   ESLint, Prettier, MongoDB viewer). You can also install manually:
   ```bash
   code --install-extension bradlc.vscode-tailwindcss
   code --install-extension dbaeumer.vscode-eslint
   code --install-extension esbenp.prettier-vscode
   code --install-extension mongodb.mongodb-vscode
   ```

### Step 2 — Open the integrated terminal

```
Terminal ▸ New Terminal   (shortcut: Ctrl + `)
```

The terminal opens at the project root (`team-task-manager/`).

### Step 3 — Install dependencies

```bash
npm install          # installs concurrently at the root
npm run install:all  # installs server/ and client/ dependencies
```

### Step 4 — (Optional) configure environment

```bash
cd server
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
```

Leave `MONGO_URI=` empty to use the automatic in-memory demo database,
or point it at your own cluster (`mongodb://localhost:27017` / Atlas URI).
Set a strong `JWT_SECRET` before any real deployment.

### Step 5 — Start the app 🚀

Pick **one** of these options:

**Option A · one command (recommended)**

```bash
# from the project root
npm run dev
```

This runs both processes concurrently:

- 🔌 API server → http://localhost:5000/api
- 🌐 Web app  → http://localhost:5173 *(opens automatically — Ctrl+Click the link in the terminal)*

**Option B · VS Code debugger**

Press `F5` (or go to *Run and Debug* panel). Three launch profiles are pre-configured in `.vscode/launch.json`:

- **🚀 Full Stack (API + Web)** — one click, both servers
- **▶ API Server (server/)** — API only, with breakpoints & debugging
- **🌐 Web (client/ — Vite)** — client only, auto-opens the browser

**Option C · two terminals (full control)**

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

### Step 6 — Sign in

Open **http://localhost:5173** and log in with any seeded account (see table above).
The first boot auto-seeds demo data; subsequent restarts keep whatever you created.

### Useful commands while developing

```bash
npm run seed        # reset the database to pristine demo data (from root)
npm run build       # production build: server (tsc) + client (vite)
npm start           # run the compiled production API
```

### Troubleshooting

| Problem | Fix |
|---|---|
| Port `5000`/`5173` already in use | Kill the process using it, or change `PORT` in `server/.env` / `client/vite.config.ts` |
| First boot is slow | The in-memory MongoDB binary (~80 MB) downloads once, then is cached |
| `EADDRINUSE` after a crash | `npx kill-port 5000 5173` or close stray node processes |
| Login returns *Invalid email or password* | Run `npm run seed`, then use the exact demo credentials above |

---

### Using your own MongoDB

```bash
cd server
cp .env.example .env
# set MONGO_URI=mongodb+srv://… or mongodb://localhost:27017
```

With a real `MONGO_URI` the app connects there instead (and still auto-seeds if empty).
Run `npm run seed` anytime to reset demo data.

---

## 🏗️ Architecture

```text
team-task-manager/
├── server/                  # Node + Express + TS + Mongoose REST API
│   └── src/
│       ├── config/          # env loader, DB connection (+ in-memory fallback)
│       ├── models/          # User, Project, Task, Team, Comment, Notification,
│       │                    # Activity, AuditLog, SystemSetting
│       ├── middleware/      # protect (JWT), RBAC guards, error handler
│       ├── controllers/     # auth, users, profile, projects, tasks, teams,
│       │                    # comments, notifications, activity, reports, admin
│       ├── routes/          # /api/auth /users /projects /tasks /comments
│       │                    # /notifications /reports /admin /profile /teams
│       ├── utils/           # jwt signing, audit logger, activity feed, notifier
│       └── seed/            # realistic demo dataset
└── client/                  # React 18 + Vite + TS SPA
    └── src/
        ├── api/             # axios instance + interceptors
        ├── components/      # layout (AppShell/Sidebar/Topbar), UI kit,
        │                    # KanbanBoard (dnd-kit), task modals & rows
        ├── hooks/           # AuthContext, ToastContext
        └── pages/           # auth, dashboard, my-tasks, projects, project details,
                             # kanban, tasks/:id, calendar, team, notifications,
                             # reports, settings, profile + admin/* pages
```

## 🔒 Security

- bcrypt (12 rounds) password hashing — passwords never leave the server
- JWT sessions via **httpOnly, SameSite cookies** *and* `Authorization: Bearer`
- `protect` middleware reloads the user from DB each request; deactivated accounts are rejected instantly
- Role checks (`requireAdmin`, team-lead logic, project membership) inside every controller
- Zod input validation on all mutating endpoints; Mongo cast/duplicate errors normalized
- Helmet security headers, CORS allow-list, rate limiting on auth routes (30 req / 15 min)
- Audit logging for logins (incl. failures), user CRUD, role changes, password resets, deletes, settings changes
- Frontend hides unauthorized actions **but the API enforces them regardless** — e.g. a Regular
  Member calling `/api/admin/audit-logs` directly receives `403 Forbidden`

## 📜 Scripts

| Root command | Action |
|---|---|
| `npm run dev` | Run API + web concurrently |
| `npm run seed` | Re-seed demo database |
| `npm run build` | Build server (`tsc`) + client (`vite`) |
| `npm start` | Start compiled API |

---

**TEAM TASK MANAGER** · Ultra-3D 2026 Edition
