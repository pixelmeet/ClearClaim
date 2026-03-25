import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ApprovalFlow from '@/models/ApprovalFlow';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { createApprovalFlowSchema } from '@/lib/validators/approvalFlow';

/**
 * GET /api/admin/approval-flows
 * List all approval flows for the session's company.
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const flows = await ApprovalFlow.find({ companyId: session.companyId })
            .sort({ createdAt: -1 })
            .populate('steps.userId', 'name email role');

        return NextResponse.json({ flows });
    } catch (err: unknown) {
        console.error('[GET /api/admin/approval-flows]', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/approval-flows
 * Create a new approval flow with strict Zod validation.
 */
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // 1. Validate with Zod
        const parsed = createApprovalFlowSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map(
                (issue) => `${issue.path.join('.')}: ${issue.message}`
            );
            return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
        }

        await connectToDatabase();

        const { name, isManagerApprover, minApprovalPercent, category, steps } = parsed.data;

        // 2. Security: verify all USER-type step approvers belong to same company
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

        // 3. Check for duplicate flow name
        const existing = await ApprovalFlow.findOne({
            companyId: session.companyId,
            name: name.trim(),
        });
        if (existing) {
            return NextResponse.json(
                { error: `A flow named "${name}" already exists.` },
                { status: 409 }
            );
        }

        // 4. Create flow
        const flow = await ApprovalFlow.create({
            companyId: session.companyId,
            name,
            isManagerApprover,
            minApprovalPercent,
            category: category ?? null,
            steps,
        });

        return NextResponse.json({ flow }, { status: 201 });
    } catch (err: unknown) {
        console.error('[POST /api/admin/approval-flows]', err);
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
