"use client";

import type { LucideIcon } from "lucide-react";
import {
  Receipt,
  Workflow,
  DollarSign,
  FileText,
  ShieldCheck,
  Users,
  Settings,
  Zap,
} from "lucide-react";

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const FEATURES_CONTENT = {
  id: "features",
  eyebrow: "Features",
  title: "Everything You Need for Expense Management",
  description:
    "Streamline your expense reimbursement process with powerful automation, intelligent workflows, and comprehensive tracking.",
  items: [
    {
      icon: Receipt,
      title: "OCR Receipt Scanning",
      description:
        "Automatically extract expense details from receipts using advanced OCR technology, reducing manual data entry.",
    },
    {
      icon: Workflow,
      title: "Configurable Approval Rules",
      description:
        "Set up custom approval workflows with multi-step and conditional rules based on amount, category, or department.",
    },
    {
      icon: DollarSign,
      title: "Automatic Currency Conversion",
      description:
        "Convert all expenses to your company's base currency automatically using real-time exchange rates.",
    },
    {
      icon: FileText,
      title: "Complete Audit Trail",
      description:
        "Track every action, approval, and change with a comprehensive audit trail for transparency and compliance.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description:
        "Employees submit expenses, managers review and approve, and admins oversee the entire process with granular permissions.",
    },
    {
      icon: Settings,
      title: "Custom Approval Flows",
      description:
        "Create approval flows with role-based steps, specific approvers, or hybrid approaches tailored to your organization.",
    },
    {
      icon: ShieldCheck,
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with encrypted data, role-based access control, and compliance-ready audit logs.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description:
        "Reduce expense processing time from days to hours with automated workflows and intelligent routing.",
    },
  ] as FeatureItem[],
} as const;


