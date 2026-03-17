"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
  loading?: boolean;
}

const colorClasses = {
  blue: "text-brand-blue border-brand-blue/20 bg-brand-blue/5",
  green: "text-emerald-600 border-emerald-200 bg-emerald-50",
  orange: "text-brand-accent border-brand-accent/20 bg-brand-accent/5",
  red: "text-red-600 border-red-200 bg-red-50",
  purple: "text-purple-600 border-purple-200 bg-purple-50",
};

export function MetricCard({
  label,
  value,
  unit,
  icon,
  trend,
  trendValue,
  color = "blue",
  loading = false,
}: MetricCardProps) {
  return (
    <Card className={cn("p-4 border-2 transition-all hover:shadow-md", colorClasses[color])}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          </div>
          {icon && <div className="text-2xl opacity-50">{icon}</div>}
        </div>

        {/* Value */}
        <div>
          {loading ? (
            <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-3xl font-bold text-foreground">
              {value}
              {unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
            </p>
          )}
        </div>

        {/* Trend */}
        {trendValue && (
          <div className="flex items-center gap-1 text-sm">
            {trend === "up" && (
              <>
                <ArrowUp className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600 font-medium">{trendValue}</span>
              </>
            )}
            {trend === "down" && (
              <>
                <ArrowDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{trendValue}</span>
              </>
            )}
            {trend === "neutral" && (
              <span className="text-muted-foreground">{trendValue}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
