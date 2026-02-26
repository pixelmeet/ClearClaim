import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import AdminApprovalRuleForm from '@/components/admin-approval/AdminApprovalForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default async function AdminApprovalPage() {
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
                            You do not have permission to access this page. Only administrators can manage approval rules.
                        </p>
                        <Link href="/dashboard">
                            <Button variant="outline">Go to Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4 opacity-0 animate-fade-in-up">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Create Approval Rule
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Define a new approval workflow rule for your organization.
                    </p>
                </div>
            </div>

            <div className="opacity-0 animate-fade-in-up delay-100">
                <AdminApprovalRuleForm currentUserOrganization={currentUser.companyId} />
            </div>
        </div>
    );
}
