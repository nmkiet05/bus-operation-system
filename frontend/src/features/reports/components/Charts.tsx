"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { ReportSeries } from "../types";

interface ChartProps {
  data: ReportSeries[];
  loading?: boolean;
  title: string;
}

const compactCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatDateLabel = (value: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(d);
};

export function RevenueChart({ data, loading, title }: ChartProps) {
  if (loading) {
    return (
      <Card className="p-4 md:p-5 border-border overflow-hidden">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-[320px] bg-slate-100 rounded animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 md:p-5 border-border overflow-hidden">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-[320px] flex items-center justify-center text-muted-foreground">
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: item.reportDate,
    grossRevenue: item.grossRevenue || 0,
    netRevenue: item.netRevenue || 0,
    avgTicketPrice: item.avgTicketPrice || 0,
  }));

  return (
    <Card className="p-4 md:p-5 border-border overflow-hidden">
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <div className="w-full min-h-[360px]">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            tickFormatter={formatDateLabel}
            minTickGap={20}
            interval="preserveStartEnd"
          />
          <YAxis
            width={72}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            tickFormatter={compactCurrency}
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(value)
            }
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
            labelFormatter={(label) => `Ngày: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="netRevenue"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: "#0ea5e9", r: 4 }}
            activeDot={{ r: 6 }}
            name="Doanh Thu Ròng"
          />
          <Line
            type="monotone"
            dataKey="grossRevenue"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 4 }}
            activeDot={{ r: 6 }}
            name="Doanh thu gộp"
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function LoadFactorChart({ data, loading, title }: ChartProps) {
  if (loading) {
    return (
      <Card className="p-4 md:p-5 border-border overflow-hidden">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-[320px] bg-slate-100 rounded animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 md:p-5 border-border overflow-hidden">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-[320px] flex items-center justify-center text-muted-foreground">
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: item.reportDate,
    loadFactor: item.loadFactorPercentage || 0,
    sold: item.soldSeats || 0,
    totalSeats: item.totalSeats || 0,
  }));

  return (
    <Card className="p-4 md:p-5 border-border overflow-hidden">
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <div className="w-full min-h-[360px]">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            tickFormatter={formatDateLabel}
            minTickGap={20}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            width={56}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            width={56}
            tick={{ fontSize: 11 }}
            stroke="#0ea5e9"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
            labelFormatter={(label) => `Ngày: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar
            yAxisId="left"
            dataKey="sold"
            fill="#0ea5e9"
            name="Ghế đã bán"
            opacity={0.7}
          />
          <Bar
            yAxisId="left"
            dataKey="totalSeats"
            fill="#e5e7eb"
            name="Tổng số ghế"
            opacity={0.7}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="loadFactor"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Hệ số lấp đầy (%)"
            dot={{ fill: "#f59e0b", r: 4 }}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </Card>
  );
}
