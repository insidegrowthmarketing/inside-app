"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinanceiroChartsProps {
  dadosMensais: { mes: string; brl: number; usd: number }[];
}

export function FinanceiroCharts({ dadosMensais }: FinanceiroChartsProps) {
  if (dadosMensais.length === 0) return null;

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          Recebido nos últimos 6 meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dadosMensais} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#e4e4e7",
              }}
            />
            <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 12 }} />
            <Bar dataKey="brl" name="BRL" fill="#E550A5" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="usd" name="USD" fill="#2D7CDB" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
