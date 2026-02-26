import {
  CalendarCheck,
  HeartPulse,
  BarChart,
  Bell,
  LucideIcon,
} from "lucide-react";

export interface CTABadge {
  text: string;
}

export interface CTAHeading {
  title: string;
  subtitle: string;
}

export interface CTAFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface CTAButton {
  text: string;
  href: string;
  variant: "primary" | "secondary";
}

export interface DashboardItem {
  icon: LucideIcon;
  title: string;
  time: string;
  content: string;
}

export interface CTADashboard {
  title: string;
  patientName: string;
  items: DashboardItem[];
}

export interface CTAConfig {
  badge: CTABadge;
  heading: CTAHeading;
  features: CTAFeature[];
  buttons: CTAButton[];
  dashboard: CTADashboard;
}

export const ctaConfig: CTAConfig = {
  badge: {
    text: "Get Started Today",
  },
  heading: {
    title: "Ready to Streamline Your Expense Management?",
    subtitle:
      "Join companies that have automated their expense reimbursement process and saved hours of manual work every week.",
  },
  features: [
    {
      icon: CalendarCheck,
      title: "Quick Setup",
      description: "Get started in minutes with our intuitive setup wizard and pre-configured approval flows.",
    },
    {
      icon: HeartPulse,
      title: "24/7 Support",
      description:
        "Our team is here to help you every step of the way with dedicated support and comprehensive documentation.",
    },
  ],
  buttons: [
    {
      text: "Start Free Trial",
      href: "/signup",
      variant: "primary",
    },
    {
      text: "Schedule Demo",
      href: "/login",
      variant: "secondary",
    },
  ],
  dashboard: {
    title: "Dashboard Preview",
    patientName: "Your Expenses",
    items: [
      {
        icon: CalendarCheck,
        title: "Submit Expense",
        time: "Just now",
        content:
          "Upload a receipt and let our OCR automatically extract all the details. Submit with one click.",
      },
      {
        icon: BarChart,
        title: "Track Status",
        time: "2 hours ago",
        content:
          "Monitor your expense status in real-time as it moves through the approval workflow.",
      },
      {
        icon: Bell,
        title: "Get Notified",
        time: "Yesterday",
        content:
          "Receive instant notifications when expenses are approved, rejected, or need your attention.",
      },
    ],
  },
};
