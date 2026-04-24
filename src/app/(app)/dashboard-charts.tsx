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
import { formatarMoeda } from "@/lib/formatters";

/** Paleta Inside para gráficos */
const CORES_INSIDE = ["#E550A5", "#2D7CDB", "#D62087", "#1D5AA5", "#7B3FC9", "#F6F6F7"];

interface SquadData {
  id: string;
  nome: string;
  head: string | null;
  cor: string;
  totalClientes: number;
  mrrBRL: number;
  mrrUSD: number;
}

interface DashboardChartsProps {
  dadosStatus: { name: string; value: number; fill: string }[];
  dadosPacote: { name: string; value: number }[];
  dadosGestorTrafego: { name: string; value: number }[];
  dadosGestorProjetos: { name: string; value: number }[];
  dadosSquads: SquadData[];
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
  dadosSquads,
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

  // Dados do donut de squads
  const donutSquads = dadosSquads.map((s) => ({
    name: s.nome,
    value: s.totalClientes,
    fill: s.cor,
  }));

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

      {/* Clientes por Squad */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Clientes por Squad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {donutSquads.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutSquads}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    labelLine={false}
                  >
                    {donutSquads.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda enriquecida */}
              <div className="mt-4 space-y-3">
                {dadosSquads.map((s) => (
                  <div key={s.id} className="flex items-start gap-3">
                    <div
                      className="mt-1.5 h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.cor }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 font-medium">
                        {s.nome}
                        {s.head && (
                          <span className="text-zinc-500 font-normal"> ({s.head})</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {s.totalClientes} cliente{s.totalClientes !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {s.mrrBRL > 0 && `MRR: ${formatarMoeda(s.mrrBRL, "BRL")}`}
                        {s.mrrBRL > 0 && s.mrrUSD > 0 && " + "}
                        {s.mrrUSD > 0 && `${s.mrrBRL > 0 ? "" : "MRR: "}${formatarMoeda(s.mrrUSD, "USD")}`}
                        {s.mrrBRL === 0 && s.mrrUSD === 0 && "MRR: —"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
