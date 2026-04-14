import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ClienteForm } from "@/components/cliente-form";
import { createClient } from "@/lib/supabase/server";
import { BotaoExcluir } from "./botao-excluir";

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

  return (
    <>
      <Header titulo={cliente.nome}>
        <BotaoExcluir clienteId={cliente.id} clienteNome={cliente.nome} />
      </Header>
      <div className="mx-auto max-w-3xl p-6">
        <ClienteForm cliente={cliente} />
      </div>
    </>
  );
}
