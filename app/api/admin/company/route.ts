import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Company from '@/models/Company';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { UpdateCompanySchema } from '@/lib/validation';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const company = await Company.findById(session.companyId);
        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({ company });
    } catch (error) {
        console.error('Fetch company error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = UpdateCompanySchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { name, country, defaultCurrency } = result.data;
        const nameLower = name.trim().toLowerCase();

        await connectToDatabase();

        // Check for duplicate company names
        const existingCompany = await Company.findOne({
            nameLower,
            _id: { $ne: session.companyId }
        });

        if (existingCompany) {
            return NextResponse.json({ error: 'Company name already in use' }, { status: 409 });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            session.companyId,
            { name, nameLower, country, defaultCurrency },
            { new: true, runValidators: true }
        );

        if (!updatedCompany) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({ company: updatedCompany });

    } catch (error) {
        console.error('Update company error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
