import { Globe, Send, Camera, Building2, LucideIcon } from "lucide-react";

export interface SocialLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface ContactInfo {
  address: {
    line1: string;
    line2: string;
    line3: string;
  };
  email: string;
  phone: string;
}

export interface FooterConfig {
  companyName: {
    primary: string;
    secondary: string;
  };
  tagline: string;
  socialLinks: SocialLink[];
  sections: FooterSection[];
  contactInfo: ContactInfo;
  legal: {
    copyrightText: string;
    links: FooterLink[];
  };
}

export const footerConfig: FooterConfig = {
  companyName: {
    primary: "Clear",
    secondary: "Claim",
  },
  tagline:
    "Automate your expense reimbursement workflows with intelligent approval rules and OCR-powered receipt scanning.",
  socialLinks: [
    {
      href: "https://facebook.com",
      icon: Globe,
      label: "Facebook",
    },
    {
      href: "https://twitter.com",
      icon: Send,
      label: "Twitter",
    },
    {
      href: "https://instagram.com",
      icon: Camera,
      label: "Instagram",
    },
    {
      href: "https://linkedin.com",
      icon: Building2,
      label: "LinkedIn",
    },
  ],
  sections: [
    {
      title: "Product",
      links: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/#features", label: "Features" },
        { href: "/#faq", label: "FAQ" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/login", label: "Sign In" },
        { href: "/signup", label: "Sign Up" },
        { href: "/#testimonials", label: "Testimonials" },
      ],
    },
  ],
  contactInfo: {
    address: {
      line1: "SDJ International College",
      line2: "Surat, Gujarat, India",
      line3: "",
    },
    email: "contact@clearclaim.com",
    phone: "+91 12345 67890",
  },
  legal: {
    copyrightText: "ClearClaim. All rights reserved.",
    links: [],
  },
};
