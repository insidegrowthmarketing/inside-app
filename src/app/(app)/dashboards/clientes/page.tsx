import Link from "next/link";
import {
  Users,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatarMoeda, formatarData } from "@/lib/formatters";
import { PACOTES, STATUS_ATIVOS } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardFiltro } from "./dashboard-filtro";
import { SQUADS, getSquadFromHead } from "@/lib/squads";

function getLabelPacote(value: string | null) {
  if (!value) return "—";
  return PACOTES.find((p) => p.value === value)?.label ?? value;
}

interface PageProps {
  searchParams: Promise<{
    dataCorte?: string;
    gestor_projetos?: string;
    gestor_trafego?: string;
    squad?: string;
    motivo_churn?: string;
    mes_churn?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const dataCorte = params.dataCorte || hojeStr;
  const isHistorico = dataCorte !== hojeStr;

  // Filtros de gestor/squad/churn
  const gpFiltro = params.gestor_projetos || "todos";
  const gtFiltro = params.gestor_trafego || "todos";
  const squadFiltro = params.squad || "todos";
  const motivoChurnFiltro = params.motivo_churn || "todos";
  const mesChurnFiltro = params.mes_churn || "todos";

  // Buscar TODOS os clientes (incluindo churn) para filtrar por data de corte
  let query = supabase.from("clientes").select("*").order("created_at", { ascending: false });

  if (isHistorico) {
    query = query.lte("created_at", dataCorte + "T23:59:59");
  }
  if (gpFiltro !== "todos") {
    query = query.eq("gestor_projetos", gpFiltro);
  }
  if (gtFiltro !== "todos") {
    query = query.eq("gestor_trafego", gtFiltro);
  }
  if (squadFiltro === "high_impact") {
    query = query.eq("head", "Caio");
  } else if (squadFiltro === "genesis") {
    query = query.eq("head", "Jean");
  }

  const { data: todosClientes } = await query;
  const todos = (todosClientes ?? []) as Cliente[];

  // Filtrar clientes visíveis (tudo exceto churn — para listagem e gráficos)
  const clientes = todos.filter((c) => {
    if (isHistorico) {
      if (c.status === "churn" && c.data_saida && c.data_saida <= dataCorte) return false;
      return true;
    }
    return c.status !== "churn";
  });

  // Clientes ativos para métricas (exclui churn E pausado)
  const clientesAtivosMetricas = clientes.filter((c) => c.status !== "pausado");

  // Buscar churns do mês da data de corte
  const dcDate = new Date(dataCorte + "T00:00:00");
  const inicioMesCorte = new Date(dcDate.getFullYear(), dcDate.getMonth(), 1)
    .toISOString().split("T")[0];

  let churnQuery = supabase
    .from("clientes")
    .select("id, motivo_churn, data_saida")
    .eq("status", "churn");

  // Se filtro de mês do churn está ativo, usa ele; senão usa o mês da data de corte
  if (mesChurnFiltro !== "todos") {
    churnQuery = churnQuery
      .gte("data_saida", mesChurnFiltro + "-01")
      .lte("data_saida", mesChurnFiltro + "-31");
  } else {
    churnQuery = churnQuery
      .gte("data_saida", inicioMesCorte)
      .lte("data_saida", dataCorte);
  }

  if (gpFiltro !== "todos") churnQuery = churnQuery.eq("gestor_projetos", gpFiltro);
  if (gtFiltro !== "todos") churnQuery = churnQuery.eq("gestor_trafego", gtFiltro);
  if (squadFiltro === "high_impact") churnQuery = churnQuery.eq("head", "Caio");
  else if (squadFiltro === "genesis") churnQuery = churnQuery.eq("head", "Jean");
  if (motivoChurnFiltro !== "todos") churnQuery = churnQuery.eq("motivo_churn", motivoChurnFiltro);
  const { data: churnsDoMes } = await churnQuery;

  // Métricas (apenas clientes ativos — exclui pausado e churn)
  const todosAtivos = clientesAtivosMetricas;
  const onboarding = clientes.filter((c) => c.status === "onboarding");
  const avisoPrevio = clientes.filter((c) => c.status === "aviso_previo");
  const pausados = clientes.filter((c) => c.status === "pausado");

  const mrrBRL = todosAtivos
    .filter((c) => (c.moeda || "BRL") === "BRL")
    .reduce((acc, c) => acc + Number(c.fee_mensal), 0);

  const mrrUSD = todosAtivos
    .filter((c) => c.moeda === "USD")
    .reduce((acc, c) => acc + Number(c.fee_mensal), 0);

  const churnCount = churnsDoMes?.length ?? 0;

  // Faturas atrasadas (sempre usa hoje, não data de corte)
  const { data: faturasAtrasadas } = await supabase
    .from("faturas")
    .select("valor, moeda")
    .eq("status", "pendente")
    .lt("data_vencimento", hojeStr);

  const atrasadoBRL = (faturasAtrasadas ?? [])
    .filter((f) => f.moeda === "BRL")
    .reduce((a, f) => a + Number(f.valor), 0);
  const atrasadoUSD = (faturasAtrasadas ?? [])
    .filter((f) => f.moeda === "USD")
    .reduce((a, f) => a + Number(f.valor), 0);
  const totalFaturasAtrasadas = faturasAtrasadas?.length ?? 0;

  // Dados para gráficos
  const statusMap: Record<string, number> = {};
  const pacoteMap: Record<string, number> = {};
  const gestorTrafegoMap: Record<string, number> = {};
  const gestorProjetosMap: Record<string, number> = {};

  // Status mostra todos (incluindo pausado) para visibilidade
  for (const c of clientes) {
    statusMap[c.status] = (statusMap[c.status] || 0) + 1;
  }

  // Pacote, gestores e squads: apenas clientes ativos (sem pausado)
  for (const c of clientesAtivosMetricas) {
    if (c.pacote) {
      const label = getLabelPacote(c.pacote);
      pacoteMap[label] = (pacoteMap[label] || 0) + 1;
    }

    if (c.gestor_trafego) {
      gestorTrafegoMap[c.gestor_trafego] = (gestorTrafegoMap[c.gestor_trafego] || 0) + 1;
    }

    if (c.gestor_projetos) {
      gestorProjetosMap[c.gestor_projetos] = (gestorProjetosMap[c.gestor_projetos] || 0) + 1;
    }
  }

  // Distribuição por squad (apenas ativos)
  const squadMap: Record<string, { totalClientes: number; mrrBRL: number; mrrUSD: number; avisoPrevioCount: number }> = {};
  for (const c of clientesAtivosMetricas) {
    const squadId = getSquadFromHead(c.head);
    if (!squadMap[squadId]) squadMap[squadId] = { totalClientes: 0, mrrBRL: 0, mrrUSD: 0, avisoPrevioCount: 0 };
    squadMap[squadId].totalClientes++;
    if (c.status === "aviso_previo") squadMap[squadId].avisoPrevioCount++;
    const fee = Number(c.fee_mensal);
    if ((c.moeda || "BRL") === "BRL") squadMap[squadId].mrrBRL += fee;
    else squadMap[squadId].mrrUSD += fee;
  }

  const dadosSquads = Object.entries(squadMap).map(([id, dados]) => {
    const squad = id === "high_impact" ? SQUADS.high_impact : id === "genesis" ? SQUADS.genesis : null;
    return {
      id,
      nome: squad?.nome ?? "Sem squad",
      cor: squad?.cor ?? "#52525b",
      ...dados,
    };
  });

  const statusLabels: Record<string, string> = {
    a_iniciar: "A iniciar",
    onboarding: "Onboarding",
    ongoing: "Ongoing",
    aviso_previo: "Aviso prévio",
    pausado: "Pausado",
  };

  const dadosStatus = Object.entries(statusMap).map(([key, val]) => ({
    name: statusLabels[key] || key,
    value: val,
  }));

  const dadosPacote = Object.entries(pacoteMap).map(([key, val]) => ({
    name: key,
    value: val,
  }));

  const dadosGestorTrafego = Object.entries(gestorTrafegoMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const dadosGestorProjetos = Object.entries(gestorProjetosMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Últimos 5 clientes
  const ultimos5 = clientes.slice(0, 5);

  // Alertas
  const em15dias = new Date();
  em15dias.setDate(em15dias.getDate() + 15);

  const startVencendo = clientes.filter((c) => {
    if (c.pacote !== "start" || !c.fim_contrato) return false;
    const fim = new Date(c.fim_contrato + "T00:00:00");
    return fim >= hoje && fim <= em15dias;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader titulo="Dashboard" subtitulo="Visão geral da Inside" />
      </div>

      {/* Filtros */}
      <DashboardFiltro filtros={{
        dataCorte,
        gestor_projetos: gpFiltro,
        gestor_trafego: gtFiltro,
        squad: squadFiltro,
        motivo_churn: motivoChurnFiltro,
        mes_churn: mesChurnFiltro,
      }} />

      {/* Cards numéricos */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Clientes ativos</CardTitle>
            <Users className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{todosAtivos.length}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">MRR Real</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{formatarMoeda(mrrBRL, "BRL")}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">MRR Dólar</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{formatarMoeda(mrrUSD, "USD")}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Onboarding</CardTitle>
            <Sparkles className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{onboarding.length}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-amber-500/80 uppercase tracking-wider">Aviso prévio</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-amber-400">{avisoPrevio.length}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">Churn do mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{churnCount}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-red-500/80 uppercase tracking-wider">Faturas atrasadas</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-400">{totalFaturasAtrasadas}</p>
            <p className="mt-1 text-xs text-zinc-600">
              {atrasadoBRL > 0 && formatarMoeda(atrasadoBRL, "BRL")}
              {atrasadoBRL > 0 && atrasadoUSD > 0 && " + "}
              {atrasadoUSD > 0 && formatarMoeda(atrasadoUSD, "USD")}
              {atrasadoBRL === 0 && atrasadoUSD === 0 && "Nenhuma"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <DashboardCharts
        dadosStatus={dadosStatus}
        dadosPacote={dadosPacote}
        dadosGestorTrafego={dadosGestorTrafego}
        dadosGestorProjetos={dadosGestorProjetos}
        dadosSquads={dadosSquads}
      />

      {/* Listas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos clientes */}
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="p-6">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">
              Últimos clientes cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            {ultimos5.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-600">
                Nenhum cliente cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-1">
                {ultimos5.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clientes/${c.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-zinc-200">{c.nome}</p>
                      <p className="text-xs text-zinc-600">
                        {getLabelPacote(c.pacote)} · {formatarData(c.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="p-6">
            <CardTitle className="text-sm font-normal text-zinc-300 uppercase tracking-wider">
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 space-y-4">
            {avisoPrevio.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium text-amber-500 uppercase tracking-widest">
                  Em aviso prévio
                </p>
                <div className="space-y-1">
                  {avisoPrevio.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                    >
                      <div>
                        <p className="text-sm text-zinc-200">{c.nome}</p>
                        <p className="text-xs text-zinc-600">
                          {formatarMoeda(Number(c.fee_mensal), c.moeda || "BRL")} · {c.gestor_projetos || "—"}
                        </p>
                      </div>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {startVencendo.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium text-orange-500 uppercase tracking-widest">
                  Start vencendo em 15 dias
                </p>
                <div className="space-y-1">
                  {startVencendo.map((c) => {
                    const fim = new Date(c.fim_contrato + "T00:00:00");
                    if (isNaN(fim.getTime())) return null;
                    const diasRestantes = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <Link
                        key={c.id}
                        href={`/clientes/${c.id}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                      >
                        <div>
                          <p className="text-sm text-zinc-200">{c.nome}</p>
                          <p className="text-xs text-zinc-600">Vence em {formatarData(c.fim_contrato)}</p>
                        </div>
                        <span className="text-xs text-orange-500">{diasRestantes}d</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {totalFaturasAtrasadas > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium text-red-500 uppercase tracking-widest">
                  Faturas atrasadas
                </p>
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-white/[0.02]">
                  <p className="text-sm text-zinc-400">
                    {totalFaturasAtrasadas} fatura{totalFaturasAtrasadas > 1 ? "s" : ""} em atraso
                  </p>
                  <Link href="/financeiro/cobrancas?status=atrasada">
                    <Button variant="ghost" size="sm" className="text-xs text-zinc-500 hover:text-white">
                      Ver em Financeiro
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {avisoPrevio.length === 0 && startVencendo.length === 0 && totalFaturasAtrasadas === 0 && (
              <p className="py-4 text-center text-sm text-zinc-600">
                Nenhum alerta no momento.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
