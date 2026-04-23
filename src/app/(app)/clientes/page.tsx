import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientesFilters } from "./filters";
import { TabelaClientes } from "./tabela-clientes";
import type { Cliente } from "@/types/cliente";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    busca?: string;
    forma_pagamento?: string;
    gestor_projetos?: string;
    gestor_trafego?: string;
    pacote?: string;
    pais?: string;
  }>;
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clientes")
    .select("*")
    .neq("status", "churn")
    .order("inicio_contrato", { ascending: true, nullsFirst: false });

  if (params.status && params.status !== "todos") {
    query = query.eq("status", params.status);
  }
  if (params.busca) {
    query = query.ilike("nome", `%${params.busca}%`);
  }
  if (params.forma_pagamento && params.forma_pagamento !== "todos") {
    query = query.eq("forma_pagamento", params.forma_pagamento);
  }
  if (params.gestor_projetos && params.gestor_projetos !== "todos") {
    query = query.eq("gestor_projetos", params.gestor_projetos);
  }
  if (params.gestor_trafego && params.gestor_trafego !== "todos") {
    query = query.eq("gestor_trafego", params.gestor_trafego);
  }
  if (params.pacote && params.pacote !== "todos") {
    query = query.eq("pacote", params.pacote);
  }
  if (params.pais === "brasil") {
    query = query.eq("moeda", "BRL");
  } else if (params.pais === "eua") {
    query = query.eq("moeda", "USD");
  }

  const { data: clientes, error } = await query;
  if (error) console.error("Erro ao buscar clientes:", error);

  const filtros = {
    status: params.status || "todos",
    forma_pagamento: params.forma_pagamento || "todos",
    gestor_projetos: params.gestor_projetos || "todos",
    gestor_trafego: params.gestor_trafego || "todos",
    pacote: params.pacote || "todos",
    pais: params.pais || "todos",
    busca: params.busca || "",
  };

  return (
    <div className="space-y-4">
      <PageHeader titulo="Base de Clientes" subtitulo="Gerencie todos os clientes ativos da agência">
        <Link href="/clientes/novo">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        </Link>
      </PageHeader>

      <ClientesFilters filtros={filtros} />

      {!clientes || clientes.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="mb-1 text-lg font-medium text-zinc-300">Nenhum cliente encontrado</p>
            <p className="mb-6 text-sm text-zinc-500">
              {params.busca || params.status ? "Tente ajustar os filtros de busca." : "Cadastre seu primeiro cliente para começar."}
            </p>
            {!params.busca && !params.status && (
              <Link href="/clientes/novo">
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Cadastre seu primeiro cliente</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <TabelaClientes clientes={clientes as Cliente[]} />
      )}
    </div>
  );
}
