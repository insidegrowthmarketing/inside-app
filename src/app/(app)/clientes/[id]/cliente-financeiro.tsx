"use client";

import { Badge } from "@/components/ui/badge";
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
import { formatarReferencia } from "@/lib/faturas";
import { calcularStatusRuntime } from "@/types/fatura";
import type { Fatura, StatusFaturaRuntime } from "@/types/fatura";
import { cn } from "@/lib/utils";

interface ClienteFinanceiroProps {
  faturas: Fatura[];
  moeda: "BRL" | "USD";
}

function StatusBadgeFatura({ status }: { status: StatusFaturaRuntime }) {
  const cores: Record<StatusFaturaRuntime, string> = {
    pendente: "bg-zinc-700 text-zinc-200",
    paga: "bg-green-900 text-green-300",
    atrasada: "bg-red-900 text-red-300",
    cancelada: "bg-zinc-800 text-zinc-500 line-through",
  };
  const labels: Record<StatusFaturaRuntime, string> = {
    pendente: "Pendente",
    paga: "Paga",
    atrasada: "Atrasada",
    cancelada: "Cancelada",
  };
  return <Badge className={cn("border-0 text-xs font-medium", cores[status])}>{labels[status]}</Badge>;
}

export function ClienteFinanceiro({ faturas, moeda }: ClienteFinanceiroProps) {
  const totalPago = faturas
    .filter((f) => f.status === "paga")
    .reduce((a, f) => a + Number(f.valor), 0);

  const totalPendente = faturas
    .filter((f) => calcularStatusRuntime(f) === "pendente")
    .reduce((a, f) => a + Number(f.valor), 0);

  const totalAtrasado = faturas
    .filter((f) => calcularStatusRuntime(f) === "atrasada")
    .reduce((a, f) => a + Number(f.valor), 0);

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Total pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-white">{formatarMoeda(totalPago, moeda)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Total pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-white">{formatarMoeda(totalPendente, moeda)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-400">Total atrasado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-400">{formatarMoeda(totalAtrasado, moeda)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      {faturas.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nenhuma fatura encontrada para este cliente.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 whitespace-nowrap">Referência</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Vencimento</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Valor</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Status</TableHead>
                <TableHead className="text-zinc-400 whitespace-nowrap">Data pgto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas.map((f) => {
                const statusRT = calcularStatusRuntime(f);
                return (
                  <TableRow key={f.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-300 whitespace-nowrap">
                      {formatarReferencia(f.data_referencia, f.forma_pagamento)}
                    </TableCell>
                    <TableCell className="text-zinc-400 whitespace-nowrap">
                      {formatarData(f.data_vencimento)}
                    </TableCell>
                    <TableCell className="text-zinc-300 whitespace-nowrap">
                      {formatarMoeda(Number(f.valor), f.moeda)}
                    </TableCell>
                    <TableCell><StatusBadgeFatura status={statusRT} /></TableCell>
                    <TableCell className="text-zinc-400 whitespace-nowrap">
                      {formatarData(f.data_pagamento_real)}
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
