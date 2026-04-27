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
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/formatters";

/** Paleta roxa vibrante para gráficos */
const CORES_GRAFICOS = [
  "#8B5CF6", // violet-500
  "#A78BFA", // violet-400
  "#7C3AED", // violet-600
  "#C4B5FD", // violet-300
  "#6D28D9", // violet-700
  "#DDD6FE", // violet-200
];

const STATUS_CORES: Record<string, string> = {
  "A iniciar": "#A78BFA",
  "Onboarding": "#7C3AED",
  "Ongoing": "#8B5CF6",
  "Aviso prévio": "#C4B5FD",
  "Pausado": "#52525b",
};

const SQUAD_CORES: Record<string, string> = {
  high_impact: "#8B5CF6",
  genesis: "#3B82F6",
  sem_squad: "#52525B",
};

interface SquadData {
  id: string;
  nome: string;
  cor: string;
  totalClientes: number;
  mrrBRL: number;
  mrrUSD: number;
  avisoPrevioCount: number;
}

interface DashboardChartsProps {
  dadosStatus: { name: string; value: number }[];
  dadosPacote: { name: string; value: number }[];
  dadosGestorTrafego: { name: string; value: number }[];
  dadosGestorProjetos: { name: string; value: number }[];
  dadosSquads: SquadData[];
}

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid rgba(139, 92, 246, 0.3)",
  borderRadius: "10px",
  color: "#f4f4f5",
  fontSize: "14px",
};

const cardCls = "border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl";
const titleCls = "text-sm font-normal text-zinc-300 uppercase tracking-wider";

export function DashboardCharts({
  dadosStatus,
  dadosPacote,
  dadosGestorTrafego,
  dadosGestorProjetos,
  dadosSquads,
}: DashboardChartsProps) {
  const temDados = dadosStatus.length > 0 || dadosPacote.length > 0;
  if (!temDados) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Distribuição por Status */}
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Status</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dadosStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none" labelLine={false}>
                  {dadosStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_CORES[entry.name] || CORES_GRAFICOS[i % CORES_GRAFICOS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {dadosStatus.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_CORES[d.name] || CORES_GRAFICOS[i % CORES_GRAFICOS.length] }} />
                <span className="text-sm text-zinc-200">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Pacote */}
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Pacote</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosPacote.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dadosPacote} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none" labelLine={false}>
                  {dadosPacote.map((_, i) => (
                    <Cell key={i} fill={CORES_GRAFICOS[i % CORES_GRAFICOS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {dadosPacote.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES_GRAFICOS[i % CORES_GRAFICOS.length] }} />
                <span className="text-sm text-zinc-200">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clientes por Squad */}
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Squads</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosSquads.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={dadosSquads.map((s) => ({ name: s.nome, value: s.totalClientes }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none" labelLine={false}
                  >
                    {dadosSquads.map((s, i) => (
                      <Cell key={i} fill={SQUAD_CORES[s.id] || "#52525B"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-3">
                {dadosSquads.map((s) => (
                  <div key={s.id} className="flex items-start gap-3">
                    <div className="mt-1.5 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: SQUAD_CORES[s.id] || "#52525B" }} />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-200">{s.nome}</p>
                      <p className="text-sm text-zinc-400">{s.totalClientes} clientes</p>
                      {s.avisoPrevioCount > 0 && (
                        <p className="text-sm text-amber-500 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" />
                          {s.avisoPrevioCount} em aviso prévio
                        </p>
                      )}
                      <p className="text-sm text-zinc-400 mt-0.5">
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
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Gestores de tráfego</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosGestorTrafego.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, dadosGestorTrafego.length * 32)}>
              <BarChart data={dadosGestorTrafego} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Clientes por Gestor de Projetos */}
      <Card className={cardCls}>
        <CardHeader className="p-6"><CardTitle className={titleCls}>Gestores de projetos</CardTitle></CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {dadosGestorProjetos.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, dadosGestorProjetos.length * 32)}>
              <BarChart data={dadosGestorProjetos} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#a1a1aa", fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
