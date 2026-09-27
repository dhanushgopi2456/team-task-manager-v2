# 🚀 TEAM TASK MANAGER

<p align="center">

### **Smart Teamwork. Clear Tasks. Better Results.**

**A production-quality Ultra-3D team productivity platform built for modern engineering teams.**

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=6366F1&center=true&vCenter=true&width=850&lines=Manage+Projects+%F0%9F%93%81;Track+Tasks+%E2%9C%85;Collaborate+with+Teams+%F0%9F%91%A5;Visualize+Productivity+%F0%9F%93%8A;Ship+Better+Work+%F0%9F%9A%80" />

</p>

<p align="center">

<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>

</p>

<p align="center">

<img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-Authentication-orange?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>

</p>

---

## 🌟 What Is Team Task Manager?

**Team Task Manager** is a full-stack productivity platform designed to help teams organize projects, manage tasks, collaborate efficiently, and understand their productivity through real-time dashboards and analytics.

It combines:

**📁 Project Management + 🗂️ Kanban + 👥 Team Collaboration + 📅 Planning + 📊 Analytics + 🔐 RBAC + 🎨 Ultra-3D UI**

into one unified workspace.

---

## ⚡ Everything Your Team Needs

```text
                         🚀 TEAM TASK MANAGER
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
     📁 PROJECTS              ✅ TASKS                👥 TEAMS
          │                       │                       │
          ▼                       ▼                       ▼
      Deadlines               Kanban                 Members
      Progress                Priorities              Roles
      Members                 Assignees               Activity
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
                         📊 PRODUCTIVITY
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
             📈 Analytics     📅 Calendar      🔔 Alerts
                  │               │               │
                  └───────────────┼───────────────┘
                                  ▼
                           🎯 BETTER RESULTS
```

---

# ✨ Feature Showcase

| 🚀 Module                 | What You Get                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| 🔐 **Authentication**     | JWT, httpOnly cookies, Bearer tokens, password recovery and session tracking |
| 🛡️ **Role-Based Access** | Admin, Team Lead and Regular Member permissions                              |
| 📊 **Smart Dashboard**    | Productivity score, KPIs, charts, deadlines and live activity                |
| 📁 **Project Management** | Create, edit, archive, delete and manage project members                     |
| 🗂️ **Kanban Board**      | Drag & drop workflow with optimistic updates                                 |
| ✅ **Task Management**     | Status, priority, assignee, tags, due dates and comments                     |
| 📅 **Calendar**           | Day, week and month task views                                               |
| 🔔 **Notifications**      | Assignments, mentions, comments, deadlines and security alerts               |
| 📈 **Reports**            | Completion rate, trends, workload and member performance                     |
| 👑 **Admin Suite**        | Users, permissions, audit logs, settings and system analytics                |
| 🎨 **Ultra-3D UI**        | Glassmorphism, particles, depth, motion and interactive effects              |

---

# 🎯 Built Around Team Workflow

```text
📝 CREATE PROJECT
       │
       ▼
👥 ADD TEAM MEMBERS
       │
       ▼
✅ CREATE TASKS
       │
       ▼
🧲 MOVE THROUGH KANBAN
       │
       ├── 📝 TO DO
       │
       ├── 🔵 IN PROGRESS
       │
       ├── 🟣 REVIEW
       │
       └── 🟢 COMPLETED
       │
       ▼
📊 TRACK PROGRESS
       │
       ▼
🎯 ANALYZE PERFORMANCE
```

---

# 🧲 Kanban Experience

The Kanban board is built around **dnd-kit** and provides a smooth drag-and-drop workflow.

```text
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│ 📝 TO DO   │ → │ 🔵 ACTIVE  │ → │ 🟣 REVIEW  │ → │ 🟢 DONE    │
├────────────┤   ├────────────┤   ├────────────┤   ├────────────┤
│ Task #01   │   │ Task #04   │   │ Task #07   │   │ Task #09   │
│ Task #02   │   │ Task #05   │   │ Task #08   │   │ Task #10   │
│ Task #03   │   │ Task #06   │   │            │   │            │
└────────────┘   └────────────┘   └────────────┘   └────────────┘
```

### ⚡ Interaction Highlights

* 🧲 Drag & drop
* ✨ Lifted card animation
* 🎯 Drag overlay
* ⚡ Optimistic UI updates
* 💾 Instant persistence
* 🔄 Automatic status synchronization

---

# 👥 Role-Based Access Control

Security isn't only handled in the UI.

```text
                    👤 USER
                      │
                      ▼
                 🔑 JWT AUTH
                      │
                      ▼
              🛡️ PROTECT MIDDLEWARE
                      │
                      ▼
                👤 LOAD USER
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       👑 ADMIN    🎯 LEAD     👤 MEMBER
          │           │           │
          ▼           ▼           ▼
       Full       Project      Assigned
       Access     Control      Access
```

The API reloads the user from the database for each request instead of trusting client-side role information.

That means hiding a button in the frontend **does not equal authorization**.

