import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, formatarData } from "@/lib/formatters";
import { STATUS_CLIENTE } from "@/types/cliente";
import { ClientesFilters } from "./filters";

interface PageProps {
  searchParams: Promise<{ status?: string; busca?: string }>;
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Monta a query com filtros
  let query = supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "todos") {
    query = query.eq("status", params.status);
  }

  if (params.busca) {
    query = query.ilike("nome", `%${params.busca}%`);
  }

  const { data: clientes, error } = await query;

  if (error) {
    console.error("Erro ao buscar clientes:", error);
  }

  return (
    <>
      <Header titulo="Clientes">
        <Link href="/clientes/novo">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        </Link>
      </Header>

      <div className="space-y-4 p-6">
        {/* Filtros */}
        <ClientesFilters
          statusAtual={params.status || "todos"}
          buscaAtual={params.busca || ""}
        />

        {/* Tabela ou estado vazio */}
        {!clientes || clientes.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="mb-1 text-lg font-medium text-zinc-300">
                Nenhum cliente encontrado
              </p>
              <p className="mb-6 text-sm text-zinc-500">
                {params.busca || params.status
                  ? "Tente ajustar os filtros de busca."
                  : "Cadastre seu primeiro cliente para começar."}
              </p>
              {!params.busca && !params.status && (
                <Link href="/clientes/novo">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Cadastre seu primeiro cliente
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-zinc-800 bg-zinc-900">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Nome</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Fee mensal</TableHead>
                  <TableHead className="text-zinc-400">Gestor de projetos</TableHead>
                  <TableHead className="text-zinc-400">Gestor de tráfego</TableHead>
                  <TableHead className="text-zinc-400">Início contrato</TableHead>
                  <TableHead className="text-zinc-400 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-zinc-200">
                      {cliente.nome}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={cliente.status} />
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatarMoeda(Number(cliente.fee_mensal))}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {cliente.gestor_projetos || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {cliente.gestor_trafego || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatarData(cliente.inicio_contrato)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clientes/${cliente.id}`}>
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
