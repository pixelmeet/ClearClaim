"use client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type ActivityItem = {
  id: string;
  user: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  description?: string;
  isAutoApproved?: boolean;
};

const iconMap: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  approve: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  reject: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  submit: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  auto: { icon: Zap, color: "text-primary", bg: "bg-primary/10" },
};

function activityType(a: ActivityItem): keyof typeof iconMap {
  const s = (a.status || "").toUpperCase();
  if (a.isAutoApproved) return "auto";
  if (s === "APPROVED") return "approve";
  if (s === "REJECTED") return "reject";
  return "submit";
}

function activityVerb(a: ActivityItem) {
  const s = (a.status || "").toUpperCase();
  if (a.isAutoApproved) return "auto-approved";
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "PENDING" || s === "SUBMITTED") return "submitted";
  return s.toLowerCase() || "updated";
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <motion.div
      className="glass-panel rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-display">Activity Feed</h3>
          <p className="text-xs text-muted-foreground mt-1">Recent audit trail</p>
        </div>
      </div>

      <div className="space-y-1">
        {activities.map((activity, index) => {
          const type = activityType(activity);
          const config = iconMap[type];
          const Icon = config.icon;
          const time = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

          return (
            <motion.div
              key={activity.id ?? index}
              className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0 group cursor-default"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.08 }}
            >
              <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activityVerb(activity)}</span>{" "}
                  <span className="font-semibold text-foreground">
                    {activity.currency} {Number(activity.amount ?? 0).toLocaleString()}
                  </span>
                </p>
                {activity.description ? (
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{activity.description}</p>
                ) : null}
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{time}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
