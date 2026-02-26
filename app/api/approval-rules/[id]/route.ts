import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ApprovalRule from '@/models/ApprovalRule';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const rule = await ApprovalRule.findById(id)
            .populate('appliesToUser', 'name email')
            .populate('manager', 'name email')
            .populate('approvers.user', 'name email');

        if (!rule) {
            return NextResponse.json(
                { error: 'Approval rule not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(rule, { status: 200 });
    } catch (error) {
        console.error('Error fetching approval rule:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();

        const updatedRule = await ApprovalRule.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        })
            .populate('appliesToUser', 'name email')
            .populate('manager', 'name email')
            .populate('approvers.user', 'name email');

        if (!updatedRule) {
            return NextResponse.json(
                { error: 'Approval rule not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedRule, { status: 200 });
    } catch (error) {
        console.error('Error updating approval rule:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const deletedRule = await ApprovalRule.findByIdAndDelete(id);

        if (!deletedRule) {
            return NextResponse.json(
                { error: 'Approval rule not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Approval rule deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting approval rule:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
