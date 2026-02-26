"use client";

import type { LucideIcon } from "lucide-react";
import { Users, Receipt, Zap, ShieldCheck } from "lucide-react";

export type HeroHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const HERO_CONTENT = {
  id: "hero",
  headline: {
    primary: "ClearClaim,",
    secondary: "Expense Reimbursement Made Simple",
  },
  description:
    "Automate your expense approval workflows with configurable rules, OCR-powered receipt scanning, and multi-step approvals. Convert expenses to your company's base currency automatically.",
  ctas: {
    primary: { href: "/signup", label: "Get Started" },
    secondary: { href: "/login", label: "Sign In" },
  },
  highlights: [
    { icon: Zap, title: "Fast", description: "Automated Workflows" },
    { icon: Receipt, title: "Smart", description: "OCR Receipt Scanning" },
    { icon: ShieldCheck, title: "Secure", description: "Complete Audit Trail" },
    { icon: Users, title: "Flexible", description: "Multi-Step Approvals" },
  ] as HeroHighlight[],
} as const;


