"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [motivoOpen, setMotivoOpen] = useState(false);
  const motivoRef = useRef<HTMLDivElement>(null);

  // Motivos selecionados como array
  const motivosSelecionados = filtros.motivo_churn !== "todos"
    ? filtros.motivo_churn.split(",").filter(Boolean)
    : [];

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!motivoOpen) return;
    function handleClick(e: MouseEvent) {
      if (motivoRef.current && !motivoRef.current.contains(e.target as Node)) {
        setMotivoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [motivoOpen]);

  const atualizarFiltro = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor || valor === "todos") params.delete(chave);
      else params.set(chave, valor);
      startTransition(() => { router.push(`/clientes/ltv?${params.toString()}`); });
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
        params.delete("motivo_churn");
      } else {
        params.set("motivo_churn", novos.join(","));
      }
      startTransition(() => {
        router.push(`/clientes/ltv?${params.toString()}`);
      });
    },
    [motivosSelecionados, router, searchParams, startTransition]
  );

  const limparMotivos = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("motivo_churn");
    startTransition(() => {
      router.push(`/clientes/ltv?${params.toString()}`);
    });
  }, [router, searchParams, startTransition]);

  const limparFiltros = useCallback(() => {
    startTransition(() => { router.push("/clientes/ltv"); });
  }, [router, startTransition]);

  const temFiltroAtivo =
    filtros.gestor_projetos !== "todos" ||
    filtros.gestor_trafego !== "todos" ||
    filtros.pais !== "todos" ||
    motivosSelecionados.length > 0 ||
    filtros.mes_churn !== "todos" ||
    filtros.busca !== "";

  const triggerCls = "h-9 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-sm";
  const contentCls = "border-zinc-800 bg-zinc-950";

  const labelMotivo = motivosSelecionados.length === 0
    ? "todos"
    : motivosSelecionados.length === 1
    ? motivosSelecionados[0]
    : `${motivosSelecionados.length} selecionados`;

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

        {/* Motivo do Churn — Multi-select dropdown (sem Popover) */}
        <div className="flex flex-col gap-1 min-w-[180px] w-[180px]" ref={motivoRef}>
          <Label className="text-xs text-zinc-400">Motivo do Churn</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMotivoOpen((v) => !v)}
              className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 border-zinc-800 bg-zinc-950 text-zinc-200"
            >
              <span className="flex flex-1 text-left line-clamp-1">{labelMotivo}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground pointer-events-none" />
            </button>
            {motivoOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[260px] rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-md">
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
              </div>
            )}
          </div>
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
