"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ReportBreakdown } from "../types";

interface BreakdownTableProps {
  data: ReportBreakdown[];
  loading?: boolean;
  title: string;
  type: "revenue" | "loadfactor";
}

const formatCurrency = (amount?: number) => {
  const safeAmount = Number(amount || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(safeAmount);
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(2)}%`;
};

type AggregatedBreakdown = {
  busTypeName: string;
  grossRevenue: number;
  netRevenue: number;
  soldSeats: number;
  totalSeats: number;
  avgTicketPrice: number;
  loadFactorPercentage: number;
};

export function BreakdownTable({ data, loading, title, type }: BreakdownTableProps) {
  const aggregatedData: AggregatedBreakdown[] = (data || []).map((row) => ({
    busTypeName: row.busTypeName || row.busTypeId || "N/A",
    grossRevenue: Number(row.grossRevenue || 0),
    netRevenue: Number(row.netRevenue || 0),
    soldSeats: Number(row.soldSeats || 0),
    totalSeats: Number(row.totalSeats || 0),
    avgTicketPrice: Number(row.avgTicketPrice || 0),
    loadFactorPercentage: Number(row.loadFactorPercentage || 0),
  }));

  if (loading) {
    return (
      <Card className="p-4 md:p-5 border-border">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!aggregatedData || aggregatedData.length === 0) {
    return (
      <Card className="p-4 md:p-5 border-border">
        <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-center py-8">Không có dữ liệu</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-5 border-border">
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Loại xe</TableHead>
            {type === "revenue" ? (
              <>
                <TableHead className="text-right">Doanh thu gộp</TableHead>
                <TableHead className="text-right">Doanh thu thuần</TableHead>
                <TableHead className="text-right">Vé đã bán</TableHead>
                <TableHead className="text-right">Giá vé trung bình</TableHead>
                <TableHead className="text-right">Doanh thu thuần/vé</TableHead>
              </>
            ) : (
              <>
                <TableHead className="text-right">Hệ số lấp đầy (%)</TableHead>
                <TableHead className="text-right">Vé đã bán</TableHead>
                <TableHead className="text-right">Tổng số ghế</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregatedData.map((row, idx) => (
            <TableRow key={`${row.busTypeName}-${idx}`} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {row.busTypeName}
              </TableCell>
              {type === "revenue" ? (
                <>
                  <TableCell className="text-right">
                    {formatCurrency(row.grossRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.netRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.soldSeats || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.avgTicketPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency((row.netRevenue || 0) / Math.max(1, row.soldSeats || 0))}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-right font-bold text-brand-blue">
                    {formatPercent(row.loadFactorPercentage)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.soldSeats || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalSeats || 0}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </Card>
  );
}
