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

export function BreakdownTable({ data, loading, title, type }: BreakdownTableProps) {
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

  if (!data || data.length === 0) {
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
            <TableHead className="font-semibold">Loại Ghế</TableHead>
            {type === "revenue" ? (
              <>
                <TableHead className="text-right">Doanh Thu Bạn Sơ</TableHead>
                <TableHead className="text-right">Doanh Thu Ròng</TableHead>
                <TableHead className="text-right">Ghế Bán</TableHead>
                <TableHead className="text-right">Giá Trung Bình</TableHead>
                <TableHead className="text-right">Doanh Thu/Ghế Khả Dụng</TableHead>
              </>
            ) : (
              <>
                <TableHead className="text-right">Hệ Số Load (%)</TableHead>
                <TableHead className="text-right">Ghế Bán</TableHead>
                <TableHead className="text-right">Ghế Khả Dụng</TableHead>
                <TableHead className="text-right">Ghế Trống</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {row.seatClass || "Tất cả"}
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
                    {formatCurrency(row.revenuePerCapacitySeat)}
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
                    {row.availableSeats || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.emptySeats || 0}
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
