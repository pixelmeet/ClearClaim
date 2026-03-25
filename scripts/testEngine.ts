import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import User, { UserRole } from '../models/User';
import Company from '../models/Company';
import ApprovalFlow, { StepType } from '../models/ApprovalFlow';
import Expense, { ExpenseCategory, ExpenseStatus } from '../models/Expense';
import { initializeApproval, applyApprovalAction } from '../lib/approvalEngine';
import { ActionType } from '../models/ApprovalAction';
import bcrypt from 'bcryptjs';

async function runTests() {
    if (!process.env.MONGODB_URI) {
        console.error('Missing MONGODB_URI');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- TEST: Database connected ---');

    console.log('Cleaning up old test data...');
    const testCompanyName = 'Test-Engine-Company';
    const existingCompany = await Company.findOne({ name: testCompanyName });
    if (existingCompany) {
        await User.deleteMany({ companyId: existingCompany._id });
        await ApprovalFlow.deleteMany({ companyId: existingCompany._id });
        await Expense.deleteMany({ companyId: existingCompany._id });
        await Company.deleteOne({ _id: existingCompany._id });
    }

    const company = await Company.create({
        name: testCompanyName,
        nameLower: testCompanyName.toLowerCase(),
        country: 'USA',
        defaultCurrency: 'USD',
    });

    const pwd = await bcrypt.hash('pass123', 10);

    const cfo = await User.create({ companyId: company._id, name: 'CFO', email: 'cfo@t.com', role: UserRole.ADMIN, passwordHash: pwd });
    const manager = await User.create({ companyId: company._id, name: 'Manager', email: 'mgr@t.com', role: UserRole.MANAGER, passwordHash: pwd });
    const employee = await User.create({ companyId: company._id, name: 'Emp', email: 'emp@t.com', role: UserRole.EMPLOYEE, managerId: manager._id, passwordHash: pwd });

    console.log('--- SCENARIO 1: Required Enforcement & Percentage Auto-Approve ---');
    // Flow: Manager first, then User Step (Required), then Role Step (Admin)
    const flow = await ApprovalFlow.create({
        companyId: company._id,
        name: 'Test Flow',
        isManagerApprover: true,
        minApprovalPercent: 66, // 2 out of 3 needed
        steps: [
            { type: StepType.USER, userId: cfo._id, required: true }, // Required!
            { type: StepType.ROLE, role: UserRole.ADMIN }
        ]
    });

    // Chain: 
    // Step 0: Manager
    // Step 1: CFO (Required)
    // Step 2: Admin role
    // total = 3. 66% means 2 approvals.

    const expense1 = await Expense.create({
        companyId: company._id,
        employeeId: employee._id,
        amountOriginal: 100,
        currencyOriginal: 'USD',
        amountCompany: 100,
        companyCurrency: 'USD',
        category: ExpenseCategory.TRAVEL,
        description: 'Test Expense',
        expenseDate: new Date(),
        fxDate: new Date(),
        fxRate: 1,
        status: ExpenseStatus.SUBMITTED
    });

    await initializeApproval(expense1);
    console.log('Expense initialized to:', expense1.status);

    // Manager Approves
    console.log('-> Manager approves (Step 0)');
    let newStatus = await applyApprovalAction(expense1, manager, ActionType.APPROVE, 'mgr OK');
    console.log('Status after Manager:', newStatus);

    // At this point, 1/3 (33%) approved. Pending CFO which is required.
    // Let's have another Admin (CFO also has ADMIN role) try to approve step 2? Wait, it's pending CFO's explicit Step 1.
    console.log('-> CFO approves (Step 1, Required)');
    newStatus = await applyApprovalAction(expense1, cfo, ActionType.APPROVE, 'CFO OK');
    console.log('Status after CFO:', newStatus, '- Is AutoApproved?', (expense1 as any).isAutoApproved);

    // It should be Auto-Approved! Because 2/3 = 66%. And the REQUIRED step (CFO) is fulfilled!

    console.log('--- SCENARIO 2: Specific Approver Auto-Approve ---');
    
    const flow2 = await ApprovalFlow.create({
        companyId: company._id,
        name: 'Test Flow 2',
        isManagerApprover: false,
        steps: [
            { type: StepType.USER, userId: manager._id },
            { type: StepType.USER, userId: cfo._id, autoApprove: true } // Auto approve!
        ]
    });

    const expense2 = await Expense.create({
        companyId: company._id,
        employeeId: employee._id,
        amountOriginal: 500,
        currencyOriginal: 'EUR',
        amountCompany: 550,
        companyCurrency: 'USD',
        category: ExpenseCategory.MEALS,
        description: 'Test Auto Approve',
        expenseDate: new Date(),
        fxDate: new Date(),
        fxRate: 1.1,
        status: ExpenseStatus.SUBMITTED
    });

    await initializeApproval(expense2);

    console.log('-> CFO overrides and approves (Step 1 with autoApprove)');
    // Wait, by strict engine logic, CFO expects to approve at Step 1, but currentStepIndex is 0 (Manager).
    // Can CFO act on expense at Step 0? `canUserActOnExpense` allows ADMIN (since CFO is ADMIN).
    // Let's see if admin bypass works and triggers auto approve...
    
    // Actually, `applyApprovalAction` does `chain[expense.currentStepIndex].autoApprove`.
    // So if Admin is acting on behalf of Manager (Step 0), it checks `chain[0].autoApprove` (which is false).
    // So it will just move to Step 1. 
    newStatus = await applyApprovalAction(expense2, cfo, ActionType.APPROVE, 'Admin acting for Mgr');
    console.log('Status after Admin acts for Mgr at Step 0:', newStatus);

    // Now it's at Step 1. CFO acts for himself. `chain[1].autoApprove` is true.
    newStatus = await applyApprovalAction(expense2, cfo, ActionType.APPROVE, 'CFO auto approve');
    console.log('Status after CFO acts at Step 1:', newStatus, '- Is AutoApproved?', (expense2 as any).isAutoApproved);

    console.log('--- TESTS COMPLETE! ---');
    process.exit(0);
}

runTests().catch(console.error);
