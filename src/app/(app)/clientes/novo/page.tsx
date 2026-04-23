import { PageHeader } from "@/components/page-header";
import { ClienteForm } from "@/components/cliente-form";

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader titulo="Novo cliente" subtitulo="Cadastre um novo cliente no sistema" />
      <div className="mx-auto max-w-3xl">
        <ClienteForm />
      </div>
    </div>
  );
}
