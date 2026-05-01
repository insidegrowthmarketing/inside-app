// src/app/(app)/dashboards/comercial/page.tsx
export const dynamic = "force-dynamic";

import { TrendingUp, Users, Calendar, Target, DollarSign, Percent } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComercialCharts } from "./comercial-charts";
import { createComercialClient } from "@/lib/supabase/comercial";

export default async function DashboardComercialPage() {
  const supabase = createComercialClient();
  const hoje = new Date();
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  // Busca dados dos últimos 6 meses
  const inicioJanela = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1).toISOString().split("T")[0];

  const [
    { data: leads },
    { data: reunioes },
    { data: contratos },
    { data: pagamentos },
  ] = await Promise.all([
    supabase.from("leads").select("id, created_at, stage").gte("created_at", inicioJanela),
    supabase.from("reunioes").select("id, created_at, compareceu, closer_id").gte("created_at", inicioJanela),
    supabase.from("contratos").select("id, created_at, valor_mensal, valor_semanal, ciclo_cobranca, closer_id, plano").gte("created_at", inicioJanela),
    supabase.from("pagamentos").select("id, created_at, valor, status").gte("created_at", inicioJanela),
  ]);

  // KPIs gerais
  const totalLeads = leads?.length ?? 0;
  const totalReunioes = reunioes?.length ?? 0;
  const totalCompareceu = reunioes?.filter((r) => r.compareceu)?.length ?? 0;
  const totalFechamentos = contratos?.length ?? 0;
  const taxaConversao = totalLeads > 0 ? ((totalFechamentos / totalLeads) * 100).toFixed(1) : "0";
  const taxaShowUp = totalReunioes > 0 ? ((totalCompareceu / totalReunioes) * 100).toFixed(1) : "0";

  // MRR gerado pelos novos contratos do período
  const mrrGerado = (contratos ?? []).reduce((acc, c) => {
    const valor = c.ciclo_cobranca === "semanal"
      ? (Number(c.valor_semanal) * 52) / 12
      : Number(c.valor_mensal);
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  // Dados mensais para gráfico
  const dadosMensais = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const inicio = d.toISOString().split("T")[0];
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
    const leadsM = (leads ?? []).filter((l) => l.created_at >= inicio && l.created_at <= fim).length;
    const fechM = (contratos ?? []).filter((c) => c.created_at >= inicio && c.created_at <= fim).length;
    dadosMensais.push({ mes: `${meses[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`, leads: leadsM, fechamentos: fechM });
  }

  // Funil
  const dadosFunil = [
    { name: "Leads", value: totalLeads, fill: "#2D7CDB" },
    { name: "Reuniões", value: totalReunioes, fill: "#5B8DEF" },
    { name: "Compareceu", value: totalCompareceu, fill: "#7B3FC9" },
    { name: "Proposta", value: Math.round(totalCompareceu * 0.7), fill: "#A855F7" },
    { name: "Contrato", value: totalFechamentos, fill: "#E550A5" },
    { name: "Pago", value: (pagamentos ?? []).filter((p) => p.status === "pago").length, fill: "#EC4899" },
  ];

  // Performance por closer
  const closerMap: Record<string, { nome: string; reunioes: number; fechamentos: number }> = {};
  const closerNomes: Record<string, string> = {
    "VSQm540WL0XLwX8shISG": "Victor",
    "inafZO8bpvd2AAf95O4D": "Gustavo",
  };
  (reunioes ?? []).forEach((r) => {
    if (!r.closer_id) return;
    const nome = closerNomes[r.closer_id] ?? r.closer_id.slice(0, 6);
    if (!closerMap[r.closer_id]) closerMap[r.closer_id] = { nome, reunioes: 0, fechamentos: 0 };
    closerMap[r.closer_id].reunioes++;
  });
  (contratos ?? []).forEach((c) => {
    if (!c.closer_id) return;
    if (!closerMap[c.closer_id]) {
      const nome = closerNomes[c.closer_id] ?? c.closer_id.slice(0, 6);
      closerMap[c.closer_id] = { nome, reunioes: 0, fechamentos: 0 };
    }
    closerMap[c.closer_id].fechamentos++;
  });
  const dadosClosers = Object.values(closerMap);

  // Top contratos recentes
  const contratosRecentes = (contratos ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Comercial" subtitulo="Pipeline de vendas e performance comercial — últimos 6 meses" />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Leads</CardTitle>
            <Users className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">{totalLeads}</p>
            <p className="text-xs text-zinc-500 mt-1">entradas no período</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Reuniões</CardTitle>
            <Calendar className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">{totalReunioes}</p>
            <p className="text-xs text-zinc-500 mt-1">agendadas no período</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Show-up</CardTitle>
            <Percent className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">{taxaShowUp}%</p>
            <p className="text-xs text-zinc-500 mt-1">{totalCompareceu} compareceram</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Fechamentos</CardTitle>
            <Target className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">{totalFechamentos}</p>
            <p className="text-xs text-zinc-500 mt-1">contratos no período</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">{taxaConversao}%</p>
            <p className="text-xs text-zinc-500 mt-1">leads → contrato</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">MRR Gerado</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(mrrGerado)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">novos contratos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <ComercialCharts
        dadosMensais={dadosMensais}
        dadosFunil={dadosFunil}
        dadosClosers={dadosClosers}
      />

      {/* Contratos recentes */}
      <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Contratos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {contratosRecentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">Nenhum contrato no período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 text-zinc-400 font-normal">Data</th>
                    <th className="text-left py-2 text-zinc-400 font-normal">Plano</th>
                    <th className="text-left py-2 text-zinc-400 font-normal">Closer</th>
                    <th className="text-right py-2 text-zinc-400 font-normal">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {contratosRecentes.map((c) => {
                    const valor = c.ciclo_cobranca === "semanal"
                      ? Number(c.valor_semanal)
                      : Number(c.valor_mensal);
                    const closerNome = closerNomes[c.closer_id] ?? "—";
                    return (
                      <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-3 text-zinc-400">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.plano?.toLowerCase().includes("pro") ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>
                            {c.plano ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-300">{closerNome}</td>
                        <td className="py-3 text-right text-zinc-200 font-medium">
                          {isNaN(valor) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(valor)}
                          <span className="text-xs text-zinc-500 ml-1">/{c.ciclo_cobranca === "semanal" ? "sem" : "mês"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
