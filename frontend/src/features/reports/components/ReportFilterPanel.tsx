"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ReportFilter } from "../types";
import { useBusTypes } from "@/hooks/useMasterData";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";

interface ReportFilterProps {
  initialFilter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
  isLoading?: boolean;
}

const GRANULARITIES = [
  { value: "day", label: "Theo ngày" },
  { value: "week", label: "Theo tuần" },
  { value: "month", label: "Theo tháng" },
];

export function ReportFilterPanel({ initialFilter, onFilterChange, isLoading }: ReportFilterProps) {
  const today = useMemo(() => new Date(), []);
  const { data: busTypes = [] } = useBusTypes();

  const parseDate = (value?: string, fallback?: Date) => {
    if (!value) return fallback ?? new Date();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? (fallback ?? new Date()) : d;
  };

  const [fromDate, setFromDate] = useState<Date>(
    parseDate(initialFilter?.fromDate, today)
  );
  const [toDate, setToDate] = useState<Date>(
    parseDate(initialFilter?.toDate, today)
  );
  const [busTypeId, setBusTypeId] = useState<string>(initialFilter?.busTypeId || "ALL");
  const [granularity, setGranularity] = useState<"day" | "week" | "month">(
    initialFilter?.granularity || "day"
  );

  useEffect(() => {
    if (!initialFilter) return;
    setFromDate(parseDate(initialFilter.fromDate, today));
    setToDate(parseDate(initialFilter.toDate, today));
    setBusTypeId(initialFilter.busTypeId || "ALL");
    setGranularity(initialFilter.granularity || "day");
  }, [initialFilter, today]);

  const normalizedBusTypes = useMemo(
    () => busTypes
      .filter((bt) => bt && bt.id !== undefined && bt.id !== null)
      .map((bt) => ({ id: String(bt.id), name: bt.name || `Loại xe ${bt.id}` })),
    [busTypes]
  );

  const handleApplyFilter = () => {
    onFilterChange({
      fromDate: format(fromDate, "yyyy-MM-dd"),
      toDate: format(toDate, "yyyy-MM-dd"),
      busTypeId: busTypeId === "ALL" ? undefined : busTypeId,
      granularity,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Bộ lọc báo cáo</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* From Date */}
        <div className="space-y-2">
          <Label htmlFor="fromDate" className="text-sm font-medium">
            Từ ngày
          </Label>
          <AdminDatePicker
            value={fromDate}
            onChange={(date) => date && setFromDate(date)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <Label htmlFor="toDate" className="text-sm font-medium">
            Đến ngày
          </Label>
          <AdminDatePicker
            value={toDate}
            onChange={(date) => date && setToDate(date)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Bus Type */}
        <div className="space-y-2">
          <Label htmlFor="busTypeId" className="text-sm font-medium">
            Loại xe
          </Label>
          <Select value={busTypeId} onValueChange={setBusTypeId} disabled={isLoading || normalizedBusTypes.length === 0}>
            <SelectTrigger id="busTypeId" className="h-10 border-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 bg-slate-50">
              <SelectValue placeholder="Tất cả loại xe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại xe</SelectItem>
              {normalizedBusTypes.map((bt) => (
                <SelectItem key={bt.id} value={bt.id}>
                  {bt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Granularity */}
        <div className="space-y-2">
          <Label htmlFor="granularity" className="text-sm font-medium">
            Chu kỳ tổng hợp
          </Label>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as "day" | "week" | "month")}>
            <SelectTrigger id="granularity" className="h-10 border-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 bg-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRANULARITIES.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Apply Button */}
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <Button
            onClick={handleApplyFilter}
            disabled={isLoading || toDate < fromDate}
            className="w-full h-10 bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            {isLoading ? "Đang tải..." : "Áp dụng"}
          </Button>
        </div>
      </div>
    </div>
  );
}
