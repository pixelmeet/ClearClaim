import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import Company from '@/models/Company';
import { getSession } from '@/lib/auth';
import { CreateExpenseSchema } from '@/lib/validation';
import { ExpenseStatus } from '@/lib/types'; // Use Types
// Removing unused UserRole
import { initializeApproval } from '@/lib/approvalEngine';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        // Employees see own expenses. Managers sees own? or Team's? 
        // Spec: "My expenses list" -> Own expenses.
        const expenses = await Expense.find({ employeeId: session.userId })
            .sort({ createdAt: -1 });

        return NextResponse.json({ expenses });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const result = CreateExpenseSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { amountOriginal, currencyOriginal, category, description, expenseDate } = result.data;

        await connectToDatabase();

        const company = await Company.findById(session.companyId);
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        let amountCompany = amountOriginal;
        let fxRate = 1;

        // Currency Conversion
        if (currencyOriginal !== company.defaultCurrency) {
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currencyOriginal}`);
                const data = await res.json();
                fxRate = data.rates[company.defaultCurrency];
                if (!fxRate) throw new Error('Rate not found');
                amountCompany = Number((amountOriginal * fxRate).toFixed(2));
            } catch (e) {
                console.error('FX Error:', e);
                return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 }); // or allow manual entry? Spec says "Convert... at submission time"
            }
        }

        const expense = await Expense.create({
            companyId: session.companyId,
            employeeId: session.userId,
            amountOriginal,
            currencyOriginal,
            amountCompany,
            companyCurrency: company.defaultCurrency,
            fxRate,
            fxDate: new Date(),
            category,
            description,
            expenseDate,
            status: ExpenseStatus.SUBMITTED, // Spec: "It becomes SUBMITTED then PENDING."
            currentStepIndex: 0,
        });

        // Initialize approval process (transitions SUBMITTED -> PENDING)
        try {
            await initializeApproval(expense);
        } catch (error) {
            // If initialization fails (e.g., no manager), delete the expense and return error
            await Expense.findByIdAndDelete(expense._id);
            return NextResponse.json({
                error: error instanceof Error ? error.message : 'Failed to initialize approval process'
            }, { status: 400 });
        }

        return NextResponse.json({ expense });

    } catch (error) {
        console.error('Create expense error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
