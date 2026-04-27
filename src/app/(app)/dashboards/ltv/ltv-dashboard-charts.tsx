"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/formatters";

const CORES = ["#8B5CF6", "#A78BFA", "#7C3AED", "#C4B5FD", "#6D28D9", "#DDD6FE"];
const tooltipStyle = { background: "#18181b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#f4f4f5", fontSize: "14px" };
const cardCls = "border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl";
const titleCls = "text-sm font-normal text-zinc-300 uppercase tracking-wider";

interface LtvDashboardChartsProps {
  dadosMotivos: { name: string; value: number }[];
  dadosMensais: { mes: string; value: number }[];
  topLtvs: { name: string; value: number; moeda: string }[];
}

export function LtvDashboardCharts({ dadosMotivos, dadosMensais, topLtvs }: LtvDashboardChartsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Motivos de churn */}
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Motivos de churn</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosMotivos.length === 0 ? <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dadosMotivos} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none" labelLine={false}>
                    {dadosMotivos.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {dadosMotivos.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                    <span className="text-sm text-zinc-200">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Churn ao longo do tempo */}
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Churn mensal (últimos 12 meses)</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosMensais.length === 0 ? <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosMensais} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Churns" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top 10 LTVs */}
      <Card className={`${cardCls} sm:col-span-2`}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Top 10 maiores LTVs</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {topLtvs.length === 0 ? <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={Math.max(200, topLtvs.length * 36)}>
              <BarChart data={topLtvs} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => formatarMoeda(v, "USD")} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
