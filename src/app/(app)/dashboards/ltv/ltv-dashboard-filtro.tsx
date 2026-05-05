"use client";

import { Suspense, useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { GESTORES_TRAFEGO, MOTIVOS_CHURN } from "@/types/cliente";

interface LtvDashboardFiltroProps {
  filtros: {
    periodo: string;
    squad: string;
    gestor_trafego: string;
    motivo: string;
    data_inicio: string;
    data_fim: string;
  };
}

function FiltroInner({ filtros }: LtvDashboardFiltroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [calInicioOpen, setCalInicioOpen] = useState(false);
  const [calFimOpen, setCalFimOpen] = useState(false);

  // Motivos selecionados como array
  const motivosSelecionados = filtros.motivo !== "todos"
    ? filtros.motivo.split(",").filter(Boolean)
    : [];

  const atualizarFiltro = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor || valor === "todos") params.delete(chave);
      else params.set(chave, valor);
      startTransition(() => { router.push(`/dashboards/ltv?${params.toString()}`); });
    },
    [router, searchParams, startTransition]
  );

  const atualizarMultiplos = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [chave, valor] of Object.entries(updates)) {
        if (!valor || valor === "todos") params.delete(chave);
        else params.set(chave, valor);
      }
      startTransition(() => { router.push(`/dashboards/ltv?${params.toString()}`); });
    },
    [router, searchParams, startTransition]
  );

  const toggleMotivo = useCallback(
    (motivo: string) => {
      const novos = motivosSelecionados.includes(motivo)
        ? motivosSelecionados.filter((m) => m !== motivo)
        : [...motivosSelecionados, motivo];

      const params = new URLSearchParams(searchParams.toString());
      if (novos.length === 0) {
        params.delete("motivo");
      } else {
        params.set("motivo", novos.join(","));
      }
      startTransition(() => {
        router.push(`/dashboards/ltv?${params.toString()}`);
      });
    },
    [motivosSelecionados, router, searchParams, startTransition]
  );

  const limparMotivos = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("motivo");
    startTransition(() => {
      router.push(`/dashboards/ltv?${params.toString()}`);
    });
  }, [router, searchParams, startTransition]);

  const limpar = useCallback(() => {
    startTransition(() => { router.push("/dashboards/ltv"); });
  }, [router, startTransition]);

  const temFiltro = filtros.periodo !== "todos" || filtros.squad !== "todos" || filtros.gestor_trafego !== "todos" || motivosSelecionados.length > 0;
  const cls = "h-8 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-xs";
  const cc = "border-zinc-800 bg-zinc-950";

  const isPersonalizado = filtros.periodo === "personalizado";

  // Datas para os calendários
  const dataInicioDate = filtros.data_inicio
    ? new Date(filtros.data_inicio + "T12:00:00")
    : undefined;
  const dataFimDate = filtros.data_fim
    ? new Date(filtros.data_fim + "T12:00:00")
    : undefined;

  // Label do botão multi-select motivo
  const labelMotivo = motivosSelecionados.length === 0
    ? "todos"
    : motivosSelecionados.length === 1
    ? motivosSelecionados[0]
    : `${motivosSelecionados.length} selecionados`;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label className="text-xs text-zinc-500">Período (saída)</Label>
        <Select
          value={filtros.periodo}
          onValueChange={(v) => {
            if (!v) return;
            if (v === "personalizado") {
              const hoje = new Date();
              const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
              atualizarMultiplos({
                periodo: "personalizado",
                data_inicio: inicioMes.toISOString().split("T")[0],
                data_fim: hoje.toISOString().split("T")[0],
              });
            } else {
              atualizarMultiplos({
                periodo: v,
                data_inicio: "",
                data_fim: "",
              });
            }
          }}
        >
          <SelectTrigger className={cls}><SelectValue /></SelectTrigger>
          <SelectContent className={cc}>
            <SelectItem value="todos">Todo o histórico</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
            <SelectItem value="personalizado">Período personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DatePickers para período personalizado */}
      {isPersonalizado && (
        <>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-zinc-500">De</Label>
            <Popover open={calInicioOpen} onOpenChange={setCalInicioOpen}>
              <PopoverTrigger
                className="inline-flex h-8 w-[160px] items-center justify-start gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 hover:bg-zinc-900"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-zinc-500" />
                {dataInicioDate && !isNaN(dataInicioDate.getTime())
                  ? format(dataInicioDate, "dd/MM/yyyy", { locale: ptBR })
                  : "Data inicial"}
              </PopoverTrigger>
              <PopoverContent className="w-auto border-zinc-800 bg-zinc-950 p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicioDate}
                  onSelect={(date) => {
                    if (date) {
                      atualizarFiltro("data_inicio", format(date, "yyyy-MM-dd"));
                      setCalInicioOpen(false);
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-zinc-500">Até</Label>
            <Popover open={calFimOpen} onOpenChange={setCalFimOpen}>
              <PopoverTrigger
                className="inline-flex h-8 w-[160px] items-center justify-start gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 hover:bg-zinc-900"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-zinc-500" />
                {dataFimDate && !isNaN(dataFimDate.getTime())
                  ? format(dataFimDate, "dd/MM/yyyy", { locale: ptBR })
                  : "Data final"}
              </PopoverTrigger>
              <PopoverContent className="w-auto border-zinc-800 bg-zinc-950 p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFimDate}
                  onSelect={(date) => {
                    if (date) {
                      atualizarFiltro("data_fim", format(date, "yyyy-MM-dd"));
                      setCalFimOpen(false);
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

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

      {/* Motivo de Churn — Multi-select com Popover + Checkbox */}
      <div className="flex flex-col gap-1 min-w-[200px]">
        <Label className="text-xs text-zinc-500">Motivo de Churn</Label>
        <Popover>
          <PopoverTrigger
            className={`flex items-center justify-between gap-1.5 rounded-lg border py-2 pr-2 pl-2.5 whitespace-nowrap transition-colors outline-none select-none dark:bg-input/30 dark:hover:bg-input/50 ${cls}`}
          >
            <span className="truncate">{labelMotivo}</span>
            <ChevronDown className="size-4 text-muted-foreground pointer-events-none shrink-0" />
          </PopoverTrigger>
          <PopoverContent
            className="w-[260px] border-zinc-800 bg-zinc-950 p-2"
            align="start"
          >
            <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
              {MOTIVOS_CHURN.map((motivo) => (
                <div
                  key={motivo}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => toggleMotivo(motivo)}
                >
                  <Checkbox
                    checked={motivosSelecionados.includes(motivo)}
                    onCheckedChange={() => toggleMotivo(motivo)}
                  />
                  <span className="text-xs text-zinc-200">{motivo}</span>
                </div>
              ))}
            </div>
            {motivosSelecionados.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-zinc-500 hover:text-white"
                onClick={limparMotivos}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar seleção
              </Button>
            )}
          </PopoverContent>
        </Popover>
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
