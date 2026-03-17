import axiosInstance from "@/services/http/axios";
import {
  RevenueReport,
  LoadFactorReport,
  ReportFilter,
  ApiResponse,
} from "../types";

export const reportService = {
  async getRevenueReport(filter: ReportFilter): Promise<RevenueReport> {
    const params = new URLSearchParams();
    params.append("fromDate", filter.fromDate);
    params.append("toDate", filter.toDate);
    params.append("granularity", filter.granularity);
    if (filter.routeId) params.append("routeId", filter.routeId);
    if (filter.busTypeId) params.append("busTypeId", filter.busTypeId);
    if (filter.seatClass) params.append("seatClass", filter.seatClass);

    const response = await axiosInstance.get<ApiResponse<RevenueReport>>(
      `/api/reports/revenue?${params.toString()}`
    );

    return response.data.data;
  },

  async getLoadFactorReport(filter: ReportFilter): Promise<LoadFactorReport> {
    const params = new URLSearchParams();
    params.append("fromDate", filter.fromDate);
    params.append("toDate", filter.toDate);
    params.append("granularity", filter.granularity);
    if (filter.routeId) params.append("routeId", filter.routeId);
    if (filter.busTypeId) params.append("busTypeId", filter.busTypeId);
    if (filter.seatClass) params.append("seatClass", filter.seatClass);

    const response = await axiosInstance.get<ApiResponse<LoadFactorReport>>(
      `/api/reports/load-factor?${params.toString()}`
    );

    return response.data.data;
  },
};
