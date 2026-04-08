"use client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

const activities = [
  { user: "Sarah Chen", action: "approved", amount: "$2,450", time: "2 min ago", type: "approve" },
  { user: "Mike Johnson", action: "submitted", amount: "$890", time: "15 min ago", type: "submit" },
  { user: "System", action: "auto-approved", amount: "$49", time: "1 hour ago", type: "auto" },
  { user: "Lisa Wang", action: "rejected", amount: "$3,200", time: "2 hours ago", type: "reject" },
  { user: "John Davis", action: "approved", amount: "$1,100", time: "3 hours ago", type: "approve" },
  { user: "Emily Park", action: "submitted", amount: "$670", time: "5 hours ago", type: "submit" },
];

const iconMap: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  approve: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  reject: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  submit: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  auto: { icon: Zap, color: "text-primary", bg: "bg-primary/10" },
};

export function ActivityFeed() {
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
          const config = iconMap[activity.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
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
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-semibold text-foreground">{activity.amount}</span>
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{activity.time}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
