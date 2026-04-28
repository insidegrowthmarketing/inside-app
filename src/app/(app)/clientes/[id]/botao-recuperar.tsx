"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recuperarCliente } from "../actions";

interface BotaoRecuperarProps {
  clienteId: string;
  clienteNome: string;
}

export function BotaoRecuperar({ clienteId, clienteNome }: BotaoRecuperarProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [recuperando, setRecuperando] = useState(false);

  const handleRecuperar = async () => {
    setRecuperando(true);
    const resultado = await recuperarCliente(clienteId);

    if (resultado?.error) {
      toast.error(resultado.error);
      setRecuperando(false);
      setAberto(false);
    } else {
      const faturas = "faturasGeradas" in resultado ? resultado.faturasGeradas ?? 0 : 0;
      toast.success(`Cliente recuperado com sucesso.${faturas > 0 ? ` ${faturas} faturas geradas.` : ""}`);
      router.push("/clientes");
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2 text-green-400 hover:text-green-300 hover:bg-green-900/20" />
        }
      >
        <RefreshCw className="h-4 w-4" />
        Recuperar
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">Recuperar cliente?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            O cliente <strong className="text-zinc-200">{clienteNome}</strong> voltará
            para a base de clientes ativa com status &quot;Ongoing&quot;. Os dados de churn
            (data de saída e motivo) serão removidos e novas faturas serão geradas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleRecuperar} disabled={recuperando}>
            {recuperando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, recuperar cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
