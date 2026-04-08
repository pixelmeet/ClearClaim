"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "@/components/home/hero";
import { TrustLogos } from "@/components/home/trust-logos";
import { Features } from "@/components/home/features";
import { HowItWorks } from "@/components/home/how-it-works";
import { DashboardPreview } from "@/components/home/dashboard-preview";
import { Testimonials } from "@/components/home/testimonials";
import { CTA } from "@/components/home/cta";
import { FAQ } from "@/components/home/faq";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <AnimatePresence mode="sync">
      <Navbar />
      <motion.main
        key="content"
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        <Hero />
        <TrustLogos />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <Testimonials />
        <CTA />
        <FAQ />
        <Footer />
      </motion.main>
    </AnimatePresence>
  );
}
