# ClearClaim

> Multi-tenant expense management and approval workflow system

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-green?style=flat-square&logo=mongodb)](https://mongoosejs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

ClearClaim lets organizations manage employee expense claims end-to-end — from submission through a configurable multi-step approval chain, to final resolution. Built with Next.js 15 App Router, MongoDB, and TypeScript.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Concepts](#2-core-concepts)
3. [Architecture Overview](#3-architecture-overview)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Setup Instructions](#6-setup-instructions)
7. [Environment Variables](#7-environment-variables)
8. [Authentication Flow](#8-authentication-flow)
9. [Approval Workflow Logic](#9-approval-workflow-logic)
10. [API Design Philosophy](#10-api-design-philosophy)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Known Limitations](#12-known-limitations)
13. [Roadmap](#13-roadmap)

---

## 1. Project Overview

An employee submits an expense. The system routes it through a configurable approval chain. A manager or designated approver reviews and approves or rejects it. Admins have full visibility and override capabilities.

**Every database entity is scoped to a `companyId`.** There is no cross-company data access at any layer — not in queries, not in API responses, not in middleware.

The approval engine supports two distinct routing strategies, conditional auto-approval rules, and a full audit trail via `ApprovalAction` records.

---

## 2. Core Concepts

### Multi-Tenancy

Every Mongoose model that holds business data includes a `companyId` field referencing the `Company` collection. All queries filter by `companyId` derived from the authenticated user's JWT session.

> **Important:** Tenant filtering is enforced at the API route level, not by global middleware. Every new query you write must include `companyId` filtering manually.

```
Company
  └── User            (companyId: ObjectId)
  └── Expense         (companyId: ObjectId)
  └── ApprovalFlow    (companyId: ObjectId)
  └── ApprovalRule    (organization: string  ← note: string, not ObjectId)
  └── ApprovalAction  (companyId: ObjectId)
```

> **Schema inconsistency:** `ApprovalRule` uses `organization` (a string) instead of `companyId` (ObjectId). When querying, always use `.toString()` on the ObjectId. See [Common Pitfalls §2](#2-approvalrule-uses-organization-string-not-companyid-objectid).

### Roles

| Role | Submit Expenses | Approve | Manage Users | Override |
|---|:---:|:---:|:---:|:---:|
| `EMPLOYEE` | ✅ | ❌ | ❌ | ❌ |
| `MANAGER` | ✅ | ✅ (assigned) | ❌ | ❌ |
| `ADMIN` | ✅ | ✅ | ✅ | ✅ |

Roles are stored as strings on the `User` document. Middleware checks roles for route-level access; API routes perform their own role checks for write operations.

### Manager Relationship

The `User` model has an optional `managerId` field (ObjectId ref to another User). This is used by:

- `ApprovalFlow.isManagerApprover` — if `true`, the employee's direct manager is inserted as step 0 in the approval chain
- `GET /api/manager/team-expenses` — queries `User.find({ managerId: session.userId })` to find direct reports

If an employee has no `managerId` set and the flow requires manager approval, expense submission will fail.

---

## 3. Architecture Overview

### Request Flow

```
Browser
  └── Next.js Middleware       JWT validation + role-based redirect
        └── App Router Page    Client component, fetches from API
              └── API Route    Validates session, queries MongoDB
                    └── Mongoose Model → MongoDB
```

### Expense Lifecycle

```
[Employee submits expense]
    │
    ▼
Expense.create({ status: SUBMITTED })
    │
    ▼
initializeApproval(expense)
    ├── Finds ApprovalFlow for company
    ├── Validates manager exists (if flow.isManagerApprover)
    ├── Sets status = PENDING, currentStepIndex = 0
    └── expense.save()
    │
    ▼
[Manager opens /manager/approvals]
    │
    ▼
GET /api/manager/approvals
    ├── Fetches ALL pending/submitted expenses for company
    ├── For each: calls canUserActOnExpense(user, expense, flow)
    │     ├── Strategy 1: Flow-based matching (check currentStepIndex against chain)
    │     └── Strategy 2: Rule-based matching (check ApprovalRule.approvers[])
    └── Returns filtered list
    │
    ▼
[Manager approves or rejects]
    │
    ▼
POST /api/manager/approvals/action
    │
    ▼
applyApprovalAction(expense, user, action, comment)
    ├── Logs ApprovalAction record (audit trail)
    ├── REJECT → status = REJECTED, done
    └── APPROVE
          ├── Check ApprovalRules for auto-approval conditions
          │     ├── SPECIFIC_APPROVER: this user triggers auto-approve
          │     ├── PERCENTAGE:        approvedSteps/totalSteps >= threshold
          │     └── HYBRID:            AND/OR of the above
          ├── Auto-approved → status = APPROVED, done
          └── Not auto-approved
                ├── currentStepIndex++
                ├── Past last step → status = APPROVED
                └── More steps remain → stays PENDING
```

### Currency Conversion

When `currencyOriginal !== company.defaultCurrency` on submission:

```
1. Fetch live rate: GET https://api.exchangerate-api.com/v4/latest/{currency}
2. Calculate: amountCompany = amountOriginal * fxRate
3. Store: amountOriginal, amountCompany, fxRate, conversionDate
```

> **Note:** If the FX API call fails, expense creation is rejected entirely. There is no manual fallback or cached rate.

---

## 4. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 15 | App Router, API routes as serverless functions, Edge middleware |
| [React](https://react.dev/) | 19 | Client components for interactive pages |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety across models, API payloads, and client state |
| [MongoDB + Mongoose](https://mongoosejs.com/) | Mongoose 9 | Document database with schema enforcement |
| [jose](https://github.com/panva/jose) | — | JWT signing/verification (Edge Runtime compatible) |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | — | Password hashing (10 salt rounds) |
| [Zod](https://zod.dev/) | 4 | Runtime schema validation on all API inputs; shared with client forms |
| [React Hook Form](https://react-hook-form.com/) | — | Form state with Zod resolver integration |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling; custom tokens in `globals.css` |
| [Radix UI](https://www.radix-ui.com/) | — | Accessible primitives (Dialog, Select, Dropdown) via shadcn/ui |
| [Lucide](https://lucide.dev/) | — | Icon library |
| [date-fns](https://date-fns.org/) | — | Lightweight date formatting |
| [Recharts](https://recharts.org/) | — | Dashboard charts |
| [Framer Motion](https://www.framer.com/motion/) | — | Page transitions and micro-animations |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | — | Client-side OCR for receipt scanning |
| [Cloudinary](https://cloudinary.com/) | — | Receipt image storage |
| [Sonner](https://sonner.emilkowal.ski/) | — | Toast notifications |

---

## 5. Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/              POST   JWT login
│   │   │   ├── signup/             POST   Company creation or employee registration
│   │   │   └── logout/             GET    Clear cookie + redirect
│   │   ├── admin/
│   │   │   ├── users/              GET/POST   User CRUD (admin only)
│   │   │   ├── users/[id]/         PATCH/DELETE
│   │   │   ├── expenses/           GET    All company expenses
│   │   │   └── company/            GET/PATCH  Company settings
│   │   ├── expenses/               GET/POST   Employee's own expenses
│   │   ├── expenses/[id]/          GET    Single expense detail
│   │   ├── approval-rules/         GET/POST   ApprovalRule CRUD
│   │   ├── approval-rules/[id]/    PATCH/DELETE
│   │   └── manager/
│   │       ├── approvals/          GET    Pending expenses for this approver
│   │       ├── approvals/action/   POST   Approve or reject
│   │       └── team-expenses/      GET    Direct reports' expenses
│   ├── admin/                      Admin dashboard pages
│   ├── manager/                    Manager pages (approvals, team)
│   ├── dashboard/                  Shared pages (my expenses, new expense)
│   ├── employee/                   Employee dashboard
│   ├── login/
│   └── signup/
│
├── lib/
│   ├── approvalEngine.ts           ⚠️  Core approval logic — read before modifying
│   ├── auth.ts                     Auth facade (getSession, signToken, loginUser)
│   ├── auth/                       Individual auth helpers (hash, verify, session)
│   ├── db.ts                       MongoDB connection singleton with caching
│   ├── types.ts                    Shared enums (UserRole, ExpenseStatus, etc.)
│   └── validation.ts               All Zod schemas
│
└── models/
    ├── User.ts                     name, email, passwordHash, role, managerId, companyId
    ├── Company.ts                  name, country, defaultCurrency
    ├── Expense.ts                  amounts (original + company), FX data, status, currentStepIndex
    ├── ApprovalFlow.ts             Step-based workflow definition (steps[], isManagerApprover)
    ├── ApprovalRule.ts             Direct approver assignment (approvers[], appliesToUser)
    └── ApprovalAction.ts           Append-only audit log
```

### Key Files to Understand First

Before making changes, read these in order:

1. **`lib/approvalEngine.ts`** — The core of the system. If this breaks, approvals stop working entirely.
2. **`middleware.ts`** — Route protection and role-based redirects. If a user can access a page they shouldn't, check here first.
3. **`lib/types.ts`** — All shared enums. Any new status or role must be added here.
4. **`lib/validation.ts`** — All Zod schemas. If a POST returns 400, check the relevant schema here.

---

## 6. Setup Instructions

### Prerequisites

- Node.js 18+
- A MongoDB instance ([MongoDB Atlas](https://www.mongodb.com/atlas) or local)
- A Cloudinary account (optional — required only for receipt uploads)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/pixelmeet/ClearClaim.git
cd ClearClaim

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — see Section 7 for all variables

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

### First-Time Setup

Navigate to `/signup` and enter a company name that does not yet exist. This makes you the **Admin**. From the admin dashboard you can:

- Create `MANAGER` and `EMPLOYEE` users
- Set `managerId` on employees via the user edit form
- Create an `ApprovalFlow` for the company (required before employees can submit expenses)

### Production

```bash
npm run build   # Type-checks and compiles
npm start       # Runs production server
```

> **No migration step required.** Mongoose creates collections and indexes automatically on first write.

---

## 7. Environment Variables

Create `.env.local` in the project root:

```env
# ── Required ──────────────────────────────────────────────────────────────────
JWT_SECRET=<random-string-min-32-chars>
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=clearclaim

# ── Cloudinary (receipt uploads) ──────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# ── Email (future OTP support) ────────────────────────────────────────────────
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=password
EMAIL_FROM=no-reply@example.com
```

| Variable | Required | Notes |
|---|:---:|---|
| `JWT_SECRET` | ✅ | Changing this invalidates all existing sessions |
| `MONGODB_URI` | ✅ | Mongoose connects on first API request, not at startup |
| `MONGODB_DB_NAME` | ✅ | Database name within your cluster |
| `CLOUDINARY_*` | ❌ | Required only for receipt upload functionality |
| `EMAIL_*` | ❌ | Reserved for future OTP/notification features |

---

## 8. Authentication Flow

### Login

```
POST /api/auth/login  { email, password }
  │
  ├── Find User by email
  ├── bcryptjs.compare(password, user.passwordHash)
  ├── Sign JWT payload: { userId, name, email, role, companyId }
  ├── Set HTTP-only cookie: "auth_token" (24h expiry)
  └── Return { redirectTo }
        ADMIN    → /admin
        MANAGER  → /manager
        EMPLOYEE → /employee/dashboard
```

### Signup (Branching Logic)

```
POST /api/auth/signup  { fullName, email, password, companyName, country }
  │
  ├── Company.findOne({ nameLower })
  │
  ├── NOT FOUND → Create Company (currency fetched from restcountries API)
  │               Create User with role = ADMIN
  │               Redirect → /admin
  │
  └── FOUND     → Create User with role = EMPLOYEE under existing company
                  Redirect → /employee/dashboard
```

> The first person to sign up for a company name becomes the Admin. All subsequent signups for the same name become Employees. Invite code enforcement is not currently active.

### Middleware Behavior

The middleware runs on all routes matching `/admin/*`, `/manager/*`, `/employee/*`, `/dashboard/*`, and `/`.

```
1. Public paths (/login, /signup, /api/auth/*) → pass through
2. Read "auth_token" cookie → missing → redirect to /login
3. Verify JWT with jose      → invalid → delete cookie, redirect to /login
4. Role-based protection:
     /admin/*    → ADMIN only         (others redirected to their dashboard)
     /manager/*  → MANAGER or ADMIN
     /employee/* → EMPLOYEE or ADMIN
```

> **Note:** Middleware does not inject user info into request headers. Each API route calls `getSession()` independently to read and verify the cookie.

---

## 9. Approval Workflow Logic

This is the most complex part of the system. Read `lib/approvalEngine.ts` in full before making any changes.

### Strategy 1: ApprovalFlow (Step-Based)

Defines an ordered approval chain. The expense tracks its position via `currentStepIndex`.

```typescript
ApprovalFlow {
  companyId:          ObjectId
  name:               string
  isManagerApprover:  boolean   // If true, manager is injected as step 0
  steps: [
    { type: "USER", userId: ObjectId }   // Specific user must approve
    { type: "ROLE", role: "MANAGER" }    // Any user with this role can approve
  ]
}
```

When someone approves, `currentStepIndex` increments. When it exceeds the chain length, the expense is fully approved.

### Strategy 2: ApprovalRule (Direct Assignment)

Maps specific employees to specific approvers — no sequential chain required.

```typescript
ApprovalRule {
  organization:      string     // companyId.toString()
  appliesToUser:     ObjectId   // Which employee's expenses this covers
  isManagerApprover: boolean
  manager:           ObjectId
  approvers: [
    { user: ObjectId, required: boolean, sequenceNo: number, autoApprove: boolean }
  ]
}
```

### Resolution Order

```typescript
canUserActOnExpense(user, expense, flow):
  1. Flow exists and has steps?
       → Build approver chain from flow
       → Check if user matches current step → true if yes
  2. Fallback: Query ApprovalRule
       where organization = expense.companyId.toString()
       AND (appliesToUser = expense.employeeId OR appliesToUser is null)
       → Check if user is in rule.approvers[]
       → Check if rule.isManagerApprover AND rule.manager === user
  3. → false
```

### Auto-Approval Rules

When an expense is approved, the engine checks all active `ApprovalRule` documents for auto-approval triggers:

| Rule Type | Trigger |
|---|---|
| `SPECIFIC_APPROVER` | The approving user matches `rule.specificApproverUserId` |
| `PERCENTAGE` | `(approvedSteps / totalSteps * 100) >= rule.percentageThreshold` |
| `HYBRID` | Combines both with AND/OR logic |

### Rejection

Rejection is immediate and terminal. Any approver at any step can reject an expense, setting its status to `REJECTED`. There is no rollback or "return to previous approver" flow.

### Audit Trail

Every approve/reject action creates an `ApprovalAction` document. This log is **append-only** — records are never deleted or modified.

```typescript
ApprovalAction {
  expenseId:  ObjectId
  companyId:  ObjectId
  stepIndex:  number
  approverId: ObjectId
  action:     "APPROVE" | "REJECT"
  comment:    string
  createdAt:  Date
}
```

---

## 10. API Design Philosophy

### Authentication

All API routes call `getSession()` at the top:

```typescript
const session = await getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Input Validation

All POST/PATCH bodies are validated with Zod before any database operation:

```typescript
const result = CreateExpenseSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
}
```

### Tenant Isolation

Every query must include `companyId`. This is not enforced automatically.

```typescript
// ✅ Correct
const expenses = await Expense.find({ companyId: session.companyId, status: 'PENDING' });

// ❌ Wrong — creates a cross-tenant data leak
const expenses = await Expense.find({ status: 'PENDING' });
```

### Response Format

```jsonc
// Success
{ "expenses": [...] }
{ "user": { ... } }
{ "success": true }

// Error
{ "error": "Human readable message" }
{ "error": { "fieldErrors": { ... } } }   // Zod validation errors
```

---

## 11. Common Pitfalls

### 1. Missing `companyId` in queries

Every query that returns business data must filter by `companyId`. Mongoose does not enforce this automatically. A query without this filter creates a cross-tenant data leak.

### 2. `ApprovalRule` uses `organization` (string), not `companyId` (ObjectId)

```typescript
// ✅ Correct
ApprovalRule.findOne({ organization: expense.companyId.toString() })

// ❌ Wrong — ObjectId won't match a string field
ApprovalRule.findOne({ organization: expense.companyId })
```

### 3. Expense submission fails if no `ApprovalFlow` exists

`initializeApproval()` throws `"No approval flow found for company"` if no flow exists. The expense creation API catches this, deletes the partially-created expense, and returns 400. An admin must create an `ApprovalFlow` before employees can submit expenses.

### 4. Manager required but not assigned

If `ApprovalFlow.isManagerApprover = true` and the submitting employee has no `managerId`, submission fails. This is validated in `initializeApproval()`.

### 5. Session is not passed via headers

The middleware verifies the JWT but does not pass user info to API routes. Each route re-reads and re-verifies the cookie independently via `getSession()`.

### 6. Mongoose model registration errors

If you see `OverwriteModelError`, the model was compiled twice. All models must follow this pattern:

```typescript
const Model = mongoose.models.Name || mongoose.model('Name', schema);
```

### 7. FX API is a runtime hard dependency

Expense creation calls `https://api.exchangerate-api.com/v4/latest/{currency}` synchronously. If this API is down, expense creation fails. There is no caching, fallback rate, or retry logic.

---

## 12. Known Limitations

| Area | Current State |
|---|---|
| **ApprovalFlow selection** | Only the first flow per company is used — no routing by category or amount |
| **Invite codes** | `SignupSchema` has an `inviteCode` field but it is never validated |
| **Notifications** | No email or push notifications at any stage of the workflow |
| **Receipt uploads** | Cloudinary integration exists but is not wired to expense creation |
| **Expense editing** | Once submitted, expenses cannot be edited. No "return to draft" state |
| **Approval delegation** | Approvers cannot delegate to another user |
| **Bulk operations** | No bulk approve/reject |
| **Search and filtering** | Expense lists have no search, date range, or amount filters |
| **Pagination** | All list endpoints return all matching documents — no cursor or offset |
| **Rate limiting** | No rate limiting on any endpoint |
| **Testing** | No unit or integration tests |
| **Tenant isolation** | No automated tests verifying cross-tenant queries are impossible |
| **Schema consistency** | `ApprovalRule.organization` is a string; all other relations use ObjectId |

---

## 13. Roadmap

Listed in order of practical impact:

**High priority**

1. **Pagination on list endpoints** — Current approach loads all documents into memory. This will fail with production data volumes. Add cursor or offset pagination.

2. **Email notifications** — Nodemailer is already a dependency. Wire it to notify approvers when an expense enters PENDING, and notify employees when approved or rejected.

3. **Mongoose middleware for tenant scoping** — Add a query middleware that automatically injects `companyId` into all find/update/delete operations, eliminating manual filtering risk.

**Medium priority**

4. **Category-based flow routing** — Allow different `ApprovalFlow` documents for different expense categories (e.g., TRAVEL vs SOFTWARE).

5. **Amount-based auto-routing** — Auto-approve expenses below a configurable threshold, or skip certain steps.

6. **Audit log UI** — Surface `ApprovalAction` records on the expense detail page so admins can see the full approval history.

7. **Database indexes** — Add compound indexes on frequently queried fields: `{ companyId, status }` on Expense, `{ companyId, managerId }` on User.

**Lower priority**

8. **Receipt upload integration** — Connect the OCR component to expense creation. Auto-fill amount, date, and description from scanned receipts.

9. **Invite code enforcement** — Validate invite codes during signup to prevent unauthorized users from joining a company.

10. **Test coverage** — Unit tests for `approvalEngine.ts` (the most critical module) and integration tests for the signup branching logic at minimum.

---

## License

Proprietary. All rights reserved.