import axiosInstance from "@/services/http/axios";
import {
  RevenueReport,
  LoadFactorReport,
  ReportFilter,
} from "../types";

type BackendApiResponse<T> = {
  code: number;
  message: string;
  result: T;
  timestamp: number;
};

type RevenueResult = {
  summary: {
    grossRevenue: number;
    refundAmount: number;
    netRevenue: number;
    soldSeats: number;
    bookingCount: number;
    avgTicketPrice: number;
  };
  series: Array<{
    reportDate: string;
    grossRevenue: number;
    refundAmount: number;
    netRevenue: number;
    soldSeats: number;
  }>;
  breakdown: Array<{
    routeId: number;
    routeName: string;
    busTypeId: number;
    busTypeName: string;
    seatClass: string;
    grossRevenue: number;
    refundAmount: number;
    netRevenue: number;
    soldSeats: number;
    avgTicketPrice: number;
  }>;
  filtersApplied: Record<string, unknown>;
};

type LoadFactorResult = {
  summary: {
    soldSeats: number;
    availableSeats: number;
    loadFactor: number;
  };
  series: Array<{
    reportDate: string;
    soldSeats: number;
    availableSeats: number;
    loadFactor: number;
  }>;
  breakdown: Array<{
    routeId: number;
    routeName: string;
    busTypeId: number;
    busTypeName: string;
    seatClass: string;
    soldSeats: number;
    availableSeats: number;
    loadFactor: number;
  }>;
  filtersApplied: Record<string, unknown>;
};

export const reportService = {
  async getRevenueReport(filter: ReportFilter): Promise<RevenueReport> {
    const params = new URLSearchParams();
    params.append("fromDate", filter.fromDate);
    params.append("toDate", filter.toDate);
    params.append("granularity", filter.granularity);
    if (filter.routeId) params.append("routeId", filter.routeId);
    if (filter.busTypeId) params.append("busTypeId", filter.busTypeId);
    if (filter.seatClass) params.append("seatClass", filter.seatClass);

    const response = await axiosInstance.get<BackendApiResponse<RevenueResult>>(
      `/reports/revenue?${params.toString()}`
    );

    const r = response.data.result;

    return {
      summary: {
        grossRevenue: r.summary.grossRevenue,
        netRevenue: r.summary.netRevenue,
        soldSeats: r.summary.soldSeats,
        avgTicketPrice: r.summary.avgTicketPrice,
        revenuePerCapacitySeat: 0,
      },
      series: r.series.map((s) => ({
        reportDate: s.reportDate,
        grossRevenue: s.grossRevenue,
        netRevenue: s.netRevenue,
        soldSeats: s.soldSeats,
        avgTicketPrice: r.summary.avgTicketPrice,
      })),
      breakdown: r.breakdown.map((b) => ({
        seatClass: b.seatClass,
        routeId: String(b.routeId),
        busTypeId: b.busTypeId ? String(b.busTypeId) : undefined,
        grossRevenue: b.grossRevenue,
        netRevenue: b.netRevenue,
        soldSeats: b.soldSeats,
        avgTicketPrice: b.avgTicketPrice,
      })),
      filtersApplied: {
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        routeId: filter.routeId,
        busTypeId: filter.busTypeId,
        seatClass: filter.seatClass,
        granularity: filter.granularity,
      },
      pagination: {
        totalRecords: r.breakdown.length,
        page: 1,
        pageSize: r.breakdown.length,
      },
    };
  },

  async getLoadFactorReport(filter: ReportFilter): Promise<LoadFactorReport> {
    const params = new URLSearchParams();
    params.append("fromDate", filter.fromDate);
    params.append("toDate", filter.toDate);
    params.append("granularity", filter.granularity);
    if (filter.routeId) params.append("routeId", filter.routeId);
    if (filter.busTypeId) params.append("busTypeId", filter.busTypeId);
    if (filter.seatClass) params.append("seatClass", filter.seatClass);

    const response = await axiosInstance.get<BackendApiResponse<LoadFactorResult>>(
      `/reports/load-factor?${params.toString()}`
    );

    const r = response.data.result;

    return {
      summary: {
        soldSeats: r.summary.soldSeats,
        availableSeats: r.summary.availableSeats,
        loadFactorPercentage: r.summary.loadFactor,
        emptySeats: Math.max(0, r.summary.availableSeats - r.summary.soldSeats),
      },
      series: r.series.map((s) => ({
        reportDate: s.reportDate,
        soldSeats: s.soldSeats,
        availableSeats: s.availableSeats,
        emptySeats: Math.max(0, s.availableSeats - s.soldSeats),
        loadFactorPercentage: s.loadFactor,
      })),
      breakdown: r.breakdown.map((b) => ({
        seatClass: b.seatClass,
        routeId: String(b.routeId),
        busTypeId: b.busTypeId ? String(b.busTypeId) : undefined,
        soldSeats: b.soldSeats,
        availableSeats: b.availableSeats,
        emptySeats: Math.max(0, b.availableSeats - b.soldSeats),
        loadFactorPercentage: b.loadFactor,
      })),
      filtersApplied: {
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        routeId: filter.routeId,
        busTypeId: filter.busTypeId,
        seatClass: filter.seatClass,
        granularity: filter.granularity,
      },
      pagination: {
        totalRecords: r.breakdown.length,
        page: 1,
        pageSize: r.breakdown.length,
      },
    };
  },
};
