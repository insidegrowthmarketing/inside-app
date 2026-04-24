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
import {
  STATUS_CLIENTE,
  FORMAS_PAGAMENTO,
  GESTORES_PROJETOS,
  GESTORES_TRAFEGO,
  PACOTES,
  HEADS,
} from "@/types/cliente";

interface ClientesFiltersProps {
  filtros: {
    status: string;
    forma_pagamento: string;
    gestor_projetos: string;
    gestor_trafego: string;
    pacote: string;
    pais: string;
    head: string;
    busca: string;
  };
}

export function ClientesFilters({ filtros }: ClientesFiltersProps) {
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
        router.push(`/clientes?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const limparFiltros = useCallback(() => {
    startTransition(() => {
      router.push("/clientes");
    });
  }, [router, startTransition]);

  const temFiltroAtivo =
    filtros.status !== "todos" ||
    filtros.forma_pagamento !== "todos" ||
    filtros.gestor_projetos !== "todos" ||
    filtros.gestor_trafego !== "todos" ||
    filtros.pacote !== "todos" ||
    filtros.pais !== "todos" ||
    filtros.head !== "todos" ||
    filtros.busca !== "";

  const triggerCls = "h-9 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-sm";
  const contentCls = "border-zinc-800 bg-zinc-950";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      {/* Linha 1: busca + limpar */}
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nome..."
            defaultValue={filtros.busca}
            onChange={(e) => atualizarFiltro("busca", e.target.value)}
            className="h-9 border-zinc-800 bg-zinc-950 pl-9 text-sm text-zinc-200 placeholder:text-zinc-500"
          />
        </div>

        {temFiltroAtivo && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1 text-zinc-500 hover:text-white text-xs shrink-0"
            onClick={limparFiltros}
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Linha 2: dropdowns compactos lado a lado */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[150px] w-[150px]">
          <Label className="text-xs text-zinc-400">Status</Label>
          <Select value={filtros.status} onValueChange={(v) => { if (v) atualizarFiltro("status", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUS_CLIENTE.filter((s) => s.value !== "churn").map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
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

        <div className="flex flex-col gap-1 min-w-[170px] w-[170px]">
          <Label className="text-xs text-zinc-400">Gestor de Projetos</Label>
          <Select value={filtros.gestor_projetos} onValueChange={(v) => { if (v) atualizarFiltro("gestor_projetos", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {GESTORES_PROJETOS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[170px] w-[170px]">
          <Label className="text-xs text-zinc-400">Gestor de Tráfego</Label>
          <Select value={filtros.gestor_trafego} onValueChange={(v) => { if (v) atualizarFiltro("gestor_trafego", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {GESTORES_TRAFEGO.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[130px] w-[130px]">
          <Label className="text-xs text-zinc-400">Pacote</Label>
          <Select value={filtros.pacote} onValueChange={(v) => { if (v) atualizarFiltro("pacote", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {PACOTES.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[120px] w-[120px]">
          <Label className="text-xs text-zinc-400">País</Label>
          <Select value={filtros.pais} onValueChange={(v) => { if (v) atualizarFiltro("pais", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="brasil">Brasil</SelectItem>
              <SelectItem value="eua">EUA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[110px] w-[110px]">
          <Label className="text-xs text-zinc-400">Head</Label>
          <Select value={filtros.head} onValueChange={(v) => { if (v) atualizarFiltro("head", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {HEADS.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
