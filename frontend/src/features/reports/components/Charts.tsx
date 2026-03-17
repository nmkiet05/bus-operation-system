"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { ReportSeries } from "../types";

interface ChartProps {
  data: ReportSeries[];
  loading?: boolean;
  title: string;
}

export function RevenueChart({ data, loading, title }: ChartProps) {
  if (loading) {
    return (
      <Card className="p-4 border-border">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-80 bg-slate-100 rounded animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 border-border">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
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
    <Card className="p-4 border-border">
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: "Doanh Thu (VND Triệu)", angle: -90, position: "insideLeft" }}
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
          />
          <Legend />
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
            name="Doanh Thu Bạn Sơ"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function LoadFactorChart({ data, loading, title }: ChartProps) {
  if (loading) {
    return (
      <Card className="p-4 border-border">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-80 bg-slate-100 rounded animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 border-border">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: item.reportDate,
    loadFactor: item.loadFactorPercentage || 0,
    sold: item.soldSeats || 0,
    available: item.availableSeats || 0,
  }));

  return (
    <Card className="p-4 border-border">
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: "Ghế", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#0ea5e9"
            label={{ value: "Hệ Số (%) ", angle: 90, position: "insideRight" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="sold"
            fill="#0ea5e9"
            name="Ghế Bán"
            opacity={0.7}
          />
          <Bar
            yAxisId="left"
            dataKey="available"
            fill="#e5e7eb"
            name="Ghế Khả Dụng"
            opacity={0.7}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="loadFactor"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Hệ Số Load (%)"
            dot={{ fill: "#f59e0b", r: 4 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
