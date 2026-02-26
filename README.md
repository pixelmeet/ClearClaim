# ClearClaim - Expense Management & Approval Engine

A full-stack expense management system with a sophisticated approval rules engine, multi-tenant support, and currency conversion.

## Features

- **Multi-tenant Architecture**: All data scoped by `companyId` with server-side enforcement
- **Approval Engine**: Supports multi-step sequential approvers, conditional rules (percentage/specific approver/hybrid), and manager-first approval
- **Currency Handling**: Automatic currency conversion using exchangerate-api at submission time
- **Role-Based Access Control**: ADMIN, MANAGER, and EMPLOYEE roles with appropriate permissions
- **Approval Timeline**: Complete audit trail of all approval actions

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create `.env.local`:
    ```env
    MONGODB_URI=mongodb://localhost:27017/clearclaim
    JWT_SECRET=super-secret-key-change-me
    ```

3.  **Seed Database**
    Populate with demo data:
    ```bash
    npx tsx scripts/seed.ts
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## Demo Walkthrough

### Credentials (All passwords: `password123`)

-   **Admin**: `admin@demo.com`
-   **CFO**: `cfo@demo.com`
-   **Director**: `director@demo.com`
-   **Finance**: `finance@demo.com`
-   **Manager**: `manager@demo.com`
-   **Employee**: `employee@demo.com`

### Scenarios

1.  **Submit Expense (Employee)**
    -   Login as `employee@demo.com`.
    -   Go to **New Expense**.
    -   Submit an expense (e.g. 500 EUR). Currency conversion happens automatically.
    -   Check **My Expenses** to see status `SUBMITTED`.

2.  **Manager Approval (Manager)**
    -   Login as `manager@demo.com`.
    -   Go to **Pending Approvals**.
    -   Approve the expense.
    -   Logic: Moves to next step (Finance).

3.  **Complex Rule (CFO)**
    -   Login as `cfo@demo.com` (Admin/Manager role).
    -   If an expense reaches you, or if you use **Admin Override**, you can approve.
    -   **Hybrid Rule**: If CFO approves, or if 60% of chain approves, it becomes `APPROVED`.

4.  **Admin Config**
    -   Login as `admin@demo.com`.
    -   Go to **Manage Users** to add more people.
    -   Go to **Approval Flows** to see the "Executive Approval Chain".
    -   Go to **Approval Rules** to see the Hybrid rule.

## Tech Stack
-   **Next.js 15 App Router**
-   **TypeScript**
-   **Tailwind CSS + Shadcn/UI**
-   **MongoDB + Mongoose**
-   **Zod Validation**
-   **Custom Approval Engine**
-   **Tesseract.js (OCR)**

## 📚 Project Documentation

- **[docs/auth.md](./docs/auth.md)** - Authentication and authorization documentation
- **[docs/supabase-sql.md](./docs/supabase-sql.md)** - Database setup guide for Supabase

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB URI and JWT secret
   ```

3. **Seed database:**
   ```bash
   npx tsx scripts/seed.ts
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   - Open http://localhost:3000
   - Login with: `admin@demo.com` / `password123`

## 📋 Current Status

**Completed (~75%):**
- ✅ Core infrastructure & database models
- ✅ Authentication & RBAC
- ✅ User management
- ✅ Expense submission with currency conversion
- ✅ Approval workflow engine
- ✅ Conditional approval rules
- ✅ Manager & Admin dashboards**In Progress:**
- 🔄 OCR receipt processing integration
- 🔄 Email notifications
- 🔄 Advanced features

**Pending:**
- ⏳ Comprehensive testing suite
- ⏳ Analytics dashboard
- ⏳ Export functionality
- ⏳ Documentation completion
