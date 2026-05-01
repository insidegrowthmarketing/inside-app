"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DadosMensais {
  mes: string;
  fechamentos: number;
  leads: number;
}

interface DadosFunil {
  name: string;
  value: number;
  fill: string;
}

interface DadosCloser {
  nome: string;
  reunioes: number;
  fechamentos: number;
}

interface ComercialChartsProps {
  dadosMensais: DadosMensais[];
  dadosFunil: DadosFunil[];
  dadosClosers: DadosCloser[];
}

export function ComercialCharts({
  dadosMensais,
  dadosFunil,
  dadosClosers,
}: ComercialChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">
            Evolução de Fechamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dadosMensais}>
              <defs>
                <linearGradient id="colorFechamentos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B3FC9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7B3FC9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D7CDB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2D7CDB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="mes" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} labelStyle={{ color: "#a1a1aa" }} />
              <Area type="monotone" dataKey="leads" stroke="#2D7CDB" strokeWidth={2} fill="url(#colorLeads)" name="Leads" />
              <Area type="monotone" dataKey="fechamentos" stroke="#7B3FC9" strokeWidth={2} fill="url(#colorFechamentos)" name="Fechamentos" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-zinc-400"><span className="w-3 h-1 bg-blue-500 rounded-full inline-block" />Leads</span>
            <span className="flex items-center gap-1 text-xs text-zinc-400"><span className="w-3 h-1 bg-purple-500 rounded-full inline-block" />Fechamentos</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">
            Performance por Closer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosClosers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} labelStyle={{ color: "#a1a1aa" }} />
              <Bar dataKey="reunioes" fill="#2D7CDB" radius={[0, 4, 4, 0]} name="Reuniões" />
              <Bar dataKey="fechamentos" fill="#E550A5" radius={[0, 4, 4, 0]} name="Fechamentos" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-zinc-400"><span className="w-3 h-1 bg-blue-500 rounded-full inline-block" />Reuniões</span>
            <span className="flex items-center gap-1 text-xs text-zinc-400"><span className="w-3 h-1 bg-pink-500 rounded-full inline-block" />Fechamentos</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">
            Funil de Aquisição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {dadosFunil.map((item, i) => {
              const pct = dadosFunil[0].value > 0
                ? ((item.value / dadosFunil[0].value) * 100).toFixed(1)
                : "0";
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-xl flex items-center justify-center font-bold text-white text-lg"
                    style={{
                      backgroundColor: item.fill + "33",
                      border: `1px solid ${item.fill}55`,
                      height: `${Math.max(48, (item.value / (dadosFunil[0].value || 1)) * 120)}px`,
                    }}
                  >
                    {item.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-zinc-400 text-center">{item.name}</p>
                  <p className="text-xs font-medium" style={{ color: item.fill }}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
