import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import connectToDatabase from '@/lib/db';
import ApprovalRule from '@/models/ApprovalRule';
import AdminApprovalRuleForm from '@/components/admin-approval/AdminApprovalForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileX } from 'lucide-react';

export default async function EditApprovalRulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
        redirect('/login');
    }

    if (currentUser.role !== 'ADMIN') {
        redirect('/admin');
    }

    await connectToDatabase();

    const rule = await ApprovalRule.findById(id)
        .populate('appliesToUser', 'name email')
        .populate('manager', 'name email')
        .populate('approvers.user', 'name email')
        .lean();

    if (!rule) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <Card className="w-full max-w-md border-destructive/50 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <FileX className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="text-xl">Rule Not Found</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            The approval rule you are looking for does not exist or has been deleted.
                        </p>
                        <Link href="/admin/approvals">
                            <Button variant="outline">Back to Rules</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const serialized = JSON.parse(JSON.stringify(rule));

    const initialData = {
        ruleName: serialized.ruleName || '',
        description: serialized.description || '',
        appliesToUser: serialized.appliesToUser?._id || '',
        manager: serialized.manager?._id || '',
        isManagerApprover: serialized.isManagerApprover || false,
        approverSequence: serialized.approverSequence || false,
        minApprovalPercent: serialized.minApprovalPercent ?? 100,
        approvers: (serialized.approvers || []).map(
            (a: {
                user?: { _id: string } | string | null;
                required?: boolean;
                sequenceNo?: number;
                autoApprove?: boolean;
            }) => ({
                user: typeof a.user === 'object' && a.user !== null ? a.user._id : a.user || '',
                required: a.required || false,
                sequenceNo: a.sequenceNo || 0,
                autoApprove: a.autoApprove || false,
            })
        ),
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4 opacity-0 animate-fade-in-up">
                <Link href="/admin/approvals">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Edit Approval Rule
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Update the settings for &ldquo;{serialized.ruleName || 'Untitled Rule'}&rdquo;.
                    </p>
                </div>
            </div>

            <div className="opacity-0 animate-fade-in-up delay-100">
                <AdminApprovalRuleForm
                    editMode={true}
                    ruleId={id}
                    initialData={initialData}
                    currentUserOrganization={currentUser.companyId}
                />
            </div>
        </div>
    );
}
