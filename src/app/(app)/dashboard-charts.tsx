"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Paleta Inside para gráficos */
const CORES_INSIDE = ["#E550A5", "#2D7CDB", "#D62087", "#1D5AA5", "#7B3FC9", "#F6F6F7"];

interface DashboardChartsProps {
  dadosStatus: { name: string; value: number; fill: string }[];
  dadosPacote: { name: string; value: number }[];
  dadosGestorTrafego: { name: string; value: number }[];
  dadosGestorProjetos: { name: string; value: number }[];
}

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  color: "#e4e4e7",
};

export function DashboardCharts({
  dadosStatus,
  dadosPacote,
  dadosGestorTrafego,
  dadosGestorProjetos,
}: DashboardChartsProps) {
  const temDados = dadosStatus.length > 0 || dadosPacote.length > 0;

  if (!temDados) {
    return null;
  }

  // Cores de status usando paleta Inside
  const statusCoresInside: Record<string, string> = {
    "A iniciar": "#71717a",
    "Onboarding": "#2D7CDB",
    "Ongoing": "#E550A5",
    "Aviso prévio": "#eab308",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Distribuição por Status */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {dadosStatus.map((entry, i) => (
                    <Cell key={i} fill={statusCoresInside[entry.name] || CORES_INSIDE[i % CORES_INSIDE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Pacote */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Distribuição por Pacote
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosPacote.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dadosPacote}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {dadosPacote.map((_, i) => (
                    <Cell key={i} fill={CORES_INSIDE[i % CORES_INSIDE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Clientes por Gestor de Tráfego */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Clientes por Gestor de Tráfego
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosGestorTrafego.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, dadosGestorTrafego.length * 36)}>
              <BarChart data={dadosGestorTrafego} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#d4d4d8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#E550A5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Clientes por Gestor de Projetos */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Clientes por Gestor de Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosGestorProjetos.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, dadosGestorProjetos.length * 36)}>
              <BarChart data={dadosGestorProjetos} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#d4d4d8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#2D7CDB" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
