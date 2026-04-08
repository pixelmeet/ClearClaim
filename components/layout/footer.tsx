"use client";
import Link from "next/link";
import { MapPin, Mail } from "lucide-react";
import { footerConfig } from "@/constants/layout/footer-constants";

export function Footer() {
  const { companyName, tagline, socialLinks, sections, contactInfo, legal } =
    footerConfig;

  return (
    <footer className="relative overflow-hidden border-t border-border/50 py-20 md:py-24">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-accent/3 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16 md:mb-20">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-6 font-display text-2xl tracking-tighter">
              <span className="text-foreground font-bold">
                {companyName.primary}
              </span>
              <span className="text-primary font-bold">
                {companyName.secondary}
              </span>
            </div>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-sm">
              {tagline}
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg glass-panel flex items-center justify-center text-muted-foreground hover:text-primary hover:glow-primary transition-all duration-300"
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-foreground font-semibold text-sm mb-6 tracking-wide uppercase font-display">
                {section.title}
              </h3>
              <div className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="text-foreground font-semibold text-sm mb-6 tracking-wide uppercase font-display">
              Get in Touch
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg glass-panel text-primary flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-muted-foreground text-sm leading-relaxed">
                  {contactInfo.address.line1}
                  <br />
                  {contactInfo.address.line2}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg glass-panel text-primary flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-muted-foreground text-sm">{contactInfo.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground/60 text-xs font-medium">
            &copy; {new Date().getFullYear()} {legal.copyrightText}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60 font-medium">
            {legal.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
