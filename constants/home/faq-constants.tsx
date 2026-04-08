export const FAQ_CONTENT = {
  id: "faq",
  eyebrow: "FAQ",
  title: "Frequently asked questions",
  description: "Everything you need to know about ClearClaim.",
  items: [
    {
      question: "How does the multi-tenant architecture work?",
      answer:
        "Every database entity is scoped to a companyId. All queries filter by this ID, derived from the authenticated user's JWT session. There is no cross-company data access at any layer — not in queries, not in API responses, not in middleware.",
    },
    {
      question: "Can we customize the approval workflow?",
      answer:
        "Yes. Admins can define multi-step approval chains with flow-based routing (ordered steps by user or role) and rule-based routing (direct approver assignment). You can also set conditional auto-approval rules based on percentages, specific approvers, or hybrid logic.",
    },
    {
      question: "How does currency conversion work?",
      answer:
        "When an expense is submitted in a currency different from the company default, ClearClaim fetches live exchange rates, calculates the converted amount, and stores both the original and converted values along with the rate and date.",
    },
    {
      question: "What roles are available?",
      answer:
        "Three roles: Employee (submit and track expenses), Manager (approve team expenses), and Admin (full control — users, rules, settings, and global overrides).",
    },
    {
      question: "Is there an audit trail?",
      answer:
        "Every approve, reject, and auto-trigger action creates an immutable ApprovalAction record with the approver, step index, action type, comment, and timestamp. This is an append-only log — actions are never deleted or modified.",
    },
    {
      question: "Can employees edit submitted expenses?",
      answer:
        "Once submitted, expenses enter the approval workflow and cannot be edited. If an expense is rejected, the employee can submit a new corrected expense.",
    },
  ],
};
