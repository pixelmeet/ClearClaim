import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearClaim - Expense Management",
  description: "Modern expense management and approval system",
  icons: {
    icon: "/images/logo.svg",
  },
};

// Distinctive heading font - Outfit as alternative to Satoshi/Clash Display
const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Serif for emphasis - Fraunces is distinctive and variable
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
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
        className={`antialiased ${sans.variable} ${serif.variable} ${mono.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}