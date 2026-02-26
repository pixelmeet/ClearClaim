"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAVBAR = {
  logo: {
    light: "/images/logo.svg",
    dark: "/images/logo.svg",
    alt: "ClearClaim Logo",
    width: 32,
    height: 32,
  },
  name: {
    primary: "Clear",
    secondary: "Claim",
  },
  links: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ] as NavLink[],
} as const;
