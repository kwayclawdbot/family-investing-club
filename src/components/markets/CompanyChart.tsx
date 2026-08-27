"use client";
import { useState } from "react";
import { Card, Segmented } from "@/components/ui";
import { LineChart } from "./LineChart";

const LABELS: Record<string, string[]> = {
  "1D": ["10AM", "12PM", "2PM", "4PM"],
  "1W": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "1M": ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
  "3M": ["Jun", "Jul", "Aug"],
  "1Y": ["Sep", "Dec", "Mar", "Jun"],
  "5Y": ["2021", "2022", "2023", "2024", "2025"],
  ALL: ["Start", "", "", "Now"],
};

export function CompanyChart({
  series,
  ranges,
  color = "#4C8C4A",
  height = 120,
  fill = true,
}: {
  series: Record<string, number[]>;
  ranges: string[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  const [tf, setTf] = useState(ranges[0]);
  const data = series[tf] ?? series[ranges[0]];
  return (
    <>
      <Segmented items={ranges} value={tf} onChange={setTf} tone="orange" className="mt-3" />
      <Card className="mt-[10px] !pt-3 !px-[10px] !pb-[6px]">
        <LineChart data={data} color={color} height={height} fill={fill} labels={LABELS[tf]} />
      </Card>
    </>
  );
}
