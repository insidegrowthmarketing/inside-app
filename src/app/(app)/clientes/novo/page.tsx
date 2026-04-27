import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ClienteForm } from "@/components/cliente-form";
import { createClient } from "@/lib/supabase/server";
import { podeCriarCliente } from "@/lib/permissoes";

export default async function NovoClientePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!podeCriarCliente(user?.email)) {
    redirect("/clientes");
  }

  return (
    <div>
      <PageHeader titulo="Novo cliente" subtitulo="Cadastre um novo cliente no sistema" />
      <div className="mx-auto max-w-3xl">
        <ClienteForm isAdmin={true} />
      </div>
    </div>
  );
}
