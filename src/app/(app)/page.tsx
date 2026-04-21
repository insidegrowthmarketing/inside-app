import Link from "next/link";
import {
  Users,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatarMoeda, formatarData } from "@/lib/formatters";
import { PACOTES } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";
import { DashboardCharts } from "./dashboard-charts";

function getLabelPacote(value: string | null) {
  if (!value) return "—";
  return PACOTES.find((p) => p.value === value)?.label ?? value;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Buscar todos os clientes não-churn
  const { data: clientesAtivos } = await supabase
    .from("clientes")
    .select("*")
    .neq("status", "churn")
    .order("created_at", { ascending: false });

  // Buscar churns do mês atual
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const inicioMesStr = inicioMes.toISOString().split("T")[0];

  const { data: churnsDoMes } = await supabase
    .from("clientes")
    .select("id")
    .eq("status", "churn")
    .gte("data_saida", inicioMesStr);

  const clientes = (clientesAtivos ?? []) as Cliente[];

  // Métricas
  const ongoing = clientes.filter((c) => c.status === "ongoing");
  const onboarding = clientes.filter((c) => c.status === "onboarding");
  const avisoPrevio = clientes.filter((c) => c.status === "aviso_previo");

  const statusAtivos = ["ongoing", "onboarding", "aviso_previo"];
  const clientesAtivosParaMRR = clientes.filter((c) => statusAtivos.includes(c.status));

  const mrrBRL = clientesAtivosParaMRR
    .filter((c) => (c.moeda || "BRL") === "BRL")
    .reduce((acc, c) => acc + Number(c.fee_mensal), 0);

  const mrrUSD = clientesAtivosParaMRR
    .filter((c) => c.moeda === "USD")
    .reduce((acc, c) => acc + Number(c.fee_mensal), 0);

  const churnCount = churnsDoMes?.length ?? 0;

  // Dados para gráficos
  const statusMap: Record<string, number> = {};
  const pacoteMap: Record<string, number> = {};
  const gestorTrafegoMap: Record<string, number> = {};
  const gestorProjetosMap: Record<string, number> = {};

  for (const c of clientes) {
    statusMap[c.status] = (statusMap[c.status] || 0) + 1;

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

  const statusLabels: Record<string, string> = {
    a_iniciar: "A iniciar",
    onboarding: "Onboarding",
    ongoing: "Ongoing",
    aviso_previo: "Aviso prévio",
  };
  const statusCores: Record<string, string> = {
    a_iniciar: "#71717a",
    onboarding: "#3b82f6",
    ongoing: "#22c55e",
    aviso_previo: "#eab308",
  };

  const dadosStatus = Object.entries(statusMap).map(([key, val]) => ({
    name: statusLabels[key] || key,
    value: val,
    fill: statusCores[key] || "#71717a",
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

  // Alertas: aviso prévio + Start vencendo em 15 dias
  const hoje = new Date();
  const em15dias = new Date();
  em15dias.setDate(em15dias.getDate() + 15);

  const startVencendo = clientes.filter((c) => {
    if (c.pacote !== "start" || !c.fim_contrato) return false;
    const fim = new Date(c.fim_contrato + "T00:00:00");
    return fim >= hoje && fim <= em15dias;
  });

  return (
    <>
      <Header titulo="Dashboard" />

      <div className="space-y-6 p-6">
        <p className="text-sm text-zinc-500">Visão geral da Inside</p>

        {/* Cards numéricos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Clientes ativos</CardTitle>
              <Users className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{ongoing.length}</p>
              <p className="mt-1 text-xs text-zinc-500">Status: Ongoing</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">MRR em Real</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{formatarMoeda(mrrBRL, "BRL")}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">MRR em Dólar</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{formatarMoeda(mrrUSD, "USD")}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Em onboarding</CardTitle>
              <Sparkles className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{onboarding.length}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-yellow-400">Aviso prévio</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-400">{avisoPrevio.length}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Churn do mês</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{churnCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <DashboardCharts
          dadosStatus={dadosStatus}
          dadosPacote={dadosPacote}
          dadosGestorTrafego={dadosGestorTrafego}
          dadosGestorProjetos={dadosGestorProjetos}
        />

        {/* Listas */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Últimos clientes */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">
                Últimos clientes cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ultimos5.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">
                  Nenhum cliente cadastrado ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {ultimos5.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{c.nome}</p>
                          <p className="text-xs text-zinc-500">
                            {getLabelPacote(c.pacote)} · {formatarData(c.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso prévio */}
              {avisoPrevio.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-yellow-400 uppercase tracking-wider">
                    Em aviso prévio
                  </p>
                  <div className="space-y-2">
                    {avisoPrevio.map((c) => (
                      <Link
                        key={c.id}
                        href={`/clientes/${c.id}`}
                        className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-zinc-800 transition-colors"
                      >
                        <div>
                          <p className="text-sm text-zinc-200">{c.nome}</p>
                          <p className="text-xs text-zinc-500">
                            {formatarMoeda(Number(c.fee_mensal), c.moeda || "BRL")} · {c.gestor_projetos || "—"}
                          </p>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Start vencendo */}
              {startVencendo.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-orange-400 uppercase tracking-wider">
                    Contratos Start vencendo em 15 dias
                  </p>
                  <div className="space-y-2">
                    {startVencendo.map((c) => {
                      const fim = new Date(c.fim_contrato + "T00:00:00");
                      if (isNaN(fim.getTime())) return null;
                      const diasRestantes = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <Link
                          key={c.id}
                          href={`/clientes/${c.id}`}
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-zinc-800 transition-colors"
                        >
                          <div>
                            <p className="text-sm text-zinc-200">{c.nome}</p>
                            <p className="text-xs text-zinc-500">
                              Vence em {formatarData(c.fim_contrato)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-orange-400">
                            {diasRestantes} dias
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {avisoPrevio.length === 0 && startVencendo.length === 0 && (
                <p className="py-4 text-center text-sm text-zinc-500">
                  Nenhum alerta no momento.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
