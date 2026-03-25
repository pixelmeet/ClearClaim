"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=100"); // Load more for full page
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else {
        toast.error("Failed to fetch notifications");
      }
    } catch {
      toast.error("Error loading notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notif._id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch {
        // Silently fail if mark as read fails on navigate
      }
    }
    
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "ERROR":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8 p-4 md:p-8 lg:px-10 max-w-5xl mx-auto min-h-[calc(100vh-4rem)]">
      {/* Soft Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen" />
      </div>

      {/* Header */}
      <div className="opacity-0 animate-fade-in-up flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-display font-semibold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            Notifications
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Stay updated with your latest expense and system alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="shrink-0 shadow-sm border-primary/20 hover:border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="opacity-0 animate-fade-in-up delay-200">
        <Card className="border-card-border bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden rounded-[24px]">
          <div className="p-4 md:p-6 pb-0 flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="flex gap-2">
                <div className="px-3 py-1 rounded-full bg-muted/50 text-sm font-medium">
                    All <span className="ml-1 text-muted-foreground">{notifications.length}</span>
                </div>
                {unreadCount > 0 && (
                   <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-pulse duration-1000 origin-center">
                       Unread <span className="ml-1">{unreadCount}</span>
                   </div>
                )}
            </div>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="flex gap-2 mb-4">
                    <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-3 w-3 bg-primary rounded-full animate-bounce"></div>
                </div>
                <p className="text-muted-foreground font-medium">Loading history...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 ring-8 ring-background/50">
                  <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">You&apos;re all caught up</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  We&apos;ll notify you when there&apos;s activity requiring your attention or updates to your expenses.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/50">
                {notifications.map((notif, i) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "group p-4 md:p-6 transition-all duration-300 hover:bg-muted/30 relative",
                      !notif.isRead ? "bg-primary/5" : "bg-transparent",
                      notif.link ? "cursor-pointer" : "cursor-default"
                    )}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Unread Indicator Bar */}
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)] rounded-r" />
                    )}

                    <div className="flex gap-4 md:gap-6 items-start">
                      <div className={cn(
                          "shrink-0 p-3 rounded-2xl shadow-sm border border-border/50 transition-transform duration-300 group-hover:scale-110",
                          !notif.isRead ? "bg-background" : "bg-card"
                      )}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 mb-2">
                            <h4 className={cn(
                                "text-lg font-semibold truncate",
                                !notif.isRead ? "text-foreground" : "text-foreground/80"
                            )}>
                                {notif.title}
                            </h4>
                            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap shrink-0 sm:mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className={cn(
                            "text-base leading-relaxed max-w-3xl",
                            !notif.isRead ? "text-foreground/90 font-medium" : "text-muted-foreground"
                        )}>
                            {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
