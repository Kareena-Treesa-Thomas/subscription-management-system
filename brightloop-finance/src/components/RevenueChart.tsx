"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { moneyShort } from "@/lib/format";

type Point = { month: string; label: string; billed: number; collected: number };

function compact(v: number): string {
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Bar chart of billed and collected amounts for the last 12 months">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#DFE4EC" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#4A5878" }} />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compact} tick={{ fontSize: 12, fill: "#4A5878" }} />
          <Tooltip formatter={(v: unknown) => moneyShort(Number(v))} cursor={{ fill: "#F2F4F8" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="billed" name="Billed" fill="#B8C4DA" radius={[3, 3, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#0E8F7E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