The backend remains the source of truth.

---

# 📊 Productivity Dashboard

The dashboard transforms raw task activity into an easy-to-understand productivity overview.

### 📈 Dashboard Components

* 🎯 Productivity score
* 📊 Animated KPI cards
* 📈 Weekly productivity chart
* ⏰ Due-today tasks
* 🟢 Live activity timeline
* 📁 Project progress
* 👥 Team activity

```text
                 📊 PRODUCTIVITY DASHBOARD

        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ 🎯 87%   │ │ ✅ 124   │ │ ⏰ 08    │
        │ Score    │ │ Complete │ │ Due      │
        └──────────┘ └──────────┘ └──────────┘

        ┌────────────────────────────────────┐
        │        📈 WEEKLY PRODUCTIVITY      │
        │                                    │
        │      ╭──╮                          │
        │   ╭──╯  ╰──╮     ╭──╮             │
        │ ╭─╯         ╰─────╯  ╰──           │
        │                                    │
        └────────────────────────────────────┘
```

---

# 📁 Project Workspace

Each project acts as a complete collaborative workspace.

```text
📁 PROJECT
│
├── 🏠 Overview
├── ✅ Tasks
├── 🧲 Kanban
├── 👥 Team
├── 🔔 Activity
├── 📎 Files
└── 🗓️ Timeline
```

Everything related to a project stays in one place.

---

# 📅 Calendar + Planning

Task deadlines can be visualized across:

**☀️ Day → 📆 Week → 🗓️ Month**

Click any date to drill into the tasks scheduled for that day.

This provides teams with both:

* 🧲 Workflow-based planning through Kanban
* 📅 Time-based planning through Calendar

---

# 🔔 Real-Time Team Awareness

The notification system keeps users informed about important activity.

### Notifications include:

* 👤 Task assignments
* 🔄 Status changes
* 💬 Comments
* @️⃣ Mentions
* ⏰ Upcoming deadlines
* 🔐 Security events

```text
🔔 NOTIFICATION CENTER

👤 John assigned you "API Integration"
                         2 min ago

💬 Priya mentioned you in "Dashboard UI"
                         8 min ago

⏰ "Payment Module" is due tomorrow
                         1 hr ago
```

---

# 📈 Reports & Analytics

Turn team activity into measurable insights.

### 📊 Reports Include

```text
┌─────────────────────────────────────────┐
│ 📈 COMPLETION RATE                      │
├─────────────────────────────────────────┤
│ ████████████████████░░░░ 82%            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📊 STATUS DISTRIBUTION                  │
├─────────────────────────────────────────┤
│ 📝 To Do          24                    │
│ 🔵 In Progress    18                    │
│ 🟣 Review         11                    │
│ 🟢 Completed      57                    │
└─────────────────────────────────────────┘
```

Reports cover:

* Completion rate
* Status distribution
* Completion trends
* Project progress
* Workload
* Member performance
* Custom date ranges

---

# 👑 Admin Command Center

Administrators get a dedicated control layer.

```text
                         👑 ADMIN
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
 📊 Dashboard          👥 Users            🛡️ Permissions
       │                    │                    │
       ▼                    ▼                    ▼
 📜 Audit Logs         ⚙️ Settings          🔑 Roles
```

### Admin capabilities

* 👥 Create, edit and delete users
* 🔄 Activate/deactivate accounts
* 🔑 Assign roles
* 🔐 Reset passwords
* 🛡️ Permission matrix
* 📜 Searchable audit logs
* ⚙️ System settings
* 📊 System overview

---

# 🔐 Security Architecture

```text
                   🌐 REQUEST
                       │
                       ▼
                 🛡️ CORS CHECK
                       │
                       ▼
                🪖 HELMET HEADERS
                       │
                       ▼
                 🚦 RATE LIMIT
                       │
                       ▼
               📝 ZOD VALIDATION
                       │
                       ▼
                  🔑 JWT CHECK
                       │
                       ▼
               👤 DATABASE USER
                       │
                       ▼
                🛡️ RBAC GUARD
                       │
                       ▼
                 🎯 CONTROLLER
                       │
                       ▼
                   🍃 MongoDB
```

### Security Highlights

* 🔐 bcrypt password hashing
* 🍪 httpOnly + SameSite cookies
* 🎫 JWT access authentication
* 🔄 Bearer-token support
* 🛡️ Role-based authorization
* 📝 Zod validation
* 🪖 Helmet headers
* 🌐 CORS allowlist
* 🚦 Rate limiting
* 📜 Audit logging
* 🔒 Server-side permission enforcement

---

# 🧠 Engineering Highlights

This project demonstrates more than CRUD operations.

### ⚡ Optimistic UI

Kanban interactions update the interface immediately and persist the change in the background.

### 🛡️ Server-Side Authorization

Permissions are checked by the backend rather than trusting frontend role state.

### 📜 Auditability

Security-sensitive operations generate audit events.

### 🧩 Modular Architecture

Controllers, middleware, services, models, validators and routes are separated by responsibility.

