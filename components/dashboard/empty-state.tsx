"use client";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Inbox, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  variant?: "expenses" | "approvals" | "search" | "generic";
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

const configs = {
  expenses: {
    icon: FileText,
    title: "No expenses yet",
    description: "Submit your first expense to get started with ClearClaim.",
    actionLabel: "Submit Expense",
    actionHref: "/dashboard/expenses/new",
  },
  approvals: {
    icon: CheckCircle,
    title: "No pending approvals",
    description: "You're all caught up! No expenses waiting for your review.",
    actionLabel: undefined,
    actionHref: undefined,
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
    actionLabel: undefined,
    actionHref: undefined,
  },
  generic: {
    icon: Inbox,
    title: "Nothing here yet",
    description: "This section will be populated as you use ClearClaim.",
    actionLabel: undefined,
    actionHref: undefined,
  },
};

export function EmptyState({ variant = "generic", title, description, actionLabel, actionHref }: EmptyStateProps) {
  const config = configs[variant];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;
  const displayActionHref = actionHref || config.actionHref;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 rounded-2xl bg-primary/10 mb-6">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 font-display">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{displayDescription}</p>
      {displayActionLabel && displayActionHref && (
        <Button asChild className="bg-primary hover:bg-primary-hover text-white rounded-xl">
          <Link href={displayActionHref}>{displayActionLabel}</Link>
        </Button>
      )}
    </motion.div>
  );
}
