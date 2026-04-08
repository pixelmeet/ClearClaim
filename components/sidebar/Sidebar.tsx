'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import { useSidebar } from './SidebarContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  CheckCircle,
  Users,
  FolderOpen,
  ChevronRight,
  ChevronsLeft,
  Zap,
  LogOut,
  User,
  Settings,
  Building,
  Shield,
} from 'lucide-react';

/* ─── Navigation Config ─── */
interface NavItem {
  label: string;
  hrefFn: (role?: UserRole) => string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Navigation',
    items: [
      {
        label: 'Dashboard',
        hrefFn: (role?: UserRole) => {
          if (role === UserRole.ADMIN) return '/admin';
          if (role === UserRole.MANAGER) return '/manager';
          return '/dashboard';
        },
        icon: LayoutDashboard,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      },
      {
        label: 'Profile',
        hrefFn: () => '/user',
        icon: User,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      },
    ],
  },
  {
    label: 'Expenses',
    items: [
      {
        label: 'My Expenses',
        hrefFn: () => '/dashboard/expenses',
        icon: FileText,
        roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
      },
      {
        label: 'New Expense',
        hrefFn: () => '/dashboard/expenses/new',
        icon: PlusCircle,
        roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        label: 'Pending Approvals',
        hrefFn: () => '/manager/approvals',
        icon: CheckCircle,
        roles: [UserRole.MANAGER, UserRole.ADMIN],
      },
      {
        label: 'Team Expenses',
        hrefFn: () => '/manager/team-expenses',
        icon: FolderOpen,
        roles: [UserRole.MANAGER],
      },
      {
        label: 'All Expenses',
        hrefFn: () => '/admin/expenses',
        icon: FileText,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Manage Users',
        hrefFn: () => '/admin/users',
        icon: Users,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Company Settings',
        hrefFn: () => '/admin/company',
        icon: Building,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Policy Rules',
        hrefFn: () => '/admin/policy-rules',
        icon: Shield,
        roles: [UserRole.ADMIN],
      },
    ],
  },
];

/* ─── Sidebar Component ─── */
interface SidebarProps {
  userRole?: UserRole;
  className?: string;
  forceExpanded?: boolean; // used by mobile drawer
  onNavigate?: () => void;
}

export function Sidebar({ userRole, className, forceExpanded = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapse } = useSidebar();

  const collapsed = forceExpanded ? false : isCollapsed;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } finally {
      router.refresh();
      router.push('/login');
    }
  };

  const isActivePath = (href: string) => {
    if (pathname === href) return true;
    // For root dashboard paths, only exact match
    if (href === '/dashboard' || href === '/admin' || href === '/manager') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const roleLabel = userRole === UserRole.ADMIN
    ? 'Administrator'
    : userRole === UserRole.MANAGER
      ? 'Manager'
      : 'Employee';

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        className={cn(
          'h-full flex flex-col relative',
          'bg-sidebar backdrop-blur-2xl',
          'border-r border-sidebar-border',
          className,
        )}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Gradient accent line on right edge */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {/* ─── Logo / Brand ─── */}
          <div className={cn('flex items-center gap-3 shrink-0', collapsed ? 'p-4 justify-center' : 'p-6 pb-4')}>
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="h-5 w-5 text-white" />
            </motion.div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-xl font-display font-bold text-foreground leading-tight tracking-tight whitespace-nowrap">
                    ClearClaim
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase whitespace-nowrap">
                    {roleLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className={cn('h-px bg-border/30 shrink-0', collapsed ? 'mx-3' : 'mx-6')} />

          {/* ─── Navigation ─── */}
          <nav className={cn('flex-1 pt-4 space-y-5 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2' : 'px-3')}>
            {navSections.map((section) => {
              const visibleItems = section.items.filter(
                (item) => !userRole || item.roles.includes(userRole),
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.label}>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.p
                        className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {section.label}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {collapsed && <div className="mb-2 h-px bg-border/20 mx-2" />}

                  <div className="space-y-0.5">
                    {visibleItems.map((link) => {
                      const href = link.hrefFn(userRole);
                      const isActive = isActivePath(href);
                      const IconComp = link.icon;

                      const buttonContent = (
                        <Link href={href} onClick={onNavigate} className="block">
                          <motion.div
                            className={cn(
                              'relative flex items-center rounded-xl transition-colors duration-200 group',
                              collapsed ? 'h-10 w-10 justify-center mx-auto' : 'h-10 px-3 w-full',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Active Accent Bar */}
                            {isActive && (
                              <motion.div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-sm shadow-primary/50"
                                layoutId="sidebar-active"
                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                              />
                            )}

                            {/* Active Glow */}
                            {isActive && (
                              <div className="absolute inset-0 rounded-xl bg-primary/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]" />
                            )}

                            {/* Icon */}
                            <IconComp
                              className={cn(
                                'h-4 w-4 shrink-0 transition-all duration-200 relative z-10',
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground group-hover:text-primary group-hover:scale-110',
                                !collapsed && 'mr-3',
                              )}
                            />

                            {/* Label */}
                            <AnimatePresence mode="wait">
                              {!collapsed && (
                                <motion.span
                                  className={cn(
                                    'flex-1 text-left text-sm whitespace-nowrap relative z-10',
                                    isActive && 'font-medium',
                                  )}
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {link.label}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {/* Active arrow */}
                            {isActive && !collapsed && (
                              <ChevronRight className="h-3.5 w-3.5 text-primary/50 relative z-10" />
                            )}
                          </motion.div>
                        </Link>
                      );

                      // Show tooltip when collapsed
                      if (collapsed) {
                        return (
                          <Tooltip key={href}>
                            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {link.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return <div key={href}>{buttonContent}</div>;
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* ─── Bottom Section ─── */}
          <div className={cn('mt-auto shrink-0 space-y-2', collapsed ? 'p-2' : 'p-4')}>
            <div className={cn('h-px bg-border/20', collapsed ? 'mx-1' : 'mx-2')} />

            {/* Role badge */}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  className="px-3 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    <span className="text-muted-foreground capitalize whitespace-nowrap">
                      {userRole ? userRole.toLowerCase() : 'User'} Access
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapse toggle (desktop only) */}
            {!forceExpanded && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl h-10 transition-all',
                      collapsed ? 'w-10 mx-auto' : 'w-full',
                    )}
                    onClick={toggleCollapse}
                  >
                    <motion.div
                      animate={{ rotate: collapsed ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          className="text-sm ml-3 whitespace-nowrap"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          Collapse
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">Expand sidebar</TooltipContent>
                )}
              </Tooltip>
            )}

            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl h-10 transition-all group',
                    collapsed ? 'w-10 mx-auto p-0 justify-center' : 'w-full justify-start px-3',
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className={cn('h-4 w-4 shrink-0 group-hover:-translate-x-0.5 transition-transform', !collapsed && 'mr-3')} />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        className="text-sm font-medium whitespace-nowrap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        Log out
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Log out</TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
