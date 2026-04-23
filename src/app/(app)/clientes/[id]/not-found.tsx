import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function ClienteNaoEncontrado() {
  return (
    <div>
      <PageHeader titulo="Cliente não encontrado" />
      <div className="flex flex-col items-center justify-center py-32">
        <p className="mb-1 text-lg font-medium text-zinc-300">
          Cliente não encontrado
        </p>
        <p className="mb-6 text-sm text-zinc-500">
          O cliente que você está procurando não existe ou foi removido.
        </p>
        <Link href="/clientes">
          <Button variant="ghost" className="text-zinc-400 hover:text-white">
            Voltar para clientes
          </Button>
        </Link>
      </div>
    </div>
  );
}
