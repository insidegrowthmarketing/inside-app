"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMAS_PAGAMENTO } from "@/types/cliente";

interface FiltrosFaturasProps {
  filtros: {
    status: string;
    forma_pagamento: string;
    mes: string;
    moeda: string;
    busca: string;
  };
  mesesDisponiveis: { value: string; label: string }[];
}

export function FiltrosFaturas({ filtros, mesesDisponiveis }: FiltrosFaturasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const atualizarFiltro = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor || valor === "todos") {
        params.delete(chave);
      } else {
        params.set(chave, valor);
      }
      startTransition(() => {
        router.push(`/financeiro/cobrancas?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const limparFiltros = useCallback(() => {
    startTransition(() => {
      router.push("/financeiro/cobrancas");
    });
  }, [router, startTransition]);

  const temFiltroAtivo =
    filtros.status !== "todos" ||
    filtros.forma_pagamento !== "todos" ||
    filtros.mes !== "todos" ||
    filtros.moeda !== "todos" ||
    filtros.busca !== "";

  const triggerCls = "h-9 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-sm";
  const contentCls = "border-zinc-800 bg-zinc-950";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por cliente..."
            defaultValue={filtros.busca}
            onChange={(e) => atualizarFiltro("busca", e.target.value)}
            className="h-9 border-zinc-800 bg-zinc-950 pl-9 text-sm text-zinc-200 placeholder:text-zinc-500"
          />
        </div>
        {temFiltroAtivo && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-zinc-500 hover:text-white text-xs shrink-0" onClick={limparFiltros}>
            <X className="h-3 w-3" /> Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[140px] w-[140px]">
          <Label className="text-xs text-zinc-400">Status</Label>
          <Select value={filtros.status} onValueChange={(v) => { if (v) atualizarFiltro("status", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="paga">Pagas</SelectItem>
              <SelectItem value="atrasada">Atrasadas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[200px] w-[200px]">
          <Label className="text-xs text-zinc-400">Pagamento</Label>
          <Select value={filtros.forma_pagamento} onValueChange={(v) => { if (v) atualizarFiltro("forma_pagamento", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todas</SelectItem>
              {FORMAS_PAGAMENTO.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[160px] w-[160px]">
          <Label className="text-xs text-zinc-400">Mês referência</Label>
          <Select value={filtros.mes} onValueChange={(v) => { if (v) atualizarFiltro("mes", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {mesesDisponiveis.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[110px] w-[110px]">
          <Label className="text-xs text-zinc-400">Moeda</Label>
          <Select value={filtros.moeda} onValueChange={(v) => { if (v) atualizarFiltro("moeda", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
