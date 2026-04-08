import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { CommandPalette } from '@/components/command-palette';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
            {/* Command Palette for global access */}
            <CommandPalette />

            {/* Sidebar Desktop */}
            <div className="hidden md:flex">
                <DashboardSidebar userRole={session.role} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Topbar (Client Component) */}
                <DashboardTopbar user={{
                    name: session.name,
                    email: session.email,
                    role: session.role
                }} />

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-transparent relative z-0">
                    {children}
                </main>
            </div>
        </div>
    );
}

