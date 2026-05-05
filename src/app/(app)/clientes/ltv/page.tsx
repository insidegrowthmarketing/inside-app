import Link from "next/link";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, formatarData } from "@/lib/formatters";
import { calcularMesesAtivos, calcularLTV } from "@/lib/ltv";
import { PACOTES } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";
import { LtvFilters } from "./ltv-filters";
import { LtvAcoes } from "./ltv-acoes";
import { ehAdmin } from "@/lib/permissoes";

interface PageProps {
  searchParams: Promise<{
    busca?: string;
    gestor_projetos?: string;
    gestor_trafego?: string;
    pais?: string;
    motivo_churn?: string;
    mes_churn?: string;
  }>;
}

function getLabelPacote(value: string | null) {
  if (!value) return "—";
  return PACOTES.find((p) => p.value === value)?.label ?? value;
}

export default async function LtvPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = ehAdmin(user?.email);

  let query = supabase
    .from("clientes")
    .select("*")
    .eq("status", "churn")
    .not("data_saida", "is", null)
    .order("data_saida", { ascending: true, nullsFirst: false });

  if (params.busca) {
    query = query.ilike("nome", `%${params.busca}%`);
  }

  if (params.gestor_projetos && params.gestor_projetos !== "todos") {
    query = query.eq("gestor_projetos", params.gestor_projetos);
  }

  if (params.gestor_trafego && params.gestor_trafego !== "todos") {
    query = query.eq("gestor_trafego", params.gestor_trafego);
  }
  if (params.pais === "brasil") {
    query = query.eq("moeda", "BRL");
  } else if (params.pais === "eua") {
    query = query.eq("moeda", "USD");
  }
  if (params.motivo_churn && params.motivo_churn !== "todos") {
    query = query.eq("motivo_churn", params.motivo_churn);
  }
  if (params.mes_churn && params.mes_churn !== "todos") {
    query = query.gte("data_saida", params.mes_churn + "-01").lte("data_saida", params.mes_churn + "-31");
  }

  const { data: clientes, error } = await query;

  if (error) {
    console.error("Erro ao buscar clientes LTV:", error);
  }

  const lista = (clientes ?? []) as Cliente[];

  const totalChurned = lista.length;
  const ltvBRL = lista
    .filter((c) => (c.moeda || "BRL") === "BRL")
    .reduce((acc, c) => acc + calcularLTV(c), 0);
  const ltvUSD = lista
    .filter((c) => c.moeda === "USD")
    .reduce((acc, c) => acc + calcularLTV(c), 0);

  const filtros = {
    gestor_projetos: params.gestor_projetos || "todos",
    gestor_trafego: params.gestor_trafego || "todos",
    pais: params.pais || "todos",
    motivo_churn: params.motivo_churn || "todos",
    mes_churn: params.mes_churn || "todos",
    busca: params.busca || "",
  };

  return (
    <div className="space-y-4">
      <PageHeader titulo="LTV - Lifetime Value" subtitulo="Histórico de clientes e lifetime value" />
        {/* Cards de métricas */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Total de clientes churned
              </CardTitle>
              <History className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{totalChurned}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                LTV acumulado (R$)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {formatarMoeda(ltvBRL, "BRL")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                LTV acumulado (US$)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {formatarMoeda(ltvUSD, "USD")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <LtvFilters filtros={filtros} />

        {/* Tabela */}
        {lista.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <History className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="mb-1 text-lg font-medium text-zinc-300">
                Nenhum cliente churned encontrado
              </p>
              <p className="text-sm text-zinc-500">
                Clientes marcados como churn com data de saída aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 whitespace-nowrap">Nome</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Pacote</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Gestor de projetos</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Gestor de tráfego</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Moeda</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Fee mensal</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Início contrato</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Data de saída</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Meses ativo</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">LTV total</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Motivo do churn</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((cliente) => {
                  const meses = calcularMesesAtivos(cliente);
                  const ltv = calcularLTV(cliente);
                  const moeda = cliente.moeda || "BRL";
                  const simboloMoeda = moeda === "BRL" ? "R$" : "US$";

                  return (
                    <TableRow key={cliente.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-zinc-200 whitespace-nowrap">
                        {cliente.nome}
                      </TableCell>
                      <TableCell className="text-zinc-300 whitespace-nowrap">
                        {getLabelPacote(cliente.pacote)}
                      </TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {cliente.gestor_projetos || "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {cliente.gestor_trafego || "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {simboloMoeda}
                      </TableCell>
                      <TableCell className="text-zinc-300 whitespace-nowrap">
                        {formatarMoeda(Number(cliente.fee_mensal), moeda)}
                      </TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {formatarData(cliente.inicio_contrato)}
                      </TableCell>
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {formatarData(cliente.data_saida)}
                      </TableCell>
                      <TableCell className="text-zinc-300 whitespace-nowrap">
                        {meses}
                      </TableCell>
                      <TableCell className="text-zinc-200 font-medium whitespace-nowrap">
                        {formatarMoeda(ltv, moeda)}
                      </TableCell>
                      <TableCell className="text-zinc-400 max-w-[200px] truncate">
                        {cliente.motivo_churn || "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <LtvAcoes clienteId={cliente.id} clienteNome={cliente.nome} isAdmin={isAdmin} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}
