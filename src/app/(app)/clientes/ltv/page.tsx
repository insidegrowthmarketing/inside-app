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
import { formatarMoeda, formatarData, formatarDiaPagamento } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { PACOTES } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";
import { LtvFilters } from "./ltv-filters";
import { LtvAcoes } from "./ltv-acoes";

interface PageProps {
  searchParams: Promise<{
    busca?: string;
    gestor_projetos?: string;
    gestor_trafego?: string;
    pais?: string;
  }>;
}

function calcularMesesAtivo(inicio: string | null, saida: string | null): number {
  if (!inicio || !saida) return 0;
  const d1 = new Date(inicio + "T00:00:00");
  const d2 = new Date(saida + "T00:00:00");
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const meses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  const diasRestantes = d2.getDate() - d1.getDate();
  return Math.max(1, Math.round(meses + diasRestantes / 30));
}

function getLabelPacote(value: string | null) {
  if (!value) return "—";
  return PACOTES.find((p) => p.value === value)?.label ?? value;
}

export default async function LtvPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clientes")
    .select("*")
    .eq("status", "churn")
    .not("data_saida", "is", null)
    .order("inicio_contrato", { ascending: true, nullsFirst: false });

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

  const { data: clientes, error } = await query;

  if (error) {
    console.error("Erro ao buscar clientes LTV:", error);
  }

  const lista = (clientes ?? []) as Cliente[];

  const totalChurned = lista.length;
  const ltvBRL = lista
    .filter((c) => (c.moeda || "BRL") === "BRL")
    .reduce((acc, c) => {
      const meses = calcularMesesAtivo(c.inicio_contrato, c.data_saida);
      return acc + Number(c.fee_mensal) * meses;
    }, 0);
  const ltvUSD = lista
    .filter((c) => c.moeda === "USD")
    .reduce((acc, c) => {
      const meses = calcularMesesAtivo(c.inicio_contrato, c.data_saida);
      return acc + Number(c.fee_mensal) * meses;
    }, 0);

  const filtros = {
    gestor_projetos: params.gestor_projetos || "todos",
    gestor_trafego: params.gestor_trafego || "todos",
    pais: params.pais || "todos",
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
                  <TableHead className="text-zinc-400 whitespace-nowrap">Dia pagamento</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Moeda</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Fee mensal</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Início contrato</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Data de saída</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Meses ativo</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">LTV total</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">Motivo do churn</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap">GHL</TableHead>
                  <TableHead className="text-zinc-400 whitespace-nowrap text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((cliente) => {
                  const meses = calcularMesesAtivo(cliente.inicio_contrato, cliente.data_saida);
                  const ltv = Number(cliente.fee_mensal) * meses;
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
                      <TableCell className="text-zinc-400 whitespace-nowrap text-xs">
                        {formatarDiaPagamento(cliente)}
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
                      <TableCell className="whitespace-nowrap">
                        {cliente.contempla_ghl
                          ? <Badge className="border-0 text-xs bg-green-500/20 text-green-400">Sim</Badge>
                          : <Badge className="border-0 text-xs bg-zinc-800 text-zinc-500">Não</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <LtvAcoes clienteId={cliente.id} clienteNome={cliente.nome} />
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
