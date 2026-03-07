'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { DashboardSidebar } from './DashboardSidebar';
import { UserRole } from '@/lib/types';

export function MobileDashboardNav({ userRole }: { userRole?: UserRole }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle mobile menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r border-border/50 w-72 bg-transparent shadow-2xl [&>button]:right-4 [&>button]:top-4 [&>button]:text-muted-foreground [&>button]:bg-background/80 [&>button]:backdrop-blur [&>button]:rounded-full">
                <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="h-full w-full rounded-tr-[32px] rounded-br-[32px] overflow-hidden glass-panel border-r border-border/50">
                    <DashboardSidebar userRole={userRole} className="w-full border-r-0 bg-transparent shadow-none backdrop-blur-none" onNavigate={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
