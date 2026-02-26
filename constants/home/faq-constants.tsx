"use client";

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_CONTENT = {
  id: "faq",
  eyebrow: "FAQ",
  title: "Frequently Asked Questions",
  description:
    "Everything you need to know about ClearClaim and how it can help streamline your expense management.",
  items: [
    {
      question: "How does the OCR receipt scanning work?",
      answer:
        "ClearClaim uses advanced OCR (Optical Character Recognition) technology to automatically extract expense details from receipt images. Simply upload a photo of your receipt, and the system will extract the merchant name, date, amount, and category. You can review and edit the extracted information before submitting.",
    },
    {
      question: "Can I customize approval workflows?",
      answer:
        "Yes! ClearClaim offers flexible approval workflow configuration. You can create multi-step approval processes, set up conditional rules based on expense amount or category, assign specific approvers, or use role-based approvals. Admins can configure these rules through the admin panel.",
    },
    {
      question: "How does currency conversion work?",
      answer:
        "ClearClaim automatically converts all expenses to your company's base currency using real-time exchange rates. When an employee submits an expense in a foreign currency, the system records both the original amount and currency, then converts it to your base currency using the exchange rate from the expense date.",
    },
    {
      question: "What is included in the audit trail?",
      answer:
        "The audit trail captures every action taken on an expense, including submission, approvals, rejections, modifications, and status changes. Each entry includes the user who performed the action, timestamp, and details of what changed. This provides complete transparency and accountability for compliance purposes.",
    },
    {
      question: "What roles are available in the system?",
      answer:
        "ClearClaim has three main roles: Employees can submit and track their expenses, Managers can review and approve expenses for their team members, and Admins have full system access including user management, workflow configuration, and system-wide expense oversight.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. ClearClaim uses enterprise-grade security measures including encrypted data storage, secure authentication, role-based access control, and comprehensive audit logging. All data is stored securely and access is strictly controlled based on user roles.",
    },
    {
      question: "Can I integrate ClearClaim with our accounting software?",
      answer:
        "ClearClaim provides comprehensive audit trails and export capabilities that make it easy to integrate with accounting systems. You can export expense data in various formats for import into your existing accounting software. API access is also available for custom integrations.",
    },
    {
      question: "How quickly can I get started?",
      answer:
        "You can get started with ClearClaim in minutes. Simply sign up, configure your company settings, set up your approval workflows, and invite your team members. Our intuitive interface and setup wizard guide you through the process step by step.",
    },
  ] as FaqItem[],
} as const;


