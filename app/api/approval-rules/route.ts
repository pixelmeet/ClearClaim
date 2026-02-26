import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ApprovalRule from '@/models/ApprovalRule';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { organization } = body;

        if (!organization) {
            return NextResponse.json(
                { error: 'Organization is required' },
                { status: 400 }
            );
        }

        const rule = new ApprovalRule(body);
        const savedRule = await rule.save();

        return NextResponse.json(savedRule, { status: 201 });
    } catch (error) {
        console.error('Error creating approval rule:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectToDatabase();

        const rules = await ApprovalRule.find()
            .populate('appliesToUser', 'name email')
            .populate('manager', 'name email')
            .populate('approvers.user', 'name email');

        return NextResponse.json(rules, { status: 200 });
    } catch (error) {
        console.error('Error fetching approval rules:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
