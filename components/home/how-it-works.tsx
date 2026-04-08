"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { Receipt, GitBranch, UserCheck, Zap, ScrollText, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: Receipt,
    title: "Submit Your Expense",
    description: "Snap a receipt, fill in the details, and submit in seconds. Our OCR auto-extracts vendor, amount, and date — no manual data entry.",
    highlight: "30 seconds average submission time",
    color: "from-primary to-indigo-400",
  },
  {
    icon: GitBranch,
    title: "Smart Workflow Routing",
    description: "ClearClaim analyzes your company's approval chain and instantly routes the claim to the right manager — based on amount, department, and policy.",
    highlight: "Zero manual routing needed",
    color: "from-violet-500 to-accent",
  },
  {
    icon: UserCheck,
    title: "Manager Reviews & Approves",
    description: "Your manager gets a notification, reviews the expense with all context — receipt image, policy compliance status, and history — then approves with one click.",
    highlight: "Real-time push notifications",
    color: "from-accent to-pink-500",
  },
  {
    icon: Zap,
    title: "Auto-Rules Execute",
    description: "For recurring expenses below thresholds, ClearClaim can auto-approve. Set rules by percentage, specific approvers, or hybrid logic — your finance team stays in control.",
    highlight: "Configurable auto-approval rules",
    color: "from-amber-500 to-warning",
  },
  {
    icon: ScrollText,
    title: "Immutable Audit Trail",
    description: "Every approve, reject, comment, and auto-trigger is permanently logged with who, when, and why. Your compliance team will love the transparency.",
    highlight: "100% SOX-ready audit logs",
    color: "from-emerald-500 to-success",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);

  return (
    <section className="py-28 md:py-36 px-4 relative overflow-hidden" ref={containerRef}>
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Section Header — Storytelling intro */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-sm text-primary font-medium mb-5">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5">
            From submission to audit —{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              automated
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed mb-3">
            Imagine never chasing an approval again. Here&apos;s the journey every expense takes through ClearClaim — in five effortless steps.
          </p>
        </motion.div>

        {/* "Story so far" intro pill */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-panel-strong text-sm">
            <div className="flex -space-x-1.5">
              {["bg-primary", "bg-accent", "bg-success", "bg-warning", "bg-chart-5"].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${c} ring-2 ring-background`} />
              ))}
            </div>
            <span className="text-muted-foreground">Five steps</span>
            <span className="text-foreground/30">·</span>
            <span className="text-muted-foreground">Zero manual routing</span>
            <span className="text-foreground/30">·</span>
            <span className="text-muted-foreground">Complete visibility</span>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto relative">
          {/* Animated connector line */}
          <div className="absolute left-7 md:left-10 top-0 bottom-0 w-px bg-border/20">
            <motion.div
              className="w-full bg-gradient-to-b from-primary via-accent to-success"
              style={{ height: lineHeight }}
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={index}
                className="relative flex gap-6 md:gap-10 mb-12 last:mb-0 group"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-80px" }}
              >
                {/* Step Indicator */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    className="w-14 h-14 md:w-20 md:h-20 rounded-2xl glass-panel-strong flex items-center justify-center cursor-default relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Gradient bg on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                  </motion.div>
                  {/* Step number badge */}
                  <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br ${step.color} text-white text-[11px] font-bold flex items-center justify-center shadow-lg`}>
                    {index + 1}
                  </div>
                </div>

                {/* Content Card */}
                <div className="glass-panel rounded-2xl p-6 md:p-7 flex-1 group-hover:glow-primary transition-all duration-500 cursor-default relative overflow-hidden">
                  {/* Subtle gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2.5 font-display group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Highlight pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">{step.highlight}</span>
                    </div>
                  </div>
                </div>

                {/* Connection arrow hint */}
                {!isLast && (
                  <motion.div
                    className="absolute left-7 md:left-10 -bottom-6 text-primary/20"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-3 w-3 rotate-90" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA teaser */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground/60 text-sm">
            That&apos;s it. Five steps from chaos to clarity. →{" "}
            <a href="/signup" className="text-primary font-medium hover:underline">Start your free trial</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
