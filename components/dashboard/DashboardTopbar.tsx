'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  User as UserIcon,
  Menu,
  Settings,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CommandPaletteTrigger } from '@/components/command-palette';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserRole } from '@/lib/types';
import { useSidebar } from '@/components/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardTopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: UserRole;
  };
}

/* ─── Route → Page Title mapping ─── */
function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/expenses': 'My Expenses',
    '/dashboard/expenses/new': 'New Expense',
    '/admin': 'Admin Overview',
    '/admin/users': 'Manage Users',
    '/admin/company': 'Company Settings',
    '/admin/expenses': 'All Expenses',
    '/admin/policy-rules': 'Policy Rules',
    '/admin/approval-flows': 'Approval Flows',
    '/manager': 'Manager Dashboard',
    '/manager/approvals': 'Pending Approvals',
    '/manager/team-expenses': 'Team Expenses',
    '/user': 'Profile',
    '/notifications': 'Notifications',
  };

  // Exact match first
  if (routes[pathname]) return routes[pathname];

  // Expense detail page
  if (pathname.startsWith('/dashboard/expenses/')) return 'Expense Details';
  if (pathname.startsWith('/admin/policy-rules/')) return 'Policy Rule';

  // Fallback: use last segment
  const segments = pathname.split('/').filter(Boolean);
  return segments[segments.length - 1]
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard';
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const title = getPageTitle(pathname);
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return [{ label: title }];
  }

  const rootLabel = segments[0] === 'admin'
    ? 'Admin'
    : segments[0] === 'manager'
      ? 'Manager'
      : 'System';

  return [
    { label: rootLabel },
    { label: title },
  ];
}

export function DashboardTopbar({ user }: DashboardTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openMobile } = useSidebar();

  const initials = user.name
    ? user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'US';

  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } finally {
      router.refresh();
      router.push('/login');
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/30 bg-background/60 backdrop-blur-2xl px-4 md:px-6 z-10 shrink-0 sticky top-0">
      {/* Left: Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-1 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            onClick={openMobile}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </motion.div>

        {/* Breadcrumbs */}
        <div className="hidden sm:flex text-sm font-medium items-center gap-1.5 text-muted-foreground min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-border/50 shrink-0" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-foreground tracking-tight px-2 py-1 bg-primary/5 text-primary rounded-md font-semibold text-xs truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <span className="truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>

        {/* Mobile: Page title */}
        <span className="sm:hidden text-sm font-semibold text-foreground truncate">
          {getPageTitle(pathname)}
        </span>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden md:block">
        <CommandPaletteTrigger />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationBell />

        <div className="h-5 w-px bg-border/30 hidden sm:block" />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none group cursor-pointer">
              <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground text-[10px] font-bold shadow-sm ring-2 ring-background/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {initials}
              </motion.div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-panel-strong">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground leading-none">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/user" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {user.role === UserRole.ADMIN && (
              <DropdownMenuItem asChild>
                <Link href="/admin/company" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
