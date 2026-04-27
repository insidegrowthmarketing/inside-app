import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { BotaoExcluir } from "./botao-excluir";
import { ClienteTabs } from "./cliente-tabs";
import type { Fatura } from "@/types/fatura";
import { ehAdmin } from "@/lib/permissoes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalhesClientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = ehAdmin(user?.email);

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cliente) {
    notFound();
  }

  const { data: faturas } = await supabase
    .from("faturas")
    .select("*")
    .eq("cliente_id", id)
    .order("data_vencimento", { ascending: false });

  return (
    <div>
      <PageHeader titulo={cliente.nome} subtitulo="Editar informações do cliente">
        {isAdmin && <BotaoExcluir clienteId={cliente.id} clienteNome={cliente.nome} />}
      </PageHeader>
      <div className="mx-auto max-w-3xl">
        <ClienteTabs cliente={cliente} faturas={(faturas ?? []) as Fatura[]} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
