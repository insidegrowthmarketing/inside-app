import { Header } from "@/components/header";
import { ClienteForm } from "@/components/cliente-form";

export default function NovoClientePage() {
  return (
    <>
      <Header titulo="Novo cliente" />
      <div className="mx-auto max-w-3xl p-6">
        <ClienteForm />
      </div>
    </>
  );
}
