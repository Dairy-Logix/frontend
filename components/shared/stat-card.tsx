"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

export type StatCardTone = "primary" | "cyan" | "amber" | "emerald";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  tone?: StatCardTone;
  className?: string;
}

const TONE_CYCLE: StatCardTone[] = ["primary", "cyan", "amber", "emerald"];

const TONE_CLASSES: Record<
  StatCardTone,
  { ring: string; iconBg: string; text: string; sparkStroke: string }
> = {
  primary: {
    ring: "from-primary/30 to-primary/10",
    iconBg: "bg-gradient-primary text-primary-foreground",
    text: "text-gradient-primary",
    sparkStroke: "hsl(var(--primary))",
  },
  cyan: {
    ring: "from-cyan-500/30 to-blue-500/10",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500 text-white",
    text: "text-foreground",
    sparkStroke: "#0891b2",
  },
  amber: {
    ring: "from-amber-500/30 to-orange-500/10",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    text: "text-foreground",
    sparkStroke: "#f59e0b",
  },
  emerald: {
    ring: "from-emerald-500/30 to-teal-500/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
    text: "text-foreground",
    sparkStroke: "#10b981",
  },
};

// Stable, title-derived tone fallback so the same card always gets the
// same color across renders, and a row of 3–4 cards naturally varies.
function autoTone(title: string): StatCardTone {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return TONE_CYCLE[Math.abs(hash) % TONE_CYCLE.length];
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  sparklineData,
  tone,
  className,
}: StatCardProps) {
  const t = TONE_CLASSES[tone ?? autoTone(title)];
  const chartData = sparklineData?.map((v, i) => ({ i, v }));
  const sparkId = `spark-${title.replace(/\s/g, "")}`;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative glass rounded-xl p-4 overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl pointer-events-none bg-gradient-to-br",
          t.ring
        )}
      />

      <div className="relative flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "h-11 w-11 rounded-lg flex items-center justify-center shadow-md flex-shrink-0",
              t.iconBg
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </div>
          <div className={cn("text-lg font-bold truncate tabular-nums", t.text)}>
            {value}
          </div>
          {(description || trend) && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    trend.isPositive
                      ? "text-[var(--success)]"
                      : "text-[var(--destructive)]"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
              )}
              {description && <span className="truncate">{description}</span>}
            </div>
          )}
        </div>
      </div>

      {chartData && chartData.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[26px] opacity-50 pointer-events-none">
          <ResponsiveContainer width="100%" height={26}>
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.sparkStroke} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={t.sparkStroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={t.sparkStroke}
                fill={`url(#${sparkId})`}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
