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
import { GESTORES_PROJETOS, GESTORES_TRAFEGO, MOTIVOS_CHURN } from "@/types/cliente";

interface LtvFiltersProps {
  filtros: {
    gestor_projetos: string;
    gestor_trafego: string;
    pais: string;
    motivo_churn: string;
    mes_churn: string;
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
      if (!valor || valor === "todos") params.delete(chave);
      else params.set(chave, valor);
      startTransition(() => { router.push(`/clientes/ltv?${params.toString()}`); });
    },
    [router, searchParams, startTransition]
  );

  const limparFiltros = useCallback(() => {
    startTransition(() => { router.push("/clientes/ltv"); });
  }, [router, startTransition]);

  const temFiltroAtivo =
    filtros.gestor_projetos !== "todos" ||
    filtros.gestor_trafego !== "todos" ||
    filtros.pais !== "todos" ||
    filtros.motivo_churn !== "todos" ||
    filtros.mes_churn !== "todos" ||
    filtros.busca !== "";

  const triggerCls = "h-9 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-sm";
  const contentCls = "border-zinc-800 bg-zinc-950";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por nome..." defaultValue={filtros.busca} onChange={(e) => atualizarFiltro("busca", e.target.value)} className="h-9 border-zinc-800 bg-zinc-950 pl-9 text-sm text-zinc-200 placeholder:text-zinc-500" />
        </div>
        {temFiltroAtivo && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-zinc-500 hover:text-white text-xs shrink-0" onClick={limparFiltros}>
            <X className="h-3 w-3" /> Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[180px] w-[180px]">
          <Label className="text-xs text-zinc-400">Gestor de Projetos</Label>
          <Select value={filtros.gestor_projetos} onValueChange={(v) => { if (v) atualizarFiltro("gestor_projetos", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}><SelectItem value="todos">Todos</SelectItem>{GESTORES_PROJETOS.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[180px] w-[180px]">
          <Label className="text-xs text-zinc-400">Gestor de Tráfego</Label>
          <Select value={filtros.gestor_trafego} onValueChange={(v) => { if (v) atualizarFiltro("gestor_trafego", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}><SelectItem value="todos">Todos</SelectItem>{GESTORES_TRAFEGO.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[200px] w-[200px]">
          <Label className="text-xs text-zinc-400">Motivo do Churn</Label>
          <Select value={filtros.motivo_churn} onValueChange={(v) => { if (v) atualizarFiltro("motivo_churn", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}><SelectItem value="todos">Todos</SelectItem>{MOTIVOS_CHURN.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[180px] w-[180px]">
          <Label className="text-xs text-zinc-400">Mês do Churn</Label>
          <Select value={filtros.mes_churn} onValueChange={(v) => { if (v) atualizarFiltro("mes_churn", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}>
              <SelectItem value="todos">Todos</SelectItem>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                const mesesNome = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
                return <SelectItem key={valor} value={valor}>{mesesNome[d.getMonth()]}/{d.getFullYear()}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[120px] w-[120px]">
          <Label className="text-xs text-zinc-400">País</Label>
          <Select value={filtros.pais} onValueChange={(v) => { if (v) atualizarFiltro("pais", v); }}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className={contentCls}><SelectItem value="todos">Todos</SelectItem><SelectItem value="brasil">Brasil</SelectItem><SelectItem value="eua">EUA</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
