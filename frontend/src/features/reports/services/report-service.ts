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
        routeId: b.routeId ? String(b.routeId) : undefined,
        routeName: b.routeName,
        busTypeId: b.busTypeId ? String(b.busTypeId) : undefined,
        busTypeName: b.busTypeName,
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

    const response = await axiosInstance.get<BackendApiResponse<LoadFactorResult>>(
      `/reports/load-factor?${params.toString()}`
    );

    const r = response.data.result;

    return {
      summary: {
        soldSeats: r.summary.soldSeats,
        totalSeats: r.summary.availableSeats,
        loadFactorPercentage: r.summary.loadFactor,
      },
      series: r.series.map((s) => ({
        reportDate: s.reportDate,
        soldSeats: s.soldSeats,
        totalSeats: s.availableSeats,
        loadFactorPercentage: s.loadFactor,
      })),
      breakdown: r.breakdown.map((b) => ({
        routeId: b.routeId ? String(b.routeId) : undefined,
        routeName: b.routeName,
        busTypeId: b.busTypeId ? String(b.busTypeId) : undefined,
        busTypeName: b.busTypeName,
        soldSeats: b.soldSeats,
        totalSeats: b.availableSeats,
        loadFactorPercentage: b.loadFactor,
      })),
      filtersApplied: {
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        routeId: filter.routeId,
        busTypeId: filter.busTypeId,
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
