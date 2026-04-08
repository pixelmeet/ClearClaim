import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearClaim — Automate Expense Approvals | Expense Management SaaS",
  description:
    "ClearClaim streamlines expense management with intelligent approval workflows, real-time dashboards, and bulletproof audit trails for finance teams.",
  keywords: [
    "expense management",
    "approval workflow",
    "fintech",
    "SaaS",
    "expense tracking",
    "audit trail",
  ],
  icons: {
    icon: "/images/logo.svg",
  },
};

// Elegant display/heading font
const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Highly legible and professional body font
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Developer-friendly monospace
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased ${sans.variable} ${display.variable} ${mono.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}