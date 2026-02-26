import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserAction, deleteApprovalRuleAction } from '@/app/actions/auth';
import connectToDatabase from '@/lib/db';
import ApprovalRule from '@/models/ApprovalRule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    ArrowLeft,
    ShieldAlert,
    Plus,
    Pencil,
    Trash2,
    Users,
    ListOrdered,
    ShieldCheck,
    FileText,
} from 'lucide-react';

export default async function ApprovalsListPage() {
    const currentUser = await getCurrentUserAction();

    if (!currentUser) {
        redirect('/login');
    }

    if (currentUser.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <Card className="w-full max-w-md border-destructive/50 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <ShieldAlert className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="text-xl">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            You do not have permission to access this page.
                        </p>
                        <Link href="/dashboard">
                            <Button variant="outline">Go to Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    await connectToDatabase();

    const rules = await ApprovalRule.find({ organization: currentUser.companyId })
        .populate('appliesToUser', 'name email')
        .populate('manager', 'name email')
        .populate('approvers.user', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    const serializedRules = JSON.parse(JSON.stringify(rules));

    const totalRules = serializedRules.length;
    const withApprovers = serializedRules.filter(
        (r: { approvers?: unknown[] }) => r.approvers && r.approvers.length > 0
    ).length;
    const sequentialRules = serializedRules.filter(
        (r: { approverSequence?: boolean }) => r.approverSequence
    ).length;

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div className="flex items-center justify-between opacity-0 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Approval Rules
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Manage your organization&apos;s approval workflow rules.
                        </p>
                    </div>
                </div>
                <Link href="/admin/admin-approval">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Rule
                    </Button>
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-3 opacity-0 animate-fade-in-up delay-100">
                <Card className="border-card-border bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Rules
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRules}</div>
                    </CardContent>
                </Card>
                <Card className="border-card-border bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            With Approvers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{withApprovers}</div>
                    </CardContent>
                </Card>
                <Card className="border-card-border bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Sequential Rules
                        </CardTitle>
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sequentialRules}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Rules List */}
            {serializedRules.length === 0 ? (
                <Card className="border-dashed border-2 opacity-0 animate-fade-in-up delay-200 bg-card/60 backdrop-blur-xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No Approval Rules</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm">
                            Get started by creating your first approval rule to define your organization&apos;s approval workflow.
                        </p>
                        <Link href="/admin/admin-approval" className="mt-4">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create First Rule
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 opacity-0 animate-fade-in-up delay-200">
                    {serializedRules.map(
                        (rule: {
                            _id: string;
                            ruleName?: string;
                            description?: string;
                            organization?: string;
                            minApprovalPercent?: number;
                            isManagerApprover?: boolean;
                            approverSequence?: boolean;
                            appliesToUser?: { _id: string; name: string; email: string } | null;
                            manager?: { _id: string; name: string; email: string } | null;
                            approvers?: {
                                user?: { _id: string; name: string; email: string } | null;
                                required?: boolean;
                                autoApprove?: boolean;
                                sequenceNo?: number;
                            }[];
                            createdAt?: string;
                        }) => (
                            <Card
                                key={rule._id}
                                className="border-card-border bg-card/60 backdrop-blur-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">
                                                {rule.ruleName || 'Untitled Rule'}
                                            </CardTitle>
                                            {rule.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {rule.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        {rule.organization && (
                                            <Badge variant="outline" className="ml-2 shrink-0">
                                                {rule.organization}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Rule Info */}
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            Min. {rule.minApprovalPercent ?? 100}% Approval
                                        </Badge>
                                        <Badge variant="secondary">
                                            {rule.approvers?.length || 0} Approver
                                            {(rule.approvers?.length || 0) !== 1 ? 's' : ''}
                                        </Badge>
                                        {rule.isManagerApprover && (
                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
                                                Manager Approver
                                            </Badge>
                                        )}
                                        {rule.approverSequence && (
                                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                                                Sequential
                                            </Badge>
                                        )}
                                    </div>

                                    {/* User Assignments */}
                                    <div className="text-sm space-y-1">
                                        {rule.appliesToUser && (
                                            <p>
                                                <span className="text-muted-foreground">Applies to: </span>
                                                <span className="font-medium">{rule.appliesToUser.name}</span>
                                            </p>
                                        )}
                                        {rule.manager && (
                                            <p>
                                                <span className="text-muted-foreground">Manager: </span>
                                                <span className="font-medium">{rule.manager.name}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Approver Names */}
                                    {rule.approvers && rule.approvers.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {rule.approvers.map(
                                                (
                                                    approver: {
                                                        user?: { _id: string; name: string } | null;
                                                    },
                                                    idx: number
                                                ) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {approver.user?.name || 'Unknown'}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="text-xs text-muted-foreground">
                                            Created{' '}
                                            {rule.createdAt
                                                ? new Date(rule.createdAt).toLocaleDateString()
                                                : 'N/A'}
                                        </span>
                                        <div className="flex gap-2">
                                            <Link href={`/admin/approvals/edit/${rule._id}`}>
                                                <Button variant="outline" size="sm" className="gap-1.5">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit
                                                </Button>
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Approval Rule</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete &quot;{rule.ruleName || 'this rule'}&quot;? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <form
                                                            action={async () => {
                                                                'use server';
                                                                await deleteApprovalRuleAction(rule._id);
                                                                redirect('/admin/approvals');
                                                            }}
                                                        >
                                                            <AlertDialogAction
                                                                type="submit"
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </form>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
