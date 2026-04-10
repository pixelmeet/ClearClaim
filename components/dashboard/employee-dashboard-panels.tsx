"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ExpenseChart, type MonthlyPoint, type WeeklyPoint } from "@/components/dashboard/expense-chart";
import { CategoryChart, type CategoryPoint } from "@/components/dashboard/category-chart";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/dashboard/skeleton-loader";

type EmployeeDashboardResponse = {
  total: number;
  approved: number;
  pending: number;
  companyCurrency: string;
  monthlyData: MonthlyPoint[];
  weeklyData: WeeklyPoint[];
  categoryData: CategoryPoint[];
  activities: ActivityItem[];
};

const EXPENSES_CHANGED_KEY = "clearclaim:expenses:changed:v1";

export function EmployeeDashboardPanels() {
  const [data, setData] = useState<EmployeeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/employee", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "Failed to load dashboard");
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === EXPENSES_CHANGED_KEY) load();
    };
    window.addEventListener("clearclaim:expenses:changed", onRefresh as any);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("clearclaim:expenses:changed", onRefresh as any);
      window.removeEventListener("storage", onStorage);
    };
  }, [load]);

  const currency = data?.companyCurrency ?? "INR";

  const kpiCards = useMemo(() => {
    return [
      {
        title: "Total Expenses",
        value: `${currency} ${(data?.total ?? 0).toLocaleString()}`,
        iconName: "dollarSign" as const,
        colorClass: "text-primary",
        bgClass: "bg-primary/10",
      },
      {
        title: "Pending Amount",
        value: `${currency} ${(data?.pending ?? 0).toLocaleString()}`,
        iconName: "clock" as const,
        colorClass: "text-warning",
        bgClass: "bg-warning/10",
      },
      {
        title: "Approved Amount",
        value: `${currency} ${(data?.approved ?? 0).toLocaleString()}`,
        iconName: "checkCircle2" as const,
        colorClass: "text-success",
        bgClass: "bg-success/10",
      },
    ];
  }, [currency, data?.approved, data?.pending, data?.total]);

  if (loading) {
    return (
      <>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonChart />
          </div>
          <div>
            <SkeletonChart />
          </div>
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2" />
          <div>
            <SkeletonTable />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-destructive/20 bg-destructive/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Unable to load dashboard</div>
              <div className="text-sm text-muted-foreground mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-border/40 bg-background/40 hover:bg-background/60 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((stat, index) => (
          <KPICard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            iconName={stat.iconName}
            colorClass={stat.colorClass}
            bgClass={stat.bgClass}
            trend={null}
            trendPositive={true}
            index={index}
          />
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseChart
            monthlyData={data?.monthlyData ?? []}
            weeklyData={data?.weeklyData ?? []}
            currency={currency}
          />
        </div>
        <div>
          <CategoryChart data={data?.categoryData ?? []} currency={currency} />
        </div>
      </div>

      <div>
        <ActivityFeed activities={data?.activities ?? []} />
      </div>
    </>
  );
}

