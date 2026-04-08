'use client';

import { SidebarProvider, Sidebar, MobileSidebar } from '@/components/sidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { CommandPalette } from '@/components/command-palette';
import { UserRole } from '@/lib/types';

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: UserRole;
  };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
        {/* Command Palette for global access */}
        <CommandPalette userRole={user.role} />

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar userRole={user.role} />
        </div>

        {/* Mobile Sidebar Drawer */}
        <MobileSidebar userRole={user.role} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden relative min-w-0">
          {/* Topbar */}
          <DashboardTopbar user={user} />

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-transparent relative z-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
