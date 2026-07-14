<p align="center">
  <img src="client/public/logo.svg" alt="IndoTech Logo" width="80" />
</p>

<h1 align="center">INDOTECH Enterprise Project Management System</h1>

<p align="center">
  <strong>Enterprise-grade project planning, milestone tracking, and financial management platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Private-red" alt="Private" />
</p>

---

## 📋 Overview

The **INDOTECH Enterprise Project Management System (EPMS)** is a full-stack web application designed for **Indo Tech Transformers Limited (ITTL)** to manage the complete lifecycle of enterprise projects — from initial planning and milestone tracking through task execution, budgeting, and daily progress reporting.

Built with **React 19 + Vite** on the frontend and **Supabase** (PostgreSQL + Auth + RLS) on the backend, it provides role-based access control and real-time synchronization for seamless team collaboration.

---

## ✨ Features

### 🔐 Role-Based Access Control
| Role | Access |
|------|--------|
| **Admin / Project Manager** | Full access — create projects, manage budgets, assign teams, and approve DPRs |
| **Team Leader** | Operational access — manage tasks, milestones, and team assignments |
| **Team Member** | Execution access — view assigned tasks, submit DPRs, and upload documents |
| **Finance** | Financial access — view and manage budgets, billing, and resource costs |
| **Stakeholder / Client** | Read-only access — view high-level project progress and Gantt charts |

### 📦 Core Modules
- **Dashboard** — Real-time KPIs, project health metrics, and high-level progress tracking
- **Project Management** — Create, edit, and track enterprise projects with auto or manual progress calculation
- **Milestones** — Break projects down into key deliverables with timeline tracking
- **Gantt Chart** — Visual, interactive timeline representation of projects, milestones, and tasks
- **Task Management** — Granular task assignment, priority levels, and completion tracking
- **Team Management** — Resource allocation and team member assignment per project
- **DPR (Daily Progress Report)** — Daily operational tracking and status updates
- **Budget & Billing** — Financial tracking, cost estimation vs. actuals, and invoicing
- **Document Management** — Centralized repository for project files and assets
- **Notifications** — Automated email and system alerts for task assignments and deadlines

### 🎨 Design
- **Premium Aesthetics:** Dark-themed glassmorphism login page featuring a custom interactive Blackhole animation
- **Clean Interface:** Professional, high-contrast light theme for data-dense operational pages
- **Typography:** Playfair Display for elegant headings, Geist sans-serif for high-legibility data tables
- **Motion Language:** Fluid layout morphing (Framer Motion) and micro-interactions for a native-app feel
- **Responsive Layout:** Adaptive sidebar and fluid data tables

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, React Router DOM |
| **Backend** | Supabase (PostgreSQL, Auth, Row Level Security) |
| **Styling** | Custom Design Tokens (Vanilla CSS variables, tailored UI components) |
| **Icons & Motion** | Lucide React, Framer Motion |
| **Auth** | Supabase Auth with role enforcement |
| **Hosting** | Local development (Vite dev server) / Production-ready builds |

---

## 📁 Project Structure

```text
├── client/
│   ├── public/               # Logo and static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI component library (BlackHole, FormModal, DataTable)
│   │   │   └── DashboardLayout.tsx # Main application shell and sidebar
│   │   ├── lib/
│   │   │   └── supabase.ts   # Supabase client configuration
│   │   ├── pages/
│   │   │   ├── Login.tsx           # Two-stage glassmorphism login
│   │   │   ├── Dashboard.tsx       # Analytics overview
│   │   │   ├── ProjectManagement.tsx
│   │   │   ├── MilestoneManagement.tsx
│   │   │   ├── GanttChart.tsx      # Visual timeline
│   │   │   ├── TaskManagement.tsx
│   │   │   ├── TeamManagement.tsx
│   │   │   ├── DPR.tsx             # Daily Progress Reports
│   │   │   ├── BudgetManagement.tsx
│   │   │   ├── BillingManagement.tsx
│   │   │   ├── DocumentManagement.tsx
│   │   │   └── EmailNotification.tsx
│   │   ├── App.tsx           # Root router
│   │   └── index.css         # Global styles and design tokens
├── database/                 # SQL migration scripts (e.g., manual_progress_migration.sql)
├── .env.example              # Environment variable template
└── package.json              # Root workspace configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- A **Supabase** project ([create one free](https://supabase.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/KRISH-exe-29/PMS.git
cd PMS

# 2. Install dependencies (installs root, client, and server packages)
npm run install:all

# 3. Set up environment variables
cd client
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 4. Start the development environment
cd ..
npm run dev
```

The application will be available at `http://localhost:5173/`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

> ⚠️ **Never commit `.env` files.** The `.gitignore` is configured to exclude all environment files.

---

## 🗄️ Database Setup

The application requires the following core Supabase tables:

| Table | Purpose |
|-------|---------|
| `projects` | High-level project data, budgets, and status |
| `milestones` | Project deliverables and timeline phases |
| `tasks` | Granular action items linked to milestones |
| `team` | Team members and resource allocation |
| `dpr` | Daily Progress Reports submitted by members |
| `budget` / `billing` | Financial tracking tables |
| `documents` | File metadata and storage references |

**Note:** Ensure all migration scripts found in the `database/` directory are executed in your Supabase SQL Editor to maintain schema integrity (e.g., `hierarchy_migration.sql`, `billing_migration.sql`, `manual_progress_migration.sql`).

---

## 📄 License

This project is proprietary software developed for **Indo Tech Transformers Limited (ITTL)**.  
Unauthorized reproduction or distribution is prohibited.

---

<p align="center">
  <sub>Built with ❤️ for INDOTECH — Indo Tech Transformers Limited</sub>
</p>
