// Report API types
export interface ReportFilter {
  fromDate: string;
  toDate: string;
  routeId?: string;
  busTypeId?: string;
  seatClass?: "BUSINESS" | "SLEEPER" | "ECONOMY";
  granularity: "day" | "week" | "month";
}

export interface KPISummary {
  grossRevenue: number;
  netRevenue: number;
  soldSeats: number;
  avgTicketPrice: number;
  revenuePerCapacitySeat: number;
}

export interface LoadFactorSummary {
  loadFactorPercentage: number;
  soldSeats: number;
  availableSeats: number;
  emptySeats: number;
}

export interface ReportSeries {
  reportDate: string;
  grossRevenue?: number;
  netRevenue?: number;
  soldSeats?: number;
  avgTicketPrice?: number;
  revenuePerCapacitySeat?: number;
  loadFactorPercentage?: number;
  availableSeats?: number;
  emptySeats?: number;
}

export interface ReportBreakdown {
  seatClass?: string;
  routeId?: string;
  busTypeId?: string;
  grossRevenue?: number;
  netRevenue?: number;
  soldSeats?: number;
  avgTicketPrice?: number;
  revenuePerCapacitySeat?: number;
  loadFactorPercentage?: number;
  availableSeats?: number;
  emptySeats?: number;
}

export interface RevenueReport {
  summary: KPISummary;
  series: ReportSeries[];
  breakdown: ReportBreakdown[];
  filtersApplied: ReportFilter;
  pagination: {
    totalRecords: number;
    page: number;
    pageSize: number;
  };
}

export interface LoadFactorReport {
  summary: LoadFactorSummary;
  series: ReportSeries[];
  breakdown: ReportBreakdown[];
  filtersApplied: ReportFilter;
  pagination: {
    totalRecords: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
