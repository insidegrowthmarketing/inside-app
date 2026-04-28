import {
  TrendingDown, DollarSign, TrendingUp, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatarMoeda, formatarData } from "@/lib/formatters";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PACOTES } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";
import { getSquadFromHead } from "@/lib/squads";
import { LtvDashboardFiltro } from "./ltv-dashboard-filtro";
import { LtvDashboardCharts } from "./ltv-dashboard-charts";

interface PageProps {
  searchParams: Promise<{
    periodo?: string;
    squad?: string;
    gestor_trafego?: string;
    motivo?: string;
  }>;
}

function calcMeses(inicio: string | null, saida: string | null): number {
  if (!inicio || !saida) return 0;
  const d1 = new Date(inicio + "T00:00:00");
  const d2 = new Date(saida + "T00:00:00");
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (30 * 86400000)));
}

export default async function DashboardLtvPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const periodoFiltro = params.periodo || "todos";
  const squadFiltro = params.squad || "todos";
  const gtFiltro = params.gestor_trafego || "todos";
  const motivoFiltro = params.motivo || "todos";

  let query = supabase.from("clientes").select("*").eq("status", "churn").not("data_saida", "is", null);

  // Filtro de período por data_saida
  if (periodoFiltro !== "todos") {
    const hoje = new Date();
    let desde: Date;
    switch (periodoFiltro) {
      case "30d": desde = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 30); break;
      case "3m": desde = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate()); break;
      case "6m": desde = new Date(hoje.getFullYear(), hoje.getMonth() - 6, hoje.getDate()); break;
      case "12m": desde = new Date(hoje.getFullYear(), hoje.getMonth() - 12, hoje.getDate()); break;
      default: desde = new Date(2000, 0, 1);
    }
    query = query.gte("data_saida", desde.toISOString().split("T")[0]);
  }

  if (gtFiltro !== "todos") query = query.eq("gestor_trafego", gtFiltro);
  if (motivoFiltro !== "todos") query = query.eq("motivo_churn", motivoFiltro);
  if (squadFiltro === "high_impact") query = query.eq("head", "Caio");
  else if (squadFiltro === "genesis") query = query.eq("head", "Jean");

  const { data } = await query;
  const clientes = (data ?? []) as Cliente[];

  // Métricas
  const totalChurned = clientes.length;

  const ltvsPorCliente = clientes.map((c) => {
    const meses = calcMeses(c.inicio_contrato, c.data_saida);
    return { ...c, meses, ltv: Number(c.fee_mensal) * meses };
  });

  const ltvBRL = ltvsPorCliente.filter((c) => (c.moeda || "BRL") === "BRL").reduce((a, c) => a + c.ltv, 0);
  const ltvUSD = ltvsPorCliente.filter((c) => c.moeda === "USD").reduce((a, c) => a + c.ltv, 0);
  const countBRL = ltvsPorCliente.filter((c) => (c.moeda || "BRL") === "BRL").length;
  const countUSD = ltvsPorCliente.filter((c) => c.moeda === "USD").length;
  const mediaBRL = countBRL > 0 ? ltvBRL / countBRL : 0;
  const mediaUSD = countUSD > 0 ? ltvUSD / countUSD : 0;
  const tempoMedio = totalChurned > 0 ? (ltvsPorCliente.reduce((a, c) => a + c.meses, 0) / totalChurned).toFixed(1) : "0";

  // Gráfico: motivos (top 5 + outros)
  const motivoMap: Record<string, number> = {};
  for (const c of clientes) {
    const m = c.motivo_churn || "Não informado";
    motivoMap[m] = (motivoMap[m] || 0) + 1;
  }
  const motivosSorted = Object.entries(motivoMap).sort((a, b) => b[1] - a[1]);
  const top5 = motivosSorted.slice(0, 5);
  const outrosCount = motivosSorted.slice(5).reduce((a, [, v]) => a + v, 0);
  const dadosMotivos = top5.map(([name, value]) => ({ name, value }));
  if (outrosCount > 0) dadosMotivos.push({ name: "Outros", value: outrosCount });

  // Gráfico: churn mensal (últimos 12 meses)
  const mesesNome = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const hoje = new Date();
  const dadosMensais: { mes: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = clientes.filter((c) => c.data_saida?.startsWith(mesKey)).length;
    dadosMensais.push({ mes: `${mesesNome[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, value: count });
  }

  // Gráfico: top 10 LTVs
  const topLtvs = ltvsPorCliente
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 10)
    .map((c) => ({ name: c.nome, value: c.ltv, moeda: c.moeda || "USD" }));

  const filtros = {
    periodo: periodoFiltro,
    squad: squadFiltro,
    gestor_trafego: gtFiltro,
    motivo: motivoFiltro,
  };

  const cardCls = "border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl";

  return (
    <div className="space-y-6">
      <PageHeader titulo="LTV" subtitulo="Análise de churn e lifetime value dos clientes" />

      <LtvDashboardFiltro filtros={filtros} />

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={cardCls}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Total churned</CardTitle>
            <TrendingDown className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent><p className="text-3xl font-semibold text-white">{totalChurned}</p></CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">LTV acumulado</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            {ltvBRL > 0 && <p className="text-xl font-semibold text-white">{formatarMoeda(ltvBRL, "BRL")}</p>}
            {ltvUSD > 0 && <p className="text-xl font-semibold text-white">{formatarMoeda(ltvUSD, "USD")}</p>}
            {ltvBRL === 0 && ltvUSD === 0 && <p className="text-xl font-semibold text-zinc-500">—</p>}
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">LTV médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            {countBRL > 0 && <p className="text-lg font-semibold text-white">{formatarMoeda(mediaBRL, "BRL")} <span className="text-xs text-zinc-500">média BRL</span></p>}
            {countUSD > 0 && <p className="text-lg font-semibold text-white">{formatarMoeda(mediaUSD, "USD")} <span className="text-xs text-zinc-500">média USD</span></p>}
            {countBRL === 0 && countUSD === 0 && <p className="text-lg text-zinc-500">—</p>}
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Tempo médio de vida</CardTitle>
            <Clock className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent><p className="text-3xl font-semibold text-white">{tempoMedio} <span className="text-sm font-normal text-zinc-500">meses</span></p></CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <LtvDashboardCharts
        dadosMotivos={dadosMotivos}
        dadosMensais={dadosMensais}
        topLtvs={topLtvs}
      />

      {/* Tabela resumida */}
      <Card className={cardCls}>
        <CardHeader className="p-6">
          <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Clientes churned</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">Lista respeitando os filtros aplicados</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {ltvsPorCliente.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Nenhum cliente churned com esses filtros</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 whitespace-nowrap">Nome</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Pacote</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Moeda</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Fee mensal</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Início contrato</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Data saída</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">LTV total</TableHead>
                    <TableHead className="text-zinc-400 whitespace-nowrap">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ltvsPorCliente.sort((a, b) => (a.data_saida || "").localeCompare(b.data_saida || "")).map((c) => {
                    const moeda = c.moeda || "BRL";
                    return (
                      <TableRow key={c.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="font-medium text-zinc-200 whitespace-nowrap">
                          <Link href={`/clientes/${c.id}?from=${encodeURIComponent("/dashboards/ltv")}`} className="hover:underline">{c.nome}</Link>
                        </TableCell>
                        <TableCell className="text-zinc-300 whitespace-nowrap">{PACOTES.find((p) => p.value === c.pacote)?.label || "—"}</TableCell>
                        <TableCell className="text-zinc-400 whitespace-nowrap">{moeda === "BRL" ? "R$" : "US$"}</TableCell>
                        <TableCell className="text-zinc-300 whitespace-nowrap">{formatarMoeda(Number(c.fee_mensal), moeda)}</TableCell>
                        <TableCell className="text-zinc-400 whitespace-nowrap">{formatarData(c.inicio_contrato)}</TableCell>
                        <TableCell className="text-zinc-400 whitespace-nowrap">{formatarData(c.data_saida)}</TableCell>
                        <TableCell className="text-zinc-200 font-medium whitespace-nowrap">{formatarMoeda(c.ltv, moeda)}</TableCell>
                        <TableCell className="text-zinc-400 max-w-[200px] truncate">{c.motivo_churn || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
