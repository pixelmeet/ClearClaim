'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { Sidebar } from './Sidebar';
import { UserRole } from '@/lib/types';

interface MobileSidebarProps {
  userRole?: UserRole;
}

export function MobileSidebar({ userRole }: MobileSidebarProps) {
  const { isMobileOpen, closeMobile } = useSidebar();

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    },
    [closeMobile],
  );

  useEffect(() => {
    if (isMobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileOpen, handleKeyDown]);

  // Only render portal on client
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {/* Close button */}
            <motion.button
              className="absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              onClick={closeMobile}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </motion.button>

            {/* Sidebar content — always expanded in mobile */}
            <div className="h-full w-full rounded-tr-2xl rounded-br-2xl overflow-hidden glass-panel border-r border-border/50">
              <Sidebar
                userRole={userRole}
                forceExpanded
                className="w-full border-r-0 bg-transparent shadow-none backdrop-blur-none"
                onNavigate={closeMobile}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
