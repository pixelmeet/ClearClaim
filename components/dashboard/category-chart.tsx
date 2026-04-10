"use client";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export type CategoryPoint = { category: string; amount: number };

const COLORS = ["#6366F1", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#A3E635", "#F97316"];

function CustomTooltip({
  active,
  payload,
  currency,
}: { active?: boolean; payload?: { payload: { name: string; value: number; amount: number } }[]; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel-strong rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-bold text-foreground">{payload[0].payload.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currency} {Number(payload[0].payload.amount ?? 0).toLocaleString()} • {payload[0].payload.value}%
        </p>
      </div>
    );
  }
  return null;
}

export function CategoryChart({ data, currency }: { data: CategoryPoint[]; currency: string }) {
  const total = data.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const chartData = data
    .filter((d) => d.category)
    .slice(0, 8)
    .map((d, i) => {
      const pct = total > 0 ? Math.round((Number(d.amount) / total) * 100) : 0;
      return {
        name: d.category,
        value: pct,
        amount: Number(d.amount) || 0,
        color: COLORS[i % COLORS.length],
      };
    });

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground font-display">Expense Categories</h3>
        <p className="text-xs text-muted-foreground mt-1">Breakdown by category</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="h-48 w-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
