import {
  Receipt,
  GitBranch,
  Shield,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";

export const HERO_CONTENT = {
  headline: {
    primary: "Automate Expense Approvals.",
    secondary: "Eliminate Chaos.",
  },
  description:
    "ClearClaim streamlines expense management with intelligent approval workflows, real-time dashboards, and bulletproof audit trails — so your finance team can focus on what matters.",
  ctas: {
    primary: { label: "Get Started", href: "/signup" },
    secondary: { label: "Book Demo", href: "#features" },
  },
  highlights: [
    {
      icon: Receipt,
      title: "50%",
      description: "Faster approvals",
    },
    {
      icon: GitBranch,
      title: "100%",
      description: "Audit compliance",
    },
    {
      icon: Shield,
      title: "Zero",
      description: "Data leaks",
    },
    {
      icon: BarChart3,
      title: "Real-time",
      description: "Financial insights",
    },
  ],
  trustBadge: "Trusted by 500+ finance teams worldwide",
};
