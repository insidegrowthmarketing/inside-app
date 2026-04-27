"use client";

import { Suspense, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GESTORES_TRAFEGO, MOTIVOS_CHURN } from "@/types/cliente";

interface LtvDashboardFiltroProps {
  filtros: {
    periodo: string;
    squad: string;
    gestor_trafego: string;
    motivo: string;
  };
}

function FiltroInner({ filtros }: LtvDashboardFiltroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const atualizarFiltro = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor || valor === "todos") params.delete(chave);
      else params.set(chave, valor);
      startTransition(() => { router.push(`/dashboards/ltv?${params.toString()}`); });
    },
    [router, searchParams, startTransition]
  );

  const limpar = useCallback(() => {
    startTransition(() => { router.push("/dashboards/ltv"); });
  }, [router, startTransition]);

  const temFiltro = filtros.periodo !== "todos" || filtros.squad !== "todos" || filtros.gestor_trafego !== "todos" || filtros.motivo !== "todos";
  const cls = "h-8 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-xs";
  const cc = "border-zinc-800 bg-zinc-950";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label className="text-xs text-zinc-500">Período (saída)</Label>
        <Select value={filtros.periodo} onValueChange={(v) => { if (v) atualizarFiltro("periodo", v); }}>
          <SelectTrigger className={cls}><SelectValue /></SelectTrigger>
          <SelectContent className={cc}>
            <SelectItem value="todos">Todo o histórico</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <Label className="text-xs text-zinc-500">Squad</Label>
        <Select value={filtros.squad} onValueChange={(v) => { if (v) atualizarFiltro("squad", v); }}>
          <SelectTrigger className={cls}><SelectValue /></SelectTrigger>
          <SelectContent className={cc}>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="high_impact">High Impact</SelectItem>
            <SelectItem value="genesis">Genesis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[170px]">
        <Label className="text-xs text-zinc-500">Gestor de Tráfego</Label>
        <Select value={filtros.gestor_trafego} onValueChange={(v) => { if (v) atualizarFiltro("gestor_trafego", v); }}>
          <SelectTrigger className={cls}><SelectValue /></SelectTrigger>
          <SelectContent className={cc}>
            <SelectItem value="todos">Todos</SelectItem>
            {GESTORES_TRAFEGO.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[200px]">
        <Label className="text-xs text-zinc-500">Motivo de Churn</Label>
        <Select value={filtros.motivo} onValueChange={(v) => { if (v) atualizarFiltro("motivo", v); }}>
          <SelectTrigger className={cls}><SelectValue /></SelectTrigger>
          <SelectContent className={cc}>
            <SelectItem value="todos">Todos</SelectItem>
            {MOTIVOS_CHURN.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {temFiltro && (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-500 hover:text-white text-xs" onClick={limpar}>
          <X className="h-3 w-3" /> Limpar
        </Button>
      )}
    </div>
  );
}

export function LtvDashboardFiltro(props: LtvDashboardFiltroProps) {
  return (
    <Suspense fallback={<div className="h-8" />}>
      <FiltroInner {...props} />
    </Suspense>
  );
}
