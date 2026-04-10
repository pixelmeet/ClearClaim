"use client";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export type MonthlyPoint = { month: string; amount: number };

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: { active?: boolean; payload?: { value: number }[]; label?: string; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel-strong rounded-lg px-4 py-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">
          {currency} {Number(payload[0].value ?? 0).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
}

export function ExpenseChart({ data, currency }: { data: MonthlyPoint[]; currency: string }) {
  return (
    <motion.div
      className="glass-panel rounded-2xl p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-display">Expense Trends</h3>
          <p className="text-xs text-muted-foreground mt-1">Monthly spend over the last 12 months</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-lg glass-panel text-xs font-medium text-primary cursor-pointer">Monthly</span>
          <span className="px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Weekly</span>
        </div>
      </div>

      <div className="h-48 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v) => `${currency}${(Number(v) / 1000).toFixed(0)}k`}
              width={60}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#6366F1', stroke: '#0B0F1A', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
