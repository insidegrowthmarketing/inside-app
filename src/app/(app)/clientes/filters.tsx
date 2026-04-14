"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_CLIENTE } from "@/types/cliente";

interface ClientesFiltersProps {
  statusAtual: string;
  buscaAtual: string;
}

export function ClientesFilters({ statusAtual, buscaAtual }: ClientesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  /** Atualiza os query params sem recarregar a página */
  const atualizarFiltros = useCallback(
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Tabs de status */}
      <Tabs value={statusAtual} onValueChange={(v) => atualizarFiltros("status", v)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="todos" className="text-xs data-[state=active]:bg-zinc-800">
            Todos
          </TabsTrigger>
          {STATUS_CLIENTE.map((s) => (
            <TabsTrigger
              key={s.value}
              value={s.value}
              className="text-xs data-[state=active]:bg-zinc-800"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Campo de busca */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Buscar por nome..."
          defaultValue={buscaAtual}
          onChange={(e) => atualizarFiltros("busca", e.target.value)}
          className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-200 placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}
