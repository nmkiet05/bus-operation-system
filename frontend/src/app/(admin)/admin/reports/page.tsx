"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, DollarSign, Gauge } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ReportFilterPanel,
  MetricCard,
  RevenueChart,
  LoadFactorChart,
  BreakdownTable,
} from "@/features/reports/components";
import { reportService } from "@/features/reports/services/report-service";
import { ReportFilter } from "@/features/reports/types";
import { format, subDays } from "date-fns";

/**
 * Business Reports Dashboard - Báo cáo Kinh Doanh
 * Displays Revenue & Load Factor insights with seat-class breakdown
 */
export default function ReportsPage() {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  // Initial filter state
  const initialFilter: ReportFilter = {
    fromDate: format(thirtyDaysAgo, "yyyy-MM-dd"),
    toDate: format(today, "yyyy-MM-dd"),
    granularity: "day",
  };

  const [queryFilter, setQueryFilter] = useState(initialFilter);
  const [view, setView] = useState<"overview" | "revenue" | "loadfactor">("overview");

  // Revenue Report Query
  const {
    data: revenueReport,
    isLoading: isLoadingRevenue,
    error: revenueError,
  } = useQuery({
    queryKey: ["revenue-report", queryFilter],
    queryFn: () => reportService.getRevenueReport(queryFilter),
    enabled: !!queryFilter,
    retry: 2,
  });

  // Load Factor Report Query
  const {
    data: loadFactorReport,
    isLoading: isLoadingLoadFactor,
    error: loadFactorError,
  } = useQuery({
    queryKey: ["load-factor-report", queryFilter],
    queryFn: () => reportService.getLoadFactorReport(queryFilter),
    enabled: !!queryFilter,
    retry: 2,
  });

  // Format currency
  const formatCurrency = (amount?: number) => {
    const safeAmount = Number(amount || 0);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  // Format number
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat("vi-VN").format(Math.round(num));
  };

  const isLoading = isLoadingRevenue || isLoadingLoadFactor;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">Báo Cáo Kinh Doanh</h1>
        <p className="text-muted-foreground">
          Theo dõi doanh thu, hệ số load và hiệu suất hoạt động của các chuyến xe
        </p>
      </div>

      {/* Non-linear view switch */}
      <div className="rounded-lg border border-border bg-card p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            type="button"
            variant={view === "overview" ? "default" : "outline"}
            onClick={() => setView("overview")}
            className={view === "overview" ? "bg-brand-blue hover:bg-brand-blue/90" : ""}
          >
            Tổng Quan
          </Button>
          <Button
            type="button"
            variant={view === "revenue" ? "default" : "outline"}
            onClick={() => setView("revenue")}
            className={view === "revenue" ? "bg-brand-blue hover:bg-brand-blue/90" : ""}
          >
            Doanh Thu
          </Button>
          <Button
            type="button"
            variant={view === "loadfactor" ? "default" : "outline"}
            onClick={() => setView("loadfactor")}
            className={view === "loadfactor" ? "bg-brand-blue hover:bg-brand-blue/90" : ""}
          >
            Hệ Số Load
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <ReportFilterPanel
        onFilterChange={setQueryFilter}
        isLoading={isLoading}
      />

      {/* Error Alerts */}
      {revenueError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lỗi tải báo cáo doanh thu. Vui lòng thử lại.
          </AlertDescription>
        </Alert>
      )}

      {loadFactorError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lỗi tải báo cáo hệ số load. Vui lòng thử lại.
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Section */}
      {(view === "overview" || view === "revenue") && (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-brand-blue" />
            Báo Cáo Doanh Thu
          </h2>
          <p className="text-sm text-muted-foreground">
            Tổng quan doanh thu bạn sơ, doanh thu ròng, giá trung bình vé
          </p>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Doanh Thu Ròng"
            value={formatCurrency(revenueReport?.summary.netRevenue)}
            color="blue"
            icon={<DollarSign className="h-6 w-6" />}
            loading={isLoadingRevenue}
          />
          <MetricCard
            label="Doanh Thu Bạn Sơ"
            value={formatCurrency(revenueReport?.summary.grossRevenue)}
            color="orange"
            icon={<DollarSign className="h-6 w-6" />}
            loading={isLoadingRevenue}
          />
          <MetricCard
            label="Vé Đã Bán"
            value={formatNumber(revenueReport?.summary.soldSeats)}
            unit="vé"
            color="green"
            loading={isLoadingRevenue}
          />
          <MetricCard
            label="Giá Trung Bình"
            value={formatCurrency(revenueReport?.summary.avgTicketPrice)}
            color="purple"
            loading={isLoadingRevenue}
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart
          data={revenueReport?.series || []}
          loading={isLoadingRevenue}
          title="Biểu Đồ Doanh Thu (Theo Ngày)"
        />

        {/* Revenue Breakdown */}
        <BreakdownTable
          data={revenueReport?.breakdown || []}
          loading={isLoadingRevenue}
          title="Chi Tiết Doanh Thu theo Loại Ghế"
          type="revenue"
        />
      </div>
      )}

      {/* Load Factor Section */}
      {(view === "overview" || view === "loadfactor") && (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Gauge className="h-6 w-6 text-brand-accent" />
            Báo Cáo Hệ Số Load (Tỷ Lệ Lấp Đầy)
          </h2>
          <p className="text-sm text-muted-foreground">
            Tỷ lệ ghế được bán trên tổng ghế khả dụng, giúp đánh giá hiệu suất sử dụng chuyến xe
          </p>
        </div>

        {/* Load Factor Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Hệ Số Load Bình Quân"
            value={`${(loadFactorReport?.summary.loadFactorPercentage ?? 0).toFixed(2)}`}
            unit="%"
            color="blue"
            icon={<Gauge className="h-6 w-6" />}
            loading={isLoadingLoadFactor}
          />
          <MetricCard
            label="Ghế Bán"
            value={formatNumber(loadFactorReport?.summary.soldSeats)}
            unit="ghế"
            color="green"
            loading={isLoadingLoadFactor}
          />
          <MetricCard
            label="Ghế Khả Dụng"
            value={formatNumber(loadFactorReport?.summary.availableSeats)}
            unit="ghế"
            color="orange"
            loading={isLoadingLoadFactor}
          />
          <MetricCard
            label="Ghế Trống"
            value={formatNumber(loadFactorReport?.summary.emptySeats)}
            unit="ghế"
            color="red"
            loading={isLoadingLoadFactor}
          />
        </div>

        {/* Load Factor Chart */}
        <LoadFactorChart
          data={loadFactorReport?.series || []}
          loading={isLoadingLoadFactor}
          title="Biểu Đồ Hệ Số Load (Ghế Bán vs Khả Dụng)"
        />

        {/* Load Factor Breakdown */}
        <BreakdownTable
          data={loadFactorReport?.breakdown || []}
          loading={isLoadingLoadFactor}
          title="Chi Tiết Hệ Số Load theo Loại Ghế"
          type="loadfactor"
        />
      </div>
      )}

      {/* Footer Info */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold">Lưu ý:</span> Báo cáo được cập nhật hàng giờ. Dữ liệu bao gồm
          tất cả các chuyến xe và vé có trạng thái CONFIRMED. Để xem chi tiết, vui lòng chọn khoảng
          thời gian và chọn bộ lọc phù hợp.
        </p>
      </div>
    </div>
  );
}
