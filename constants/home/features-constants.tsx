import {
  Receipt,
  GitBranch,
  ShieldCheck,
  BarChart3,
  ScrollText,
  ArrowLeftRight,
} from "lucide-react";

export const FEATURES_CONTENT = {
  id: "features",
  eyebrow: "Powerful Features",
  title: "Everything your finance team needs",
  description:
    "From submission to approval, ClearClaim handles the entire expense lifecycle with enterprise-grade security and real-time visibility.",
  items: [
    {
      icon: Receipt,
      title: "Expense Submission",
      description:
        "Employees submit expenses with receipt uploads, OCR auto-fill, and multi-currency support. Every claim is tracked from day one.",
    },
    {
      icon: GitBranch,
      title: "Approval Workflows",
      description:
        "Define multi-step approval chains with manager routing, role-based steps, and conditional auto-approval rules.",
    },
    {
      icon: ShieldCheck,
      title: "Multi-Tenant Security",
      description:
        "Every query is scoped by company. Zero cross-tenant data access at any layer — API, database, or middleware.",
    },
    {
      icon: BarChart3,
      title: "Real-time Dashboards",
      description:
        "Live KPI cards, expense trend charts, and approval queue status — role-specific views for admins, managers, and employees.",
    },
    {
      icon: ScrollText,
      title: "Audit Trail",
      description:
        "Every approve, reject, and auto-trigger is logged as an immutable record. Full compliance visibility at every step.",
    },
    {
      icon: ArrowLeftRight,
      title: "FX Conversion",
      description:
        "Automatic currency conversion with live exchange rates. Submit in any currency, approve in your company's default.",
    },
  ],
};
