import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import ApprovalFlow from '../models/ApprovalFlow';
import ApprovalRule from '../models/ApprovalRule';
import Expense from '../models/Expense';
import User from '../models/User';
import Company from '../models/Company';

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to DB');

        const companies = await Company.find().lean();
        console.log('\nCompanies:', JSON.stringify(companies, null, 2));

        const users = await User.find().lean();
        console.log('\nUsers (all):', JSON.stringify(users, null, 2));

        const flows = await ApprovalFlow.find().lean();
        console.log('\nApprovalFlows:', JSON.stringify(flows, null, 2));

        const rules = await ApprovalRule.find().lean();
        console.log('\nApprovalRules:', JSON.stringify(rules, null, 2));

        const expenses = await Expense.find().lean();
        console.log('\nExpenses (first 2):', JSON.stringify(expenses.slice(0, 2), null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debug();
