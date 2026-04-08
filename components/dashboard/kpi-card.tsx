"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserCog,
  Building,
  ShieldAlert,
  DollarSign,
  Clock,
  CheckCircle2,
} from "lucide-react";

const iconMap = {
  users: Users,
  userCog: UserCog,
  building: Building,
  shieldAlert: ShieldAlert,
  dollarSign: DollarSign,
  clock: Clock,
  checkCircle2: CheckCircle2,
} as const;

interface KPICardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof iconMap;
  trend?: string | null;
  trendPositive?: boolean;
  colorClass?: string;
  bgClass?: string;
  index?: number;
}

export function KPICard({
  title,
  value,
  iconName,
  trend,
  trendPositive = true,
  colorClass = "text-primary",
  bgClass = "bg-primary/10",
  index = 0,
}: KPICardProps) {
  const Icon = iconMap[iconName];

  return (
    <motion.div
      className="glass-panel relative overflow-hidden rounded-2xl p-6 group cursor-default floating-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      {/* Glow on hover */}
      <div className={cn(
        "absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700",
        bgClass.replace("/10", "")
      )} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
            bgClass,
            colorClass
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <motion.div
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground tabular-nums"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: (index + 2) * 0.12 }}
          >
            {value}
          </motion.div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              trendPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}>
              {trendPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
