"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { HERO_CONTENT } from "@/constants/home/hero-constants";
import { Background } from "@/components/home/background";
import { ArrowRight, Play, IndianRupee, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useRef } from "react";

export function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-24 md:pt-28 lg:pt-32">
      <Background />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 py-16 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text Content */}
          <div className="flex flex-col items-start text-left max-w-2xl">
            {/* Trust badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-sm text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              {HERO_CONTENT.trustBadge}
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <span className="font-display font-bold leading-[1.1]">
                {HERO_CONTENT.headline.primary}
              </span>
              <span className="block font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mt-1 md:mt-2 animate-gradient">
                {HERO_CONTENT.headline.secondary}
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {HERO_CONTENT.description}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-12 w-full"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-hover text-white text-base py-6 px-8 font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 group"
                asChild
              >
                <Link href={HERO_CONTENT.ctas.primary.href}>
                  {HERO_CONTENT.ctas.primary.label}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground bg-transparent hover:bg-glass-bg backdrop-blur-sm text-base py-6 px-8 font-semibold rounded-xl transition-all duration-300 group"
                asChild
              >
                <Link href={HERO_CONTENT.ctas.secondary.href}>
                  <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  {HERO_CONTENT.ctas.secondary.label}
                </Link>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full"
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.1, delayChildren: 0.5 }}
            >
              {HERO_CONTENT.highlights.map((h, i) => {
                const Icon = h.icon;
                return (
                  <motion.div
                    key={i}
                    className="glass-panel rounded-xl p-4 text-center hover:glow-primary transition-all duration-500 group cursor-default"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 font-display">
                      {h.title}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {h.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right — 3D Floating Dashboard Mockup */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <FloatingDashboard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FloatingDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-8, 8]), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      className="perspective-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="preserve-3d relative"
        style={{ rotateX, rotateY }}
      >
        {/* Main dashboard card */}
        <div className="glass-panel-strong rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Topbar mock */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">CC</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">ClearClaim</div>
                <div className="text-[10px] text-muted-foreground">Finance Dashboard</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MiniKPI icon={IndianRupee} label="Total Spent" value="₹24,580" color="text-primary" bg="bg-primary/10" />
            <MiniKPI icon={Clock} label="Pending" value="12" color="text-warning" bg="bg-warning/10" />
            <MiniKPI icon={CheckCircle2} label="Approved" value="48" color="text-success" bg="bg-success/10" />
          </div>

          {/* Chart mock */}
          <div className="glass-panel rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Expense Trends</span>
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
            <div className="flex items-end gap-1 h-16">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + i * 0.05, ease: "easeOut" }}
                />
              ))}
            </div>
          </div>

          {/* Table mock */}
          <div className="glass-panel rounded-xl p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Recent Expenses</div>
            {[
              { name: "Flight to NYC", amount: "₹1,250", status: "approved" },
              { name: "Client Dinner", amount: "₹185", status: "pending" },
              { name: "Software Sub", amount: "₹49", status: "approved" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-xs text-foreground/80">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{item.amount}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    item.status === "approved" ? "status-approved" : "status-pending"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating accent cards */}
        <motion.div
          className="absolute -top-4 -right-6 glass-panel rounded-xl p-3 shadow-lg z-10"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-3 w-3 text-success" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Just approved</div>
              <div className="text-xs font-semibold text-foreground">₹2,450.00</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute -bottom-3 -left-4 glass-panel rounded-xl p-3 shadow-lg z-10"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">This month</div>
              <div className="text-xs font-semibold text-success">↓ 23% savings</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function MiniKPI({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`p-1 rounded-md ${bg}`}>
          <Icon className={`h-3 w-3 ${color}`} />
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
