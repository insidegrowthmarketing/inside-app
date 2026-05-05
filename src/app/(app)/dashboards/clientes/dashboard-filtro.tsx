"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GESTORES_PROJETOS, GESTORES_TRAFEGO, MOTIVOS_CHURN } from "@/types/cliente";

interface DashboardFiltroProps {
  filtros: {
    dataCorte: string;
    gestor_projetos: string;
    gestor_trafego: string;
    squad: string;
    motivo_churn: string;
    mes_churn: string;
  };
}

function calcularData(opcao: string): string {
  const hoje = new Date();
  switch (opcao) {
    case "hoje":
      return hoje.toISOString().split("T")[0];
    case "fim_mes_passado": {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return d.toISOString().split("T")[0];
    }
    case "fim_3_meses": {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 0);
      return d.toISOString().split("T")[0];
    }
    case "fim_6_meses": {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 0);
      return d.toISOString().split("T")[0];
    }
    case "fim_ano_passado": {
      const d = new Date(hoje.getFullYear() - 1, 11, 31);
      return d.toISOString().split("T")[0];
    }
    default:
      return hoje.toISOString().split("T")[0];
  }
}

export function DashboardFiltro({ filtros }: DashboardFiltroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const hojeStr = new Date().toISOString().split("T")[0];
  const isHoje = filtros.dataCorte === hojeStr || !filtros.dataCorte;

  function getPreset(): string {
    if (isHoje) return "hoje";
    const dc = filtros.dataCorte;
    if (dc === calcularData("fim_mes_passado")) return "fim_mes_passado";
    if (dc === calcularData("fim_3_meses")) return "fim_3_meses";
    if (dc === calcularData("fim_6_meses")) return "fim_6_meses";
    if (dc === calcularData("fim_ano_passado")) return "fim_ano_passado";
    return "personalizada";
  }

  const presetAtual = getPreset();

  const atualizarFiltro = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor || valor === "todos" || (chave === "dataCorte" && valor === hojeStr)) {
        params.delete(chave);
      } else {
        params.set(chave, valor);
      }
      startTransition(() => {
        router.push(`/dashboards/clientes?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition, hojeStr]
  );

  const limparFiltros = useCallback(() => {
    startTransition(() => { router.push("/dashboards/clientes"); });
  }, [router, startTransition]);

  const temFiltroAtivo =
    !isHoje ||
    filtros.gestor_projetos !== "todos" ||
    filtros.gestor_trafego !== "todos" ||
    filtros.squad !== "todos" ||
    filtros.motivo_churn !== "todos" ||
    filtros.mes_churn !== "todos";

  const triggerCls = "h-8 w-full border-zinc-800 bg-zinc-950 text-zinc-200 text-xs";
  const contentCls = "border-zinc-800 bg-zinc-950";

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Período */}
      <div className="flex flex-col gap-1 min-w-[190px]">
        <Label className="text-xs text-zinc-500">Período</Label>
        <Select
          value={presetAtual}
          onValueChange={(v) => {
            if (!v) return;
            if (v === "personalizada") {
              // Setar data de hoje como ponto de partida pra customização
              atualizarFiltro("dataCorte", new Date().toISOString().split("T")[0]);
              return;
            }
            atualizarFiltro("dataCorte", calcularData(v));
          }}
        >
          <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
          <SelectContent className={contentCls}>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="fim_mes_passado">Fim do mês passado</SelectItem>
            <SelectItem value="fim_3_meses">Fim de 3 meses atrás</SelectItem>
            <SelectItem value="fim_6_meses">Fim de 6 meses atrás</SelectItem>
            <SelectItem value="fim_ano_passado">Fim do ano passado</SelectItem>
            <SelectItem value="personalizada">Data personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {presetAtual === "personalizada" && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-zinc-500">Data</Label>
          <Input
            type="date"
            className="h-8 w-[150px] border-zinc-800 bg-zinc-950 text-zinc-200 text-xs"
            value={filtros.dataCorte}
            onChange={(e) => { if (e.target.value) atualizarFiltro("dataCorte", e.target.value); }}
          />
        </div>
      )}

      {/* Gestor de Projetos */}
      <div className="flex flex-col gap-1 min-w-[170px]">
        <Label className="text-xs text-zinc-500">Gestor de Projetos</Label>
        <Select value={filtros.gestor_projetos} onValueChange={(v) => { if (v) atualizarFiltro("gestor_projetos", v); }}>
          <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent className={contentCls}>
            <SelectItem value="todos">Todos</SelectItem>
            {GESTORES_PROJETOS.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Gestor de Tráfego */}
      <div className="flex flex-col gap-1 min-w-[170px]">
        <Label className="text-xs text-zinc-500">Gestor de Tráfego</Label>
        <Select value={filtros.gestor_trafego} onValueChange={(v) => { if (v) atualizarFiltro("gestor_trafego", v); }}>
          <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent className={contentCls}>
            <SelectItem value="todos">Todos</SelectItem>
            {GESTORES_TRAFEGO.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Squad */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <Label className="text-xs text-zinc-500">Squad</Label>
        <Select value={filtros.squad} onValueChange={(v) => { if (v) atualizarFiltro("squad", v); }}>
          <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent className={contentCls}>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="high_impact">High Impact</SelectItem>
            <SelectItem value="genesis">Genesis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Motivo do Churn */}
      <div className="flex flex-col gap-1 min-w-[200px]">
        <Label className="text-xs text-zinc-500">Motivo do Churn</Label>
        <Select value={filtros.motivo_churn} onValueChange={(v) => { if (v) atualizarFiltro("motivo_churn", v); }}>
          <SelectTrigger className={triggerCls}><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent className={contentCls}>
            <SelectItem value="todos">Todos</SelectItem>
            {MOTIVOS_CHURN.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Mês do Churn */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <Label className="text-xs text-zinc-500">Mês do Churn</Label>
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

      {/* Limpar */}
      {temFiltroAtivo && (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-500 hover:text-white text-xs shrink-0" onClick={limparFiltros}>
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}

      {!isHoje && (
        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded self-end mb-1">
          Visualização histórica
        </span>
      )}
    </div>
  );
}