### 🎨 Advanced UI Engineering

The interface uses glassmorphism, depth, particles, animations and responsive layouts without sacrificing usability.

### ♿ Reduced Motion

Motion-heavy interactions account for users who prefer reduced animation.

---

# 🏗️ Architecture

```text
                    ┌───────────────────┐
                    │      USER         │
                    └─────────┬─────────┘
                              │
                              ▼
                 ┌──────────────────────┐
                 │   React + Vite SPA   │
                 │                      │
                 │ Pages                │
                 │ Components           │
                 │ Context              │
                 │ API Client           │
                 └──────────┬───────────┘
                            │
                       REST / Axios
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Express + TypeScript │
                 │                      │
                 │ Routes               │
                 │ Middleware           │
                 │ Controllers          │
                 │ Services             │
                 │ Validators           │
                 └──────────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Mongoose    │
                    └───────┬───────┘
                            │
                            ▼
                      🍃 MongoDB
```

---

# 🛠️ Technology Stack

### 🎨 Frontend

| Technology       | Purpose             |
| ---------------- | ------------------- |
| ⚛️ React 18      | UI                  |
| ⚡ Vite           | Development & build |
| 🟦 TypeScript    | Type safety         |
| 🎨 Tailwind CSS  | Styling             |
| 🧲 dnd-kit       | Kanban drag & drop  |
| 🎬 Framer Motion | Animations          |
| 📊 Recharts      | Data visualization  |
| 🌐 Axios         | API communication   |

### ⚙️ Backend

| Technology    | Purpose          |
| ------------- | ---------------- |
| 🟢 Node.js    | Runtime          |
| 🚂 Express    | REST API         |
| 🟦 TypeScript | Type safety      |
| 🍃 MongoDB    | Database         |
| 🔗 Mongoose   | ODM              |
| 🔐 JWT        | Authentication   |
| 🔒 bcrypt     | Password hashing |
| 🛡️ Helmet    | Security headers |
| 📝 Zod        | Validation       |

---

# 📂 Project Structure

```text
team-task-manager/
│
├── 🖥️ client/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── pages/
│
├── ⚙️ server/
│   └── src/
│       ├── config/
│       ├── models/
│       ├── middleware/
│       ├── controllers/
│       ├── routes/
│       ├── utils/
│       └── seed/
│
├── 📄 package.json
├── ⚙️ .vscode/
└── 📖 README.md
```

---

# 🚀 Quick Start

```bash
# Clone
git clone <repository-url>

# Install
npm install
npm run install:all

# Start development
npm run dev
```

Then open:

**🌐 http://localhost:5173**

The project supports an automatic in-memory MongoDB demo environment, so you can explore the application without configuring an external MongoDB server.

---

# 🎮 Demo Experience

### 👑 Admin

```text
admin@example.com
Admin@123
```

### 🎯 Team Lead

```text
john@example.com
John@1234
```

### 👤 Regular Member

```text
alex@example.com
Alex@1234
```

Use the different accounts to experience how the interface and permissions change between roles.

---

# 🗺️ Roadmap

### ✅ Current

* [x] JWT Authentication
* [x] RBAC
* [x] Project Management
* [x] Kanban
* [x] Task Management
* [x] Calendar
* [x] Notifications
* [x] Reports
* [x] Admin Dashboard
* [x] Audit Logs
* [x] Ultra-3D UI

### 🔮 Future

* [ ] 💬 Real-time team chat
* [ ] 🔴 WebSocket live updates
* [ ] 📱 Mobile application
* [ ] 🤖 AI task assistant
* [ ] 🧠 AI productivity insights
* [ ] 📎 Advanced file management
* [ ] 🔗 GitHub integration
* [ ] 🔗 Slack integration
* [ ] 📊 Advanced team analytics
* [ ] 🌍 Multi-organization workspaces

---

# 💡 What This Project Demonstrates

```text
                    FULL-STACK ENGINEERING
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
   🎨 FRONTEND           ⚙️ BACKEND          🔐 SECURITY
       │                    │                    │
   React                Express              JWT
   TypeScript           MongoDB              RBAC
   Tailwind             REST APIs             bcrypt
   Vite                 Mongoose              Helmet
   Framer Motion        Controllers           Zod
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                     🚀 PRODUCTION
                       ARCHITECTURE
```

---

# ⭐ Why This Project Stands Out

**TEAM TASK MANAGER isn't just a task CRUD application.**

It demonstrates how a real productivity platform can combine:

**🎨 Modern UX**

**⚙️ Full-stack architecture**

**🔐 Security**

**👥 Role-based collaboration**

**📊 Data visualization**

**🧲 Interactive workflows**

**📜 Auditing**

**📱 Responsive design**

into one cohesive application.

---

<p align="center">

## 🚀 Smart Teamwork. Clear Tasks. Better Results.

**Built with ❤️ using React, TypeScript, Node.js, Express & MongoDB**

⭐ **Star the repository if you like it!**

</p>
