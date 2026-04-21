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
} from "@/types/cliente";

interface ClientesFiltersProps {
  filtros: {
    status: string;
    forma_pagamento: string;
    gestor_projetos: string;
    gestor_trafego: string;
    pacote: string;
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
    filtros.busca !== "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Status</Label>
          <Select
            value={filtros.status}
            onValueChange={(v) => { if (v) atualizarFiltro("status", v); }}
          >
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-200 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950">
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_CLIENTE.filter((s) => s.value !== "churn").map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Forma de pagamento</Label>
          <Select
            value={filtros.forma_pagamento}
            onValueChange={(v) => { if (v) atualizarFiltro("forma_pagamento", v); }}
          >
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-200 text-xs">
              <SelectValue placeholder="Forma de pagamento" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950">
              <SelectItem value="todos">Todas as formas</SelectItem>
              {FORMAS_PAGAMENTO.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Gestor de Projetos</Label>
          <Select
            value={filtros.gestor_projetos}
            onValueChange={(v) => { if (v) atualizarFiltro("gestor_projetos", v); }}
          >
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-200 text-xs">
              <SelectValue placeholder="Gestor de projetos" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950">
              <SelectItem value="todos">Todos os gestores</SelectItem>
              {GESTORES_PROJETOS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Gestor de Tráfego</Label>
          <Select
            value={filtros.gestor_trafego}
            onValueChange={(v) => { if (v) atualizarFiltro("gestor_trafego", v); }}
          >
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-200 text-xs">
              <SelectValue placeholder="Gestor de tráfego" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950">
              <SelectItem value="todos">Todos os gestores</SelectItem>
              {GESTORES_TRAFEGO.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Pacote</Label>
          <Select
            value={filtros.pacote}
            onValueChange={(v) => { if (v) atualizarFiltro("pacote", v); }}
          >
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-200 text-xs">
              <SelectValue placeholder="Pacote" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950">
              <SelectItem value="todos">Todos os pacotes</SelectItem>
              {PACOTES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nome..."
            defaultValue={filtros.busca}
            onChange={(e) => atualizarFiltro("busca", e.target.value)}
            className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-200 placeholder:text-zinc-500"
          />
        </div>

        {temFiltroAtivo && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-zinc-400 hover:text-white text-xs"
            onClick={limparFiltros}
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
