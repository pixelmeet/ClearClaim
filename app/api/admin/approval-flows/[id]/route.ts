import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ApprovalFlow from '@/models/ApprovalFlow';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { createApprovalFlowSchema } from '@/lib/validators/approvalFlow';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/approval-flows/[id]
 */
export async function GET(_req: Request, ctx: RouteContext) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await ctx.params;
        await connectToDatabase();

        const flow = await ApprovalFlow.findOne({
            _id: id,
            companyId: session.companyId,
        }).populate('steps.userId', 'name email role');

        if (!flow) {
            return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
        }

        return NextResponse.json({ flow });
    } catch (err: unknown) {
        console.error('[GET /api/admin/approval-flows/[id]]', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/approval-flows/[id]
 */
export async function PUT(req: Request, ctx: RouteContext) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await ctx.params;
        const body = await req.json();

        // Validate
        const parsed = createApprovalFlowSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map(
                (issue) => `${issue.path.join('.')}: ${issue.message}`
            );
            return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
        }

        await connectToDatabase();

        // Security: verify flow belongs to this company
        const existing = await ApprovalFlow.findOne({
            _id: id,
            companyId: session.companyId,
        });
        if (!existing) {
            return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
        }

        const { name, isManagerApprover, minApprovalPercent, category, steps } = parsed.data;

        // Verify approvers belong to company
        const userStepIds = steps
            .filter((s) => s.type === 'USER' && s.userId)
            .map((s) => s.userId!);

        if (userStepIds.length > 0) {
            const approvers = await User.find({
                _id: { $in: userStepIds },
                companyId: session.companyId,
            }).select('_id');

            const foundIds = new Set(approvers.map((u) => u._id.toString()));
            for (const uid of userStepIds) {
                if (!foundIds.has(uid)) {
                    return NextResponse.json(
                        { error: `Approver ${uid} not found in your company.` },
                        { status: 400 }
                    );
                }
            }
        }

        // Duplicate name check (exclude self)
        const duplicate = await ApprovalFlow.findOne({
            companyId: session.companyId,
            name: name.trim(),
            _id: { $ne: id },
        });
        if (duplicate) {
            return NextResponse.json(
                { error: `A flow named "${name}" already exists.` },
                { status: 409 }
            );
        }

        // Update
        existing.name = name;
        existing.isManagerApprover = isManagerApprover;
        existing.minApprovalPercent = minApprovalPercent;
        existing.category = category ?? null;
        existing.steps = steps as any;
        await existing.save();

        return NextResponse.json({ flow: existing });
    } catch (err: unknown) {
        console.error('[PUT /api/admin/approval-flows/[id]]', err);
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/approval-flows/[id]
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await ctx.params;
        await connectToDatabase();

        const deleted = await ApprovalFlow.findOneAndDelete({
            _id: id,
            companyId: session.companyId,
        });

        if (!deleted) {
            return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('[DELETE /api/admin/approval-flows/[id]]', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
