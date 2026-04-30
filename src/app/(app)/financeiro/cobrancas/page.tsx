import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { FiltrosFaturas } from "./filtros-faturas";
import { TabelaFaturas } from "./tabela-faturas";
import { CobrancasActions } from "./cobrancas-actions";
import { calcularStatusRuntime } from "@/types/fatura";
import type { FaturaComCliente } from "@/types/fatura";
import { ehAdmin } from "@/lib/permissoes";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    forma_pagamento?: string;
    mes?: string;
    moeda?: string;
    busca?: string;
    tipo?: string;
  }>;
}

export default async function CobrancasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = ehAdmin(user?.email);
  const hojeStr = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("faturas")
    .select("*, clientes(nome, id, responsavel_financeiro, contato_financeiro)")
    .order("data_vencimento", { ascending: false })
    .limit(200);

  if (params.status === "atrasada") {
    query = query.eq("status", "pendente").lt("data_vencimento", hojeStr);
  } else if (params.status === "vence_hoje") {
    query = query.eq("status", "pendente").eq("data_vencimento", hojeStr);
  } else if (params.status === "pendente") {
    query = query.eq("status", "pendente").gte("data_vencimento", hojeStr);
  } else if (params.status && params.status !== "todos") {
    query = query.eq("status", params.status);
  }

  if (params.forma_pagamento && params.forma_pagamento !== "todos") query = query.eq("forma_pagamento", params.forma_pagamento);
  if (params.moeda && params.moeda !== "todos") query = query.eq("moeda", params.moeda);
  if (params.tipo && params.tipo !== "todos") query = query.eq("tipo", params.tipo);

  if (params.mes && params.mes !== "todos") {
    const [ano, mesNum] = params.mes.split("-").map(Number);
    const inicio = new Date(ano, mesNum - 1, 1).toISOString().split("T")[0];
    const fim = new Date(ano, mesNum, 0).toISOString().split("T")[0];
    query = query.gte("data_referencia", inicio).lte("data_referencia", fim);
  }

  const { data: faturas, error } = await query;
  if (error) console.error("Erro ao buscar faturas:", error);

  let lista = (faturas ?? []) as FaturaComCliente[];

  if (params.busca) {
    const busca = params.busca.toLowerCase();
    lista = lista.filter((f) => f.clientes?.nome?.toLowerCase().includes(busca));
  }

  const ordemStatus = { atrasada: 0, vence_hoje: 1, pendente: 2, paga: 3, cancelada: 4 };
  lista.sort((a, b) => {
    const sa = ordemStatus[calcularStatusRuntime(a)] ?? 2;
    const sb = ordemStatus[calcularStatusRuntime(b)] ?? 2;
    if (sa !== sb) return sa - sb;
    return a.data_vencimento.localeCompare(b.data_vencimento);
  });

  const hoje = new Date();
  const mesesNome = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const mesesDisponiveis: { value: string; label: string }[] = [];
  for (let i = -3; i <= 2; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    mesesDisponiveis.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${mesesNome[d.getMonth()]} ${d.getFullYear()}` });
  }
  mesesDisponiveis.reverse();

  // Buscar clientes pra dialog avulsa
  let clientesParaDialog: { id: string; nome: string; forma_pagamento: string | null; moeda: string; fee_mensal: number }[] = [];
  if (isAdmin) {
    const { data: cls } = await supabase.from("clientes").select("id, nome, forma_pagamento, moeda, fee_mensal").neq("status", "churn").order("nome");
    clientesParaDialog = (cls ?? []) as typeof clientesParaDialog;
  }

  const filtros = {
    status: params.status || "todos",
    forma_pagamento: params.forma_pagamento || "todos",
    mes: params.mes || "todos",
    moeda: params.moeda || "todos",
    tipo: params.tipo || "todos",
    busca: params.busca || "",
  };

  return (
    <div className="space-y-4">
      <PageHeader titulo="Cobranças" subtitulo="Todas as faturas do sistema">
        {isAdmin && <CobrancasActions clientes={clientesParaDialog} />}
      </PageHeader>
      <FiltrosFaturas filtros={filtros} mesesDisponiveis={mesesDisponiveis} />

      {lista.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="mb-1 text-lg font-medium text-zinc-300">Nenhuma fatura encontrada</p>
            <p className="text-sm text-zinc-500">Ajuste os filtros ou gere faturas no Dashboard Financeiro.</p>
          </CardContent>
        </Card>
      ) : (
        <TabelaFaturas faturas={lista} isAdmin={isAdmin} />
      )}
    </div>
  );
}
