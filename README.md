# ClearClaim

Multi-tenant expense management and approval workflow system. Built with Next.js 15 App Router, MongoDB, and TypeScript.

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
12. [Limitations and Missing Features](#12-limitations-and-missing-features)
13. [Future Improvements](#13-future-improvements)

---

## 1. Project Overview

ClearClaim lets organizations manage employee expense claims end-to-end. An employee submits an expense. The system routes it through an approval chain. A manager or designated approver reviews and approves or rejects it. Admins have full visibility and override capabilities.

The entire system is multi-tenant. Every database entity is scoped to a `companyId`. There is no cross-company data access at any layer — not in queries, not in API responses, not in middleware.

This is not a SaaS wrapper around a form builder. The approval engine has real routing logic with two distinct strategies, conditional auto-approval rules, and an audit trail via `ApprovalAction` records.

---

## 2. Core Concepts

### Multi-Tenancy

Every Mongoose model that holds business data includes a `companyId` field referencing the `Company` collection. All queries filter by `companyId` derived from the authenticated user's JWT session. This is enforced at the API route level — there is no global tenant middleware that injects this automatically, so **every new query you write must include `companyId` filtering manually**.

```
Company
  └── User (companyId)
  └── Expense (companyId)
  └── ApprovalFlow (companyId)
  └── ApprovalRule (organization = companyId.toString())
  └── ApprovalAction (companyId)
```

> Note: `ApprovalRule` uses `organization` (a string) instead of `companyId` (ObjectId). This inconsistency exists in the current schema. When querying, use `.toString()` on the ObjectId.

### Roles

Three roles exist in `UserRole`:

| Role | Can Submit Expenses | Can Approve | Can Manage Users | Can Override |
|---|---|---|---|---|
| `EMPLOYEE` | Yes | No | No | No |
| `MANAGER` | Yes | Yes (assigned expenses) | No | No |
| `ADMIN` | Yes | Yes | Yes | Yes |

Roles are stored as strings on the `User` document. The middleware checks roles for route-level access. API routes do their own role checks for write operations.

### Manager Relationship

The `User` model has an optional `managerId` field (ObjectId ref to another User). This is used by:
- `ApprovalFlow.isManagerApprover` — if true, the employee's manager is inserted as step 0 in the approval chain
- `/api/manager/team-expenses` — queries `User.find({ managerId: session.userId })` to find direct reports

If an employee has no `managerId` set and the flow requires manager approval, expense submission will fail with an error.

---

## 3. Architecture Overview

### Request Flow

```
Browser → Next.js Middleware (JWT validation + role redirect)
       → App Router Page (client component, fetches from API)
       → API Route (validates session, queries MongoDB)
       → Mongoose Model → MongoDB
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
    │     ├── Try 1: Flow-based matching (check currentStepIndex against chain)
    │     └── Try 2: Rule-based matching (check ApprovalRule.approvers[])
    └── Returns filtered list
    │
    ▼
[Manager clicks Approve/Reject]
    │
    ▼
POST /api/manager/approvals/action
    │
    ▼
applyApprovalAction(expense, user, action, comment)
    ├── Logs ApprovalAction record (audit trail)
    ├── If REJECT → status = REJECTED, done
    ├── If APPROVE:
    │     ├── Check ApprovalRules for auto-approval conditions
    │     │     ├── SPECIFIC_APPROVER: if this user triggers auto-approve
    │     │     ├── PERCENTAGE: if approvedSteps/totalSteps >= threshold
    │     │     └── HYBRID: AND/OR logic combining both
    │     ├── If auto-approved → status = APPROVED, done
    │     └── If not:
    │           ├── currentStepIndex++ 
    │           ├── If past last step → status = APPROVED
    │           └── Else → stays PENDING (next approver's turn)
    └── expense.save()
```

### Data Flow for Currency Conversion

When an expense is submitted and `currencyOriginal !== company.defaultCurrency`:

```
1. Fetch live rate from https://api.exchangerate-api.com/v4/latest/{currency}
2. Calculate: amountCompany = amountOriginal * fxRate
3. Store both amounts, the rate, and the conversion date
```

If the FX API call fails, expense creation is rejected entirely. There is no manual fallback entry.

---

## 4. Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 15** | App Router for file-based routing, API routes as serverless functions, middleware for auth |
| **React 19** | Client components for interactive pages (forms, dashboards) |
| **TypeScript** | Type safety across models, API payloads, and client state |
| **MongoDB + Mongoose 9** | Document database. Mongoose provides schema enforcement that MongoDB itself does not |
| **jose** | JWT signing and verification. Used instead of jsonwebtoken because it works in Edge Runtime (middleware) |
| **bcryptjs** | Password hashing with 10 salt rounds |
| **Zod 4** | Runtime schema validation on all API inputs. Shared between client (react-hook-form) and server |
| **React Hook Form** | Form state management with Zod resolver integration |
| **Tailwind CSS 4** | Utility-first styling. Custom design tokens defined in `globals.css` |
| **Radix UI** | Accessible primitives (Dialog, Select, Dropdown, etc.) via shadcn/ui |
| **Lucide** | Icon library |
| **date-fns** | Date formatting without the weight of moment.js |
| **Recharts** | Dashboard charts |
| **Framer Motion** | Page transitions and micro-animations |
| **Tesseract.js** | Client-side OCR for receipt scanning |
| **Cloudinary** | File upload storage for receipt images |
| **Sonner** | Toast notifications |

---

## 5. Project Structure

```
app/
├── api/
│   ├── auth/login/          POST - JWT login
│   ├── auth/signup/         POST - Company creation or employee registration
│   ├── auth/logout/         GET  - Clear cookie, redirect
│   ├── admin/users/         GET/POST - User CRUD (admin only)
│   ├── admin/users/[id]/    PATCH/DELETE - User update/delete
│   ├── admin/expenses/      GET - All company expenses
│   ├── admin/company/       GET/PATCH - Company settings
│   ├── expenses/            GET/POST - Employee's own expenses
│   ├── expenses/[id]/       GET - Single expense detail
│   ├── approval-rules/      GET/POST - ApprovalRule CRUD
│   ├── approval-rules/[id]/ PATCH/DELETE
│   ├── manager/approvals/   GET - Pending expenses for this approver
│   ├── manager/approvals/action/  POST - Approve or reject
│   └── manager/team-expenses/    GET - Direct reports' expenses
├── admin/            Admin dashboard pages
├── manager/          Manager pages (approvals, team expenses)
├── dashboard/        Shared pages (my expenses, new expense)
├── employee/         Employee dashboard
├── login/            Login page
└── signup/           Signup page

lib/
├── approvalEngine.ts    Core approval logic (canUserActOnExpense, applyApprovalAction)
├── auth.ts              Auth facade (getSession, signToken, loginUser, logoutUser)
├── auth/                Individual auth helpers (hash, verify, session cookie)
├── db.ts                MongoDB connection singleton with caching
├── types.ts             Shared enums (UserRole, ExpenseStatus, ActionType, etc.)
└── validation.ts        All Zod schemas

models/
├── User.ts              name, email, passwordHash, role, managerId, companyId
├── Company.ts           name, country, defaultCurrency
├── Expense.ts           amounts (original + company), FX data, status, currentStepIndex
├── ApprovalFlow.ts      Step-based workflow definition (steps[], isManagerApprover)
├── ApprovalRule.ts      Direct approver assignment (approvers[], appliesToUser)
└── ApprovalAction.ts    Audit log of every approve/reject action
```

### Key Files to Understand First

1. **`lib/approvalEngine.ts`** — The core of the system. If you break this file, approvals stop working. Read it entirely before making changes.
2. **`middleware.ts`** — Route protection and role-based redirects. If a user can access a page they shouldn't, check here first.
3. **`lib/types.ts`** — All shared enums. If you add a new status or role, it must go here.
4. **`lib/validation.ts`** — All Zod schemas. Every API input is validated through these. If a POST request returns 400, check the schema.

---

## 6. Setup Instructions

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Cloudinary account (for receipt uploads; optional for basic testing)

### Steps

```bash
# 1. Clone
git clone https://github.com/pixelmeet/ClearClaim.git
cd ClearClaim

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your values (see section 7)

# 4. Run development server
npm run dev
# App runs at http://localhost:3000

# 5. First-time setup
# Navigate to /signup
# Enter a company name that does NOT exist yet → you become ADMIN
# From admin dashboard, create MANAGER and EMPLOYEE users
# Set managerId on employees via the user edit form
```

### Production Build

```bash
npm run build  # Compiles and type-checks
npm start      # Runs production server
```

---

## 7. Environment Variables

Create `.env.local` in the project root:

```env
# Required
JWT_SECRET=<random-string-min-32-chars>
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=clearclaim

# Optional - Cloudinary (needed for receipt upload feature)
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Optional - Email (for future OTP features)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=password
EMAIL_FROM=no-reply@example.com
```

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Signs JWT tokens. If this changes, all existing sessions are invalidated |
| `MONGODB_URI` | Yes | MongoDB connection string. Mongoose connects on first API request, not at startup |
| `MONGODB_DB_NAME` | Yes | Database name within the MongoDB cluster |
| `CLOUDINARY_*` | No | Required only if using receipt upload functionality |

**There is no database migration step.** Mongoose creates collections automatically on first write. Indexes (like the unique compound index on `{ companyId, email }` for Users) are created by Mongoose when the model is first loaded.

---

## 8. Authentication Flow

### Login

```
1. POST /api/auth/login { email, password }
2. Server finds User by email
3. bcryptjs.compare(password, user.passwordHash)
4. If valid: sign JWT with { userId, name, email, role, companyId }
5. Set JWT as HTTP-only cookie named "auth_token" (24h expiry)
6. Return { redirectTo } based on role:
     ADMIN → /admin
     MANAGER → /manager
     EMPLOYEE → /employee/dashboard
```

### Signup (Branching Logic)

```
POST /api/auth/signup { fullName, email, password, companyName, country }

IF Company.findOne({ nameLower }) returns null:
  → Create new Company (fetches currency from restcountries API based on country)
  → Create User with role = ADMIN
  → Redirect to /admin

IF Company already exists:
  → Create User with role = EMPLOYEE under that company
  → Redirect to /employee/dashboard
```

This means:
- The first person to sign up for a company name becomes the admin
- All subsequent signups for the same company name become employees
- There is no invite code enforcement currently (the field exists in the schema but is not validated)

### Middleware Behavior

The middleware runs on all routes matching `/admin/*`, `/manager/*`, `/employee/*`, `/dashboard/*`, and `/`.

```
1. Check if path is public (/login, /signup, /api/auth/*) → pass through
2. Read "auth_token" cookie
3. If no cookie → redirect to /login
4. Verify JWT with jose
5. If invalid → delete cookie, redirect to /login
6. Role-based route protection:
     /admin/* → must be ADMIN (others redirected to their dashboard)
     /manager/* → must be MANAGER or ADMIN
     /employee/* → must be EMPLOYEE or ADMIN
```

Note: The middleware does NOT add user info to request headers. Each API route calls `getSession()` independently to read the cookie and verify the token.

---

## 9. Approval Workflow Logic

This is the most complex part of the system. Read `lib/approvalEngine.ts` carefully.

### Two Routing Strategies

The system has two independent mechanisms for determining who can approve an expense:

#### Strategy 1: ApprovalFlow (Step-Based)

```
ApprovalFlow {
  companyId: ObjectId
  name: string
  isManagerApprover: boolean    // If true, manager is step 0
  steps: [
    { type: "USER", userId: ObjectId }    // Specific user must approve
    { type: "ROLE", role: "MANAGER" }     // Any user with this role can approve
  ]
}
```

The flow defines an ordered chain of approvers. The expense has a `currentStepIndex` that tracks which step it's on. When someone approves, `currentStepIndex` increments. When it exceeds the chain length, the expense is fully approved.

If `isManagerApprover` is true, the submitting employee's direct manager is injected as step 0and the flow's defined steps follow after.

#### Strategy 2: ApprovalRule (Direct Assignment)

```
ApprovalRule {
  organization: string (companyId as string)
  appliesToUser: ObjectId       // Which employee's expenses this rule covers
  isManagerApprover: boolean
  manager: ObjectId             // Specific manager user
  approvers: [
    { user: ObjectId, required: boolean, sequenceNo: number, autoApprove: boolean }
  ]
}
```

Rules directly map "this employee's expenses should be approved by these people." No step chain — any listed approver can act.

#### Resolution Order

```javascript
canUserActOnExpense(user, expense, flow):
  1. If flow exists and has steps:
       Build approver chain from flow
       Check if user matches the current step
       If yes → return true
  2. Fallback: Query ApprovalRule where organization = expense.companyId
       AND (appliesToUser = expense.employeeId OR appliesToUser is null)
       If user is in rule.approvers[] → return true
       If rule.isManagerApprover AND rule.manager = user → return true
  3. Return false
```

### Auto-Approval Rules

When an expense is approved (not rejected), the engine checks all active `ApprovalRule` documents linked to the flow. These can trigger automatic full-approval:

- **SPECIFIC_APPROVER**: If the approving user matches `rule.specificApproverUserId`, the expense skips remaining steps
- **PERCENTAGE**: If `(approvedSteps / totalSteps * 100) >= rule.percentageThreshold`, auto-approve
- **HYBRID**: Combines both with AND/OR logic

### Rejection

Rejection is immediate. If any approver rejects at any step, the expense status becomes `REJECTED`. There is no "back to previous approver" flow.

### Audit Trail

Every approve/reject action creates an `ApprovalAction` document:

```
{
  expenseId, companyId, stepIndex,
  approverId, action (APPROVE/REJECT),
  comment, createdAt
}
```

This is an append-only log. Actions are never deleted or modified.

---

## 10. API Design Philosophy

### Authentication

All API routes call `getSession()` at the top. This reads the `auth_token` cookie, verifies the JWT, and returns `{ userId, name, email, role, companyId }` or null.

```typescript
const session = await getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Validation

All POST/PATCH bodies are validated with Zod before any database operation:

```typescript
const result = CreateExpenseSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
}
```

### Tenant Isolation

Every query includes `companyId`:

```typescript
// Correct
const expenses = await Expense.find({ companyId: session.companyId, status: 'PENDING' });

// WRONG — never do this
const expenses = await Expense.find({ status: 'PENDING' });
```

### Response Format

API responses follow this pattern:

```json
// Success
{ "expenses": [...] }
{ "user": {...} }
{ "success": true }

// Error
{ "error": "Human readable message" }
{ "error": { "fieldErrors": {...} } }  // Zod validation errors
```

---

## 11. Common Pitfalls

### 1. Forgetting companyId in queries

Every query that returns business data must filter by `companyId`. This is not enforced by Mongoose middleware — it's manual in every API route. If you write a new query without this filter, you create a cross-tenant data leak.

### 2. ApprovalRule uses `organization` (string), not `companyId` (ObjectId)

When querying ApprovalRule, you must cast:
```typescript
ApprovalRule.findOne({ organization: expense.companyId.toString() })
```
Not:
```typescript
ApprovalRule.findOne({ organization: expense.companyId }) // ObjectId won't match string
```

### 3. Expense submission fails if no ApprovalFlow exists

`initializeApproval()` calls `getApprovalFlow()`. If no flow exists for the company, it throws:
```
"No approval flow found for company"
```
The expense creation API catches this, deletes the partially-created expense, and returns 400. The admin must create an ApprovalFlow first, OR the system must fall through to ApprovalRule-only mode for submission to work.

### 4. Manager required but not assigned

If `ApprovalFlow.isManagerApprover = true` but the submitting employee has no `managerId`, expense submission will fail. This is validated in `initializeApproval()`.

### 5. Session is read independently per request

The middleware verifies the JWT but does NOT pass user info to API routes. Each API route re-reads and re-verifies the cookie. This means an extra `jose.verify()` call per API request, but it avoids the complexity of header injection.

### 6. Mongoose model registration errors

If you see `OverwriteModelError`, it's because the model was compiled twice. All models use the pattern:
```typescript
const Model = mongoose.models.Name || mongoose.model('Name', schema);
```
If you create a new model, follow this exact pattern.

### 7. The FX API is a runtime external dependency

Expense creation calls `https://api.exchangerate-api.com/v4/latest/{currency}` synchronously. If this API is down, expense creation fails. There is no caching or fallback rate.

---

## 12. Limitations and Missing Features

| Area | Limitation |
|---|---|
| **ApprovalFlow selection** | Only the first flow per company is used. There is no routing by expense category or amount |
| **Invite codes** | The SignupSchema has an `inviteCode` field but it is never validated |
| **Notifications** | No email or push notifications when an expense needs approval |
| **Receipt uploads** | Cloudinary integration exists but is not wired to expense creation |
| **Expense editing** | Once submitted, expenses cannot be edited. No "return to draft" flow |
| **Delegation** | Approvers cannot delegate to another user |
| **Bulk operations** | No bulk approve/reject |
| **Search and filtering** | Expense lists have no search, date range, or amount filters |
| **Pagination** | All list endpoints return all matching documents. No cursor or offset pagination |
| **Rate limiting** | No rate limiting on any endpoint |
| **Testing** | No unit or integration tests |
| **Tenant isolation verification** | No automated tests that verify cross-tenant queries are impossible |
| **ApprovalRule.organization** | Uses string type instead of ObjectId, inconsistent with the rest of the schema |

---

## 13. Future Improvements

Listed in order of practical impact:

1. **Pagination on all list endpoints** — Current approach loads all documents into memory. This will break with production data volumes.

2. **Email notifications** — Nodemailer is already a dependency. Wire it to send emails when an expense enters PENDING and when it's approved/rejected.

3. **Expense category-based flow routing** — Allow different ApprovalFlows for different expense categories (e.g., TRAVEL expenses go through a different chain than SOFTWARE purchases).

4. **Amount-based auto-routing** — Low-value expenses (under a threshold) could be auto-approved or skip certain steps.

5. **Receipt upload integration** — Connect the OCR component to expense creation. Auto-fill amount, date, and description from scanned receipts.

6. **Audit log UI** — Surface ApprovalAction records in the expense detail page so admins can see who approved/rejected at each step.

7. **Invite code enforcement** — Validate invite codes during signup to prevent unauthorized users from joining a company.

8. **Test coverage** — At minimum, unit tests for `approvalEngine.ts` (the most critical module) and integration tests for the signup branching logic.

9. **Mongoose middleware for tenant scoping** — Add a query middleware that automatically injects `companyId` into all find/update/delete operations, removing the risk of developers forgetting it.

10. **Database indexes** — Add compound indexes on frequently queried fields: `{ companyId, status }` on Expense, `{ companyId, managerId }` on User.

---

## License

Proprietary. All rights reserved.
