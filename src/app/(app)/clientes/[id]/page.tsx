import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { BotaoExcluir } from "./botao-excluir";
import { ClienteTabs } from "./cliente-tabs";
import type { Fatura } from "@/types/fatura";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalhesClientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cliente) {
    notFound();
  }

  // Buscar faturas do cliente
  const { data: faturas } = await supabase
    .from("faturas")
    .select("*")
    .eq("cliente_id", id)
    .order("data_vencimento", { ascending: false });

  return (
    <>
      <Header titulo={cliente.nome}>
        <BotaoExcluir clienteId={cliente.id} clienteNome={cliente.nome} />
      </Header>
      <div className="mx-auto max-w-3xl p-6">
        <ClienteTabs cliente={cliente} faturas={(faturas ?? []) as Fatura[]} />
      </div>
    </>
  );
}
