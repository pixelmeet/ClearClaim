"use client";
import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";
import { footerConfig } from "@/constants/layout/footer-constants";

export function Footer() {
  const { companyName, tagline, socialLinks, sections, contactInfo, legal } =
    footerConfig;

  return (
    <footer className="bg-[#020617] text-white/80 relative overflow-hidden border-t border-white/5 py-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[180px]" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-6 font-sans text-2xl tracking-tighter">
              <span className="text-white font-bold">
                {companyName.primary}
              </span>
              <span className="text-primary font-bold">
                {companyName.secondary}
              </span>
            </div>
            <p className="text-white/50 mb-8 text-base leading-relaxed max-w-sm">
              {tagline}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <SocialLink
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}>
                  <social.icon className="h-5 w-5" />
                </SocialLink>
              ))}
            </div>
          </div>
 
          {/* Dynamic Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-bold text-lg mb-8 tracking-tight">
                {section.title}
              </h3>
              <div className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </div>
          ))}
 
          {/* Contact Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-8 tracking-tight">
              Get in Touch
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-white/60 text-sm leading-relaxed">
                  {contactInfo.address.line1}
                  <br />
                  {contactInfo.address.line2}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-white/60 text-sm">{contactInfo.email}</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Legal Section */}
        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm font-medium">
            &copy; {new Date().getFullYear()} {legal.copyrightText}. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-sm text-white/50 font-medium">
            {legal.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-primary transition-colors duration-300">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      href={href}
      className="bg-foreground/10 p-2 rounded-full text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      {...props}>
      {children}
    </Link>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <Link
        href={href}
        className="text-muted-foreground hover:text-primary transition-colors text-sm font-sans">
        {children}
      </Link>
    </div>
  );
}
