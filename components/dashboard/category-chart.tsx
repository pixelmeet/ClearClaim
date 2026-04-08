"use client";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Travel", value: 42, color: "#6366F1" },
  { name: "Software", value: 28, color: "#8B5CF6" },
  { name: "Meals", value: 18, color: "#22C55E" },
  { name: "Office", value: 8, color: "#F59E0B" },
  { name: "Other", value: 4, color: "#EF4444" },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number } }[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel-strong rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-bold text-foreground">
          {payload[0].payload.name}: {payload[0].payload.value}%
        </p>
      </div>
    );
  }
  return null;
}

export function CategoryChart() {
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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full space-y-3">
          {data.map((item) => (
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
