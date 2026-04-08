"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  DollarSign, Clock, CheckCircle2, XCircle,
  TrendingUp, Users, PieChart, ArrowUpRight,
} from "lucide-react";

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-400, 400], [5, -5]), { stiffness: 80, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-400, 400], [-5, 5]), { stiffness: 80, damping: 30 });

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
    <section className="py-24 md:py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-sm text-primary font-medium mb-4">
            Dashboard Preview
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5">
            Your financial command center
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Role-specific dashboards with live data, expense trends, and approval queues.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="perspective-container max-w-5xl mx-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="preserve-3d"
            style={{ rotateX, rotateY }}
          >
            <div className="glass-panel-strong rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              {/* Noise */}
              <div className="absolute inset-0 noise-overlay opacity-20 rounded-2xl" />

              {/* Dashboard mockup */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground font-display">Finance Overview</h3>
                    <p className="text-xs text-muted-foreground">Q4 2025 • Last updated just now</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 rounded-lg glass-panel text-xs font-medium text-primary">Monthly</div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:glass-panel transition-all cursor-pointer">Quarterly</div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <PreviewKPI icon={DollarSign} label="Total Expenses" value="$148,250" change="+12.5%" positive color="primary" />
                  <PreviewKPI icon={Clock} label="Pending" value="23" change="-8%" positive color="warning" />
                  <PreviewKPI icon={CheckCircle2} label="Approved" value="142" change="+24%" positive color="success" />
                  <PreviewKPI icon={XCircle} label="Rejected" value="7" change="-45%" positive color="destructive" />
                </div>

                {/* Charts + Table */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Chart */}
                  <div className="md:col-span-2 glass-panel rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-foreground">Expense Trends</span>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex items-end gap-[3px] h-32">
                      {[35, 52, 40, 68, 42, 75, 55, 88, 62, 95, 72, 80, 65, 90, 78, 85, 70, 92, 82, 88, 75, 95, 85, 90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            background: `linear-gradient(to top, rgba(99,102,241,0.3), rgba(99,102,241,0.8))`,
                          }}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 0.6, delay: i * 0.03 }}
                          viewport={{ once: true }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="glass-panel rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-foreground">Categories</span>
                      <PieChart className="h-4 w-4 text-accent" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Travel", pct: 42, color: "bg-primary" },
                        { label: "Software", pct: 28, color: "bg-accent" },
                        { label: "Meals", pct: 18, color: "bg-success" },
                        { label: "Other", pct: 12, color: "bg-warning" },
                      ].map((cat) => (
                        <div key={cat.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{cat.label}</span>
                            <span className="text-foreground font-medium">{cat.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${cat.color}`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${cat.pct}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                              viewport={{ once: true }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Approval Queue Preview */}
                <div className="glass-panel rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Approval Queue</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Sarah Chen", amount: "$2,450", dept: "Engineering", status: "pending" },
                      { name: "Mike Johnson", amount: "$890", dept: "Marketing", status: "pending" },
                      { name: "Lisa Wang", amount: "$1,200", dept: "Sales", status: "pending" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-[10px] font-bold text-foreground">
                            {item.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground">{item.dept}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-foreground">{item.amount}</span>
                          <span className="status-pending text-[10px] px-2 py-0.5 rounded-full">Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PreviewKPI({ icon: Icon, label, value, change, positive, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    warning: { bg: "bg-warning/10", text: "text-warning" },
    success: { bg: "bg-success/10", text: "text-success" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive" },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-panel rounded-xl p-4 group hover:glow-primary transition-all duration-500 cursor-default">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`p-1.5 rounded-lg ${c.bg}`}>
          <Icon className={`h-3 w-3 ${c.text}`} />
        </div>
      </div>
      <div className="text-lg md:text-xl font-bold text-foreground mb-1">{value}</div>
      <div className="flex items-center gap-1">
        <ArrowUpRight className={`h-3 w-3 ${positive ? "text-success" : "text-destructive"}`} />
        <span className={`text-[10px] font-medium ${positive ? "text-success" : "text-destructive"}`}>{change}</span>
      </div>
    </div>
  );
}
