"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportFilter } from "../types";

interface ReportFilterProps {
  onFilterChange: (filter: ReportFilter) => void;
  isLoading?: boolean;
}

const SEAT_CLASSES = [
  { value: "BUSINESS", label: "Thương Gia" },
  { value: "SLEEPER", label: "Nằm" },
  { value: "ECONOMY", label: "Bình Dân" },
];

const GRANULARITIES = [
  { value: "day", label: "Hàng ngày" },
  { value: "week", label: "Hàng tuần" },
  { value: "month", label: "Hàng tháng" },
];

export function ReportFilterPanel({ onFilterChange, isLoading }: ReportFilterProps) {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  const [fromDate, setFromDate] = useState(format(thirtyDaysAgo, "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(today, "yyyy-MM-dd"));
  const [seatClass, setSeatClass] = useState<string>("");
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  const handleApplyFilter = () => {
    onFilterChange({
      fromDate,
      toDate,
      seatClass: (seatClass as "BUSINESS" | "SLEEPER" | "ECONOMY" | "") || undefined,
      granularity,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="font-semibold text-foreground">Bộ Lọc Báo Cáo</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* From Date */}
        <div className="space-y-2">
          <Label htmlFor="fromDate" className="text-sm font-medium">
            Từ Ngày
          </Label>
          <div className="relative">
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <Label htmlFor="toDate" className="text-sm font-medium">
            Đến Ngày
          </Label>
          <div className="relative">
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Seat Class */}
        <div className="space-y-2">
          <Label htmlFor="seatClass" className="text-sm font-medium">
            Loại Ghế
          </Label>
          <Select value={seatClass} onValueChange={setSeatClass} disabled={isLoading}>
            <SelectTrigger id="seatClass">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {SEAT_CLASSES.map((cls) => (
                <SelectItem key={cls.value} value={cls.value}>
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Granularity */}
        <div className="space-y-2">
          <Label htmlFor="granularity" className="text-sm font-medium">
            Chu Kỳ
          </Label>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as "day" | "week" | "month")}>
            <SelectTrigger id="granularity">
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
            disabled={isLoading}
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            {isLoading ? "Đang tải..." : "Áp Dụng"}
          </Button>
        </div>
      </div>
    </div>
  );
}
