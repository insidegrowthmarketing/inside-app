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
import { GESTORES_PROJETOS, GESTORES_TRAFEGO } from "@/types/cliente";

interface LtvFiltersProps {
  filtros: {
    gestor_projetos: string;
    gestor_trafego: string;
    busca: string;
  };
}

export function LtvFilters({ filtros }: LtvFiltersProps) {
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
        router.push(`/clientes/ltv?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const limparFiltros = useCallback(() => {
    startTransition(() => {
      router.push("/clientes/ltv");
    });
  }, [router, startTransition]);

  const temFiltroAtivo =
    filtros.gestor_projetos !== "todos" ||
    filtros.gestor_trafego !== "todos" ||
    filtros.busca !== "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                <SelectItem key={g} value={g}>{g}</SelectItem>
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
                <SelectItem key={g} value={g}>{g}</SelectItem>
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
