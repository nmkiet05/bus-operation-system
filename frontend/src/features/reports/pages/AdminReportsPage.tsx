"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, DollarSign, Gauge } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReportFilterPanel,
  MetricCard,
  RevenueChart,
  LoadFactorChart,
  BreakdownTable,
} from "@/features/reports/components";
import { reportService } from "@/features/reports/services/report-service";
import { ReportFilter } from "@/features/reports/types";
import { format } from "date-fns";

export default function AdminReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();
  const FILTER_STORAGE_KEY = "admin_reports_filter_v1";

  const fallbackFilter: ReportFilter = {
    fromDate: format(today, "yyyy-MM-dd"),
    toDate: format(today, "yyyy-MM-dd"),
    granularity: "day",
  };

  const parseFilterFromParams = (): ReportFilter | null => {
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const granularity = searchParams.get("granularity") as "day" | "week" | "month" | null;
    const busTypeId = searchParams.get("busTypeId") || undefined;

    if (!fromDate || !toDate || !granularity) {
      return null;
    }

    if (!["day", "week", "month"].includes(granularity)) {
      return null;
    }

    return {
      fromDate,
      toDate,
      granularity,
      busTypeId,
    };
  };

  const parseFilterFromStorage = (): ReportFilter | null => {
    try {
      const raw = window.sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ReportFilter;
      if (!parsed?.fromDate || !parsed?.toDate || !parsed?.granularity) {
        return null;
      }
      if (!["day", "week", "month"].includes(parsed.granularity)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const initialFilter = useMemo<ReportFilter>(() => {
    return parseFilterFromParams() || fallbackFilter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [queryFilter, setQueryFilter] = useState(initialFilter);
  const [view, setView] = useState<"overview" | "revenue" | "loadfactor">("overview");

  useEffect(() => {
    const fromUrl = parseFilterFromParams();
    if (fromUrl) {
      setQueryFilter(fromUrl);
      return;
    }

    const fromStorage = parseFilterFromStorage();
    if (fromStorage) {
      setQueryFilter(fromStorage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("fromDate", queryFilter.fromDate);
    params.set("toDate", queryFilter.toDate);
    params.set("granularity", queryFilter.granularity);

    if (queryFilter.busTypeId) {
      params.set("busTypeId", queryFilter.busTypeId);
    } else {
      params.delete("busTypeId");
    }

    router.replace(`/admin?${params.toString()}`, { scroll: false });

    try {
      window.sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(queryFilter));
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, [queryFilter, router]);

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

  const formatCurrency = (amount?: number) => {
    const safeAmount = Number(amount || 0);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat("vi-VN").format(Math.round(num));
  };

  const isLoading = isLoadingRevenue || isLoadingLoadFactor;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">Báo cáo vận hành kinh doanh</h1>
        <p className="text-muted-foreground">
          Theo dõi doanh thu, hệ số lấp đầy và hiệu quả khai thác chuyến xe theo thời gian
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            type="button"
            variant={view === "overview" ? "default" : "outline"}
            onClick={() => setView("overview")}
            className={view === "overview" ? "bg-brand-blue hover:bg-brand-blue/90" : ""}
          >
            Tổng quan
          </Button>
          <Button
            type="button"
            variant={view === "revenue" ? "default" : "outline"}
            onClick={() => setView("revenue")}
            className={view === "revenue" ? "bg-brand-blue hover:bg-brand-blue/90" : ""}
          >
            Doanh thu
          </Button>
          <Button
            type="button"
            variant={view === "loadfactor" ? "default" : "outline"}
            onClick={() => setView("loadfactor")}
            className={view === "loadfactor" ? "bg-brand-blue hover:bg-brand-blue/90" : ""}
          >
            Hệ số lấp đầy
          </Button>
        </div>
      </div>

      <ReportFilterPanel
        initialFilter={queryFilter}
        onFilterChange={setQueryFilter}
        isLoading={isLoading}
      />

      {revenueError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải dữ liệu báo cáo doanh thu. Vui lòng thử lại.
          </AlertDescription>
        </Alert>
      )}

      {loadFactorError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải dữ liệu báo cáo hệ số lấp đầy. Vui lòng thử lại.
          </AlertDescription>
        </Alert>
      )}

      {(view === "overview" || view === "revenue") && (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-brand-blue" />
            Báo cáo doanh thu
          </h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi doanh thu gộp, doanh thu thuần và giá vé trung bình theo kỳ báo cáo
          </p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <p className="font-semibold">Công thức và cách đọc nhanh</p>
          <p>Doanh thu thuần = Doanh thu gộp - Hoàn tiền.</p>
          <p>Giá vé trung bình = Doanh thu thuần / Vé đã bán.</p>
          <p>Biểu đồ doanh thu thể hiện xu hướng theo thời gian: đường đi lên là tăng trưởng, đi xuống là suy giảm theo kỳ lọc.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Doanh thu thuần"
            value={formatCurrency(revenueReport?.summary.netRevenue)}
            color="blue"
            icon={<DollarSign className="h-6 w-6" />}
            loading={isLoadingRevenue}
          />
          <MetricCard
            label="Doanh thu gộp"
            value={formatCurrency(revenueReport?.summary.grossRevenue)}
            color="orange"
            icon={<DollarSign className="h-6 w-6" />}
            loading={isLoadingRevenue}
          />
          <MetricCard
            label="Vé đã bán"
            value={formatNumber(revenueReport?.summary.soldSeats)}
            unit="vé"
            color="green"
            loading={isLoadingRevenue}
          />
          <MetricCard
            label="Giá vé trung bình"
            value={formatCurrency(revenueReport?.summary.avgTicketPrice)}
            color="purple"
            loading={isLoadingRevenue}
          />
        </div>

        <RevenueChart
          data={revenueReport?.series || []}
          loading={isLoadingRevenue}
          title="Biểu đồ doanh thu theo thời gian"
        />

        <BreakdownTable
          data={revenueReport?.breakdown || []}
          loading={isLoadingRevenue}
          title="Bảng chi tiết doanh thu theo loại xe"
          type="revenue"
        />
      </div>
      )}

      {(view === "overview" || view === "loadfactor") && (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Gauge className="h-6 w-6 text-brand-accent" />
            Báo cáo hệ số lấp đầy
          </h2>
          <p className="text-sm text-muted-foreground">
            Tỷ lệ vé đã bán trên tổng sức chứa ghế, dùng để đánh giá hiệu quả khai thác
          </p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
          <p className="font-semibold">Công thức và cách đọc nhanh</p>
          <p>Hệ số lấp đầy (%) = (Vé đã bán / Tổng số ghế cung ứng) x 100%.</p>
          <p>Biểu đồ lấp đầy giúp so sánh tương quan giữa số vé bán và sức chứa ghế theo từng mốc thời gian.</p>
          <p>Nếu tỷ lệ lấp đầy cao nhưng doanh thu thấp, cần kiểm tra cơ cấu giá vé hoặc tỷ lệ hoàn vé.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Hệ số lấp đầy bình quân"
            value={`${(loadFactorReport?.summary.loadFactorPercentage ?? 0).toFixed(2)}`}
            unit="%"
            color="blue"
            icon={<Gauge className="h-6 w-6" />}
            loading={isLoadingLoadFactor}
          />
          <MetricCard
            label="Vé đã bán"
            value={formatNumber(loadFactorReport?.summary.soldSeats)}
            unit="vé"
            color="green"
            loading={isLoadingLoadFactor}
          />
          <MetricCard
            label="Tổng số ghế"
            value={formatNumber(loadFactorReport?.summary.totalSeats)}
            unit="ghế"
            color="orange"
            loading={isLoadingLoadFactor}
          />
        </div>

        <LoadFactorChart
          data={loadFactorReport?.series || []}
          loading={isLoadingLoadFactor}
          title="Biểu đồ hệ số lấp đầy theo thời gian"
        />

        <BreakdownTable
          data={loadFactorReport?.breakdown || []}
          loading={isLoadingLoadFactor}
          title="Bảng chi tiết hệ số lấp đầy theo loại xe"
          type="loadfactor"
        />
      </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold">Lưu ý:</span> Dữ liệu báo cáo phụ thuộc vào điều kiện lọc đã chọn
          (thời gian, loại xe, chu kỳ tổng hợp). Đối soát số liệu theo cùng kỳ để đánh giá xu hướng chính xác.
        </p>
      </div>
    </div>
  );
}
