<![CDATA[<div align="center">

# 🧾 ClearClaim

### Modern Expense Management & Approval Workflow Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://mongoosejs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

**ClearClaim** is a full-stack, multi-tenant expense management platform built with Next.js 15. It streamlines expense submission, approval workflows, and financial oversight for organizations of any size.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [API Reference](#-api-reference)

</div>

---

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure HTTP-only cookie sessions
- **Role-based access control** (RBAC) with three roles: `ADMIN`, `MANAGER`, `EMPLOYEE`
- **Middleware-level route protection** — unauthorized users are automatically redirected
- **Multi-tenant isolation** — all data is scoped to the user's company

### 👤 User Management (Admin)
- Create, edit, disable, and delete users within your organization
- Assign roles and managers to employees
- View all company users with manager details populated

### 💰 Expense Management
- **Submit expenses** with category, amount, currency, date, and description
- **Multi-currency support** with automatic FX conversion to company currency
- **Expense categories**: Travel, Meals, Supplies, Software, Other
- **Status tracking**: Draft → Submitted → Pending → Approved / Rejected
- **View expense history** with detailed individual expense pages

### ✅ Approval Workflow Engine
- **Dual routing system**:
  - **ApprovalFlow** — Step-based approval with USER/ROLE steps for complex workflows
  - **ApprovalRule** — Direct approver assignment for simpler routing (fallback)
- **Intelligent matching** — the engine first tries ApprovalFlow, then falls back to ApprovalRule
- **Approve / Reject** with mandatory comments on rejection
- **Admin override** capabilities for edge cases

### 📊 Dashboards
- **Employee Dashboard** — Submit and track your expenses
- **Manager Dashboard** — View team expenses and pending approvals requiring action
- **Admin Dashboard** — Full organizational oversight with user and expense management

### 🎨 Premium UI/UX
- **Glassmorphic design** with backdrop blur and translucent cards
- **Dark mode** theming throughout
- **Animated transitions** using CSS keyframe animations
- **Responsive design** — works on desktop, tablet, and mobile
- **Gradient accents** and micro-interactions for a premium feel

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.5 (App Router) |
| **Language** | TypeScript 5 |
| **Frontend** | React 19, Tailwind CSS 4, Radix UI, Lucide Icons |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | MongoDB with Mongoose 9 ODM |
| **Auth** | JWT (jose) + bcryptjs password hashing |
| **Validation** | Zod 4 |
| **Forms** | React Hook Form 7 |
| **Animations** | Framer Motion, CSS keyframes |
| **Charts** | Recharts |
| **Notifications** | Sonner toast library |
| **Date Utils** | date-fns |
| **OCR** | Tesseract.js (receipt scanning) |
| **File Storage** | Cloudinary |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **MongoDB** instance (local or Atlas)
- **npm** or **pnpm**

### 1. Clone the repository

```bash
git clone https://github.com/pixelmeet/ClearClaim.git
cd ClearClaim
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Core
JWT_SECRET=your-strong-random-secret-key

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=clearclaim

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
ClearClaim/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin pages (users, approvals, expenses, company)
│   ├── api/                      # API routes
│   │   ├── admin/                #   Admin APIs (users, expenses, company)
│   │   ├── approval-rules/       #   ApprovalRule CRUD
│   │   ├── auth/                 #   Login, Signup, Logout
│   │   ├── expenses/             #   Expense CRUD
│   │   └── manager/              #   Manager APIs (approvals, team-expenses)
│   ├── dashboard/                # Shared dashboard (expenses, new expense)
│   ├── employee/                 # Employee dashboard
│   ├── login/                    # Login page
│   ├── manager/                  # Manager pages (approvals, team-expenses)
│   ├── signup/                   # Signup page
│   ├── globals.css               # Global styles & design tokens
│   ├── animations.css            # Keyframe animation definitions
│   └── layout.tsx                # Root layout
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── admin/                    # Admin-specific components
│   ├── admin-approval/           # Approval rule form
│   └── DashboardSidebar.tsx      # Glassmorphic sidebar navigation
│
├── lib/                          # Shared utilities
│   ├── auth/                     # Auth helpers (session, cookies, password, token)
│   ├── auth.ts                   # Auth facade (getSession, signToken, etc.)
│   ├── approvalEngine.ts         # Core approval matching logic
│   ├── db.ts                     # MongoDB connection singleton
│   ├── types.ts                  # Shared enums & interfaces
│   └── validation.ts             # Zod schemas
│
├── models/                       # Mongoose models
│   ├── ApprovalAction.ts         # Records approve/reject actions
│   ├── ApprovalFlow.ts           # Step-based approval workflows
│   ├── ApprovalRequest.ts        # Tracks approval requests
│   ├── ApprovalRule.ts           # Direct approver rules
│   ├── Company.ts                # Multi-tenant company
│   ├── Expense.ts                # Expense claims
│   └── User.ts                   # Users with roles & manager refs
│
├── middleware.ts                 # Route protection & role-based redirects
├── package.json
└── tsconfig.json
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new company + admin user |
| `POST` | `/api/auth/login` | Login and receive JWT session cookie |
| `GET`  | `/api/auth/logout` | Clear session and redirect to login |

### User Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users in the company |
| `POST` | `/api/admin/users` | Create a new user |
| `PATCH` | `/api/admin/users/[id]` | Update user details (role, manager, etc.) |
| `DELETE` | `/api/admin/users/[id]` | Delete a user |
| `PATCH` | `/api/admin/users/[id]/status` | Enable/disable a user |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses` | List current user's expenses |
| `POST` | `/api/expenses` | Submit a new expense |
| `GET` | `/api/expenses/[id]` | Get expense details |

### Admin Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/expenses` | List all company expenses |
| `POST` | `/api/admin/expenses/override` | Admin override approve/reject |

### Approval Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/approval-rules` | List all approval rules |
| `POST` | `/api/approval-rules` | Create a new approval rule |
| `PATCH` | `/api/approval-rules/[id]` | Update an approval rule |
| `DELETE` | `/api/approval-rules/[id]` | Delete an approval rule |

### Manager Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/manager/approvals` | Get pending expenses for this approver |
| `POST` | `/api/manager/approvals/action` | Approve or reject an expense |
| `GET` | `/api/manager/team-expenses` | List all expenses from direct reports |

---

## 🗃️ Data Models

```mermaid
erDiagram
    Company ||--o{ User : "has"
    Company ||--o{ Expense : "has"
    Company ||--o{ ApprovalRule : "has"
    Company ||--o{ ApprovalFlow : "has"
    User ||--o{ Expense : "submits"
    User ||--o{ User : "manages"
    Expense ||--o{ ApprovalRequest : "has"
    ApprovalRule ||--o{ ApprovalRequest : "triggers"
    ApprovalRequest ||--o{ ApprovalAction : "has"
    User ||--o{ ApprovalAction : "performs"

    Company {
        string name
        string adminEmail
        string currency
    }
    User {
        ObjectId companyId
        string name
        string email
        string passwordHash
        enum role
        ObjectId managerId
        boolean isDisabled
    }
    Expense {
        ObjectId companyId
        ObjectId employeeId
        number amountOriginal
        string currencyOriginal
        number amountCompany
        string companyCurrency
        number fxRate
        date expenseDate
        enum category
        string description
        enum status
        number currentStepIndex
    }
    ApprovalRule {
        ObjectId organization
        ObjectId appliesToUser
        boolean isManagerApprover
        ObjectId manager
        array approvers
    }
    ApprovalFlow {
        ObjectId companyId
        string name
        array steps
    }
```

---

## 👥 User Roles & Permissions

| Feature | Employee | Manager | Admin |
|---------|:--------:|:-------:|:-----:|
| Submit expenses | ✅ | ✅ | ✅ |
| View own expenses | ✅ | ✅ | ✅ |
| View team expenses | ❌ | ✅ | ✅ |
| Approve/Reject expenses | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Manage approval rules | ❌ | ❌ | ✅ |
| Override approvals | ❌ | ❌ | ✅ |
| View all company expenses | ❌ | ❌ | ✅ |
| Company settings | ❌ | ❌ | ✅ |

---

## 🔒 Security

- **JWT tokens** signed with HS256, stored in HTTP-only cookies
- **Password hashing** with bcryptjs (10 salt rounds)
- **Middleware-level route protection** — no client-side-only guards
- **Multi-tenant data isolation** — all queries are scoped to `companyId`
- **Input validation** with Zod schemas on all API endpoints
- **Role-based access control** enforced at both middleware and API level

---

## 📄 License

This project is proprietary. All rights reserved.

---

<div align="center">

Built with ❤️ using **Next.js 15**, **React 19**, and **MongoDB**

</div>
]]>
