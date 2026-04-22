import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { FiltrosFaturas } from "./filtros-faturas";
import { TabelaFaturas } from "./tabela-faturas";
import type { FaturaComCliente } from "@/types/fatura";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    forma_pagamento?: string;
    mes?: string;
    moeda?: string;
    busca?: string;
  }>;
}

export default async function CobrancasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const hojeStr = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("faturas")
    .select("*, clientes(nome, id)")
    .order("data_vencimento", { ascending: false })
    .limit(200);

  // Filtro status — 'atrasada' é runtime, então filtramos por pendente + vencida
  if (params.status === "atrasada") {
    query = query.eq("status", "pendente").lt("data_vencimento", hojeStr);
  } else if (params.status === "pendente") {
    query = query.eq("status", "pendente").gte("data_vencimento", hojeStr);
  } else if (params.status && params.status !== "todos") {
    query = query.eq("status", params.status);
  }

  if (params.forma_pagamento && params.forma_pagamento !== "todos") {
    query = query.eq("forma_pagamento", params.forma_pagamento);
  }

  if (params.moeda && params.moeda !== "todos") {
    query = query.eq("moeda", params.moeda);
  }

  if (params.mes && params.mes !== "todos") {
    const [ano, mesNum] = params.mes.split("-").map(Number);
    const inicio = new Date(ano, mesNum - 1, 1).toISOString().split("T")[0];
    const fim = new Date(ano, mesNum, 0).toISOString().split("T")[0];
    query = query.gte("data_referencia", inicio).lte("data_referencia", fim);
  }

  const { data: faturas, error } = await query;

  if (error) {
    console.error("Erro ao buscar faturas:", error);
  }

  let lista = (faturas ?? []) as FaturaComCliente[];

  // Filtro por nome de cliente (client-side pois é um join)
  if (params.busca) {
    const busca = params.busca.toLowerCase();
    lista = lista.filter((f) =>
      f.clientes?.nome?.toLowerCase().includes(busca)
    );
  }

  // Gerar meses disponíveis (12 passados + 3 futuros)
  const hoje = new Date();
  const mesesNome = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const mesesDisponiveis: { value: string; label: string }[] = [];
  for (let i = -12; i <= 3; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mesesDisponiveis.push({
      value: valor,
      label: `${mesesNome[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  mesesDisponiveis.reverse();

  const filtros = {
    status: params.status || "todos",
    forma_pagamento: params.forma_pagamento || "todos",
    mes: params.mes || "todos",
    moeda: params.moeda || "todos",
    busca: params.busca || "",
  };

  return (
    <>
      <Header titulo="Cobranças" />

      <div className="space-y-4 p-6">
        <FiltrosFaturas filtros={filtros} mesesDisponiveis={mesesDisponiveis} />

        {lista.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DollarSign className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="mb-1 text-lg font-medium text-zinc-300">
                Nenhuma fatura encontrada
              </p>
              <p className="text-sm text-zinc-500">
                Ajuste os filtros ou gere faturas no Dashboard Financeiro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <TabelaFaturas faturas={lista} />
        )}
      </div>
    </>
  );
}
