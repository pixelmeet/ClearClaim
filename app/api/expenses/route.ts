import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import Company from '@/models/Company';
import FxRate from '@/models/FxRate';
import { getSession } from '@/lib/auth';
import { CreateExpenseSchema } from '@/lib/validation';
import { ExpenseStatus } from '@/lib/types'; // Use Types
// Removing unused UserRole
import { initializeApproval } from '@/lib/approvalEngine';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        // Employees see own expenses. Managers sees own? or Team's? 
        // Spec: "My expenses list" -> Own expenses.
        const filter: Record<string, any> = { employeeId: session.userId, companyId: session.companyId };

        const status = searchParams.get('status');
        if (status) filter.status = status;

        const category = searchParams.get('category');
        if (category) filter.category = category;

        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        if (dateFrom || dateTo) {
            filter.expenseDate = {};
            if (dateFrom) filter.expenseDate.$gte = new Date(dateFrom);
            if (dateTo) filter.expenseDate.$lte = new Date(dateTo);
        }

        const amountMin = searchParams.get('amountMin');
        const amountMax = searchParams.get('amountMax');
        if (amountMin || amountMax) {
            filter.amountOriginal = {};
            if (amountMin) filter.amountOriginal.$gte = Number(amountMin);
            if (amountMax) filter.amountOriginal.$lte = Number(amountMax);
        }

        const search = searchParams.get('search');
        if (search) filter.description = { $regex: search, $options: 'i' };

        const expenses = await Expense.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Expense.countDocuments(filter);

        return NextResponse.json({
            expenses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
            },
        });
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

        const { amountOriginal, currencyOriginal, category, description, expenseDate, receiptUrl } = result.data;

        await connectToDatabase();

        const company = await Company.findById(session.companyId);
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        let amountCompany = amountOriginal;
        let fxRate = 1;
        let fxRateCached = false;

        // Currency Conversion
        if (currencyOriginal !== company.defaultCurrency) {
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currencyOriginal}`);
                if (!res.ok) throw new Error('FX API returned non-200');
                const data = await res.json();
                fxRate = data.rates[company.defaultCurrency];
                if (!fxRate) throw new Error('Rate not found');
                amountCompany = Number((amountOriginal * fxRate).toFixed(2));

                await FxRate.findOneAndUpdate(
                    { fromCurrency: currencyOriginal, toCurrency: company.defaultCurrency },
                    { rate: fxRate, fetchedAt: new Date() },
                    { upsert: true, new: true }
                );
            } catch (e) {
                console.error('FX Error:', e);
                const cached = await FxRate.findOne({
                    fromCurrency: currencyOriginal,
                    toCurrency: company.defaultCurrency,
                });
                if (!cached) {
                    return NextResponse.json(
                        { error: 'Currency conversion unavailable and no cached rate exists. Try again later.' },
                        { status: 503 }
                    );
                }
                fxRate = cached.rate;
                fxRateCached = true;
                amountCompany = Number((amountOriginal * fxRate).toFixed(2));
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
            fxRateCached,
            fxDate: new Date(),
            category,
            description,
            expenseDate,
            receiptUrl: receiptUrl ?? null,
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
