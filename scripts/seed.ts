import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import User, { UserRole } from '../models/User';
import Company from '../models/Company';
import ApprovalFlow, { StepType } from '../models/ApprovalFlow';
import Expense, { ExpenseStatus, ExpenseCategory } from '../models/Expense';
import ApprovalAction, { ActionType } from '../models/ApprovalAction';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected to DB');

        // Clean up
        await Promise.all([
            Company.deleteMany({}),
            User.deleteMany({}),
            ApprovalFlow.deleteMany({}),
            Expense.deleteMany({}),
            ApprovalAction.deleteMany({}),
        ]);
        console.log('Cleaned DB');

        // 1. Company
        const company = await Company.create({
            name: 'Demo Corp',
            country: 'United States',
            defaultCurrency: 'USD',
        });

        // 2. Users
        const passwordHash = await bcrypt.hash('password123', 10);

        const admin = await User.create({
            companyId: company._id,
            name: 'Admin User',
            email: 'admin@demo.com',
            passwordHash,
            role: UserRole.ADMIN,
        });

        const cfo = await User.create({
            companyId: company._id,
            name: 'CFO User',
            email: 'cfo@demo.com',
            passwordHash,
            role: UserRole.ADMIN, // Admin role usually for high level
        });

        const director = await User.create({
            companyId: company._id,
            name: 'Director User',
            email: 'director@demo.com',
            passwordHash,
            role: UserRole.MANAGER,
        });

        const finance = await User.create({
            companyId: company._id,
            name: 'Finance User',
            email: 'finance@demo.com',
            passwordHash,
            role: UserRole.MANAGER,
        });

        const manager = await User.create({
            companyId: company._id,
            name: 'Manager User',
            email: 'manager@demo.com',
            passwordHash,
            role: UserRole.MANAGER,
        });

        const employee = await User.create({
            companyId: company._id,
            name: 'Employee User',
            email: 'employee@demo.com',
            passwordHash,
            role: UserRole.EMPLOYEE,
            managerId: manager._id,
        });

        console.log('Users created');

        // 3. Flow
        // Manager First -> Finance -> Director -> CFO
        const flow = await ApprovalFlow.create({
            companyId: company._id,
            name: 'Executive Approval Chain',
            isManagerApprover: true,
            steps: [
                { type: StepType.USER, userId: finance._id },
                { type: StepType.USER, userId: director._id },
                { type: StepType.USER, userId: cfo._id },
            ],
        });
        console.log('Flow created');

        // 5. Demo Expenses

        // Expense 1: Legit expense (normal flow, pending at manager step)
        const expense1 = await Expense.create({
            companyId: company._id,
            employeeId: employee._id,
            amountOriginal: 100,
            currencyOriginal: 'USD',
            amountCompany: 100,
            companyCurrency: 'USD',
            fxRate: 1,
            fxDate: new Date(),
            category: ExpenseCategory.MEALS,
            description: 'Team Lunch (Legit - Normal Flow)',
            expenseDate: new Date(),
            status: ExpenseStatus.PENDING,
            currentStepIndex: 0, // Waiting for manager approval
        });

        // Expense 2: Percentage-approved (60% threshold met - 3 out of 4 approvals)
        // Chain: Manager -> Finance -> Director -> CFO (4 steps)
        // 60% of 4 = 2.4, so 3 approvals needed
        const expense2 = await Expense.create({
            companyId: company._id,
            employeeId: employee._id,
            amountOriginal: 500,
            currencyOriginal: 'EUR',
            amountCompany: 550, // Example conversion
            companyCurrency: 'USD',
            fxRate: 1.1,
            fxDate: new Date(),
            category: ExpenseCategory.TRAVEL,
            description: 'Business Trip (Percentage-Approved - 3/4 approvals)',
            expenseDate: new Date(),
            status: ExpenseStatus.APPROVED, // Auto-approved after 3 approvals
            currentStepIndex: 3, // Reached CFO step but auto-approved
        });

        // Create approval actions for expense2 to show the flow
        await ApprovalAction.create({
            expenseId: expense2._id,
            companyId: company._id,
            stepIndex: 0,
            approverId: manager._id,
            action: ActionType.APPROVE,
            comment: 'Manager approved',
        });
        await ApprovalAction.create({
            expenseId: expense2._id,
            companyId: company._id,
            stepIndex: 1,
            approverId: finance._id,
            action: ActionType.APPROVE,
            comment: 'Finance approved',
        });
        await ApprovalAction.create({
            expenseId: expense2._id,
            companyId: company._id,
            stepIndex: 2,
            approverId: director._id,
            action: ActionType.APPROVE,
            comment: 'Director approved - Auto-approved at 60% threshold',
        });

        // Expense 3: CFO auto-approved (CFO approves, triggers specific approver rule)
        const expense3 = await Expense.create({
            companyId: company._id,
            employeeId: employee._id,
            amountOriginal: 1000,
            currencyOriginal: 'GBP',
            amountCompany: 1300, // Example conversion
            companyCurrency: 'USD',
            fxRate: 1.3,
            fxDate: new Date(),
            category: ExpenseCategory.SOFTWARE,
            description: 'Software License (CFO Auto-Approved)',
            expenseDate: new Date(),
            status: ExpenseStatus.APPROVED, // Auto-approved by CFO rule
            currentStepIndex: 3, // CFO step
        });

        // Create approval actions for expense3
        await ApprovalAction.create({
            expenseId: expense3._id,
            companyId: company._id,
            stepIndex: 0,
            approverId: manager._id,
            action: ActionType.APPROVE,
            comment: 'Manager approved',
        });
        await ApprovalAction.create({
            expenseId: expense3._id,
            companyId: company._id,
            stepIndex: 1,
            approverId: finance._id,
            action: ActionType.APPROVE,
            comment: 'Finance approved',
        });
        await ApprovalAction.create({
            expenseId: expense3._id,
            companyId: company._id,
            stepIndex: 2,
            approverId: director._id,
            action: ActionType.APPROVE,
            comment: 'Director approved',
        });
        await ApprovalAction.create({
            expenseId: expense3._id,
            companyId: company._id,
            stepIndex: 3,
            approverId: cfo._id,
            action: ActionType.APPROVE,
            comment: 'CFO approved - Auto-approved by specific approver rule',
        });

        console.log('Demo expenses created');
        console.log('Seeding Complete');
        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
}

seed();
