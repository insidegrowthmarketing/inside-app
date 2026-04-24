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
    <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
      <CardHeader className="p-6">
        <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">
          Recebido nos últimos 6 meses
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dadosMensais} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "10px",
                color: "#f4f4f5",
                fontSize: "14px",
              }}
            />
            <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 13 }} />
            <Bar dataKey="brl" name="BRL" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="usd" name="USD" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
