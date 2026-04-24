"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardFiltroProps {
  dataCorteAtual: string;
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

export function DashboardFiltro({ dataCorteAtual }: DashboardFiltroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const hojeStr = new Date().toISOString().split("T")[0];
  const isHoje = dataCorteAtual === hojeStr || !dataCorteAtual;

  // Determinar qual preset está selecionado
  function getPreset(): string {
    if (isHoje) return "hoje";
    const fimMesPassado = calcularData("fim_mes_passado");
    if (dataCorteAtual === fimMesPassado) return "fim_mes_passado";
    const fim3 = calcularData("fim_3_meses");
    if (dataCorteAtual === fim3) return "fim_3_meses";
    const fim6 = calcularData("fim_6_meses");
    if (dataCorteAtual === fim6) return "fim_6_meses";
    const fimAno = calcularData("fim_ano_passado");
    if (dataCorteAtual === fimAno) return "fim_ano_passado";
    return "personalizada";
  }

  const presetAtual = getPreset();

  const atualizarData = useCallback(
    (data: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const hojeStr = new Date().toISOString().split("T")[0];
      if (data === hojeStr) {
        params.delete("dataCorte");
      } else {
        params.set("dataCorte", data);
      }
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-zinc-500 whitespace-nowrap">Ver métricas até:</Label>
      <Select
        value={presetAtual}
        onValueChange={(v) => {
          if (!v) return;
          if (v === "personalizada") return;
          atualizarData(calcularData(v));
        }}
      >
        <SelectTrigger className="h-8 w-[200px] border-zinc-800 bg-zinc-950 text-zinc-200 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-800 bg-zinc-950">
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="fim_mes_passado">Fim do mês passado</SelectItem>
          <SelectItem value="fim_3_meses">Fim de 3 meses atrás</SelectItem>
          <SelectItem value="fim_6_meses">Fim de 6 meses atrás</SelectItem>
          <SelectItem value="fim_ano_passado">Fim do ano passado</SelectItem>
          <SelectItem value="personalizada">Data personalizada</SelectItem>
        </SelectContent>
      </Select>

      {presetAtual === "personalizada" && (
        <Input
          type="date"
          className="h-8 w-[160px] border-zinc-800 bg-zinc-950 text-zinc-200 text-xs"
          value={dataCorteAtual}
          onChange={(e) => { if (e.target.value) atualizarData(e.target.value); }}
        />
      )}

      {!isHoje && (
        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
          Visualização histórica
        </span>
      )}
    </div>
  );
}
