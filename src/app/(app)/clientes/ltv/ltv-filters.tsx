"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LtvFiltersProps {
  buscaAtual: string;
}

export function LtvFilters({ buscaAtual }: LtvFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const atualizarBusca = useCallback(
    (valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valor) {
        params.delete("busca");
      } else {
        params.set("busca", valor);
      }
      startTransition(() => {
        router.push(`/clientes/ltv?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        placeholder="Buscar por nome..."
        defaultValue={buscaAtual}
        onChange={(e) => atualizarBusca(e.target.value)}
        className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-200 placeholder:text-zinc-500"
      />
    </div>
  );
}
