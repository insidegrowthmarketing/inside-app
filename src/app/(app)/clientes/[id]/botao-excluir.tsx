"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
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
import { excluirCliente } from "../actions";

interface BotaoExcluirProps {
  clienteId: string;
  clienteNome: string;
}

export function BotaoExcluir({ clienteId, clienteNome }: BotaoExcluirProps) {
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const handleExcluir = async () => {
    setExcluindo(true);
    const resultado = await excluirCliente(clienteId);

    if (resultado?.error) {
      toast.error(resultado.error);
      setExcluindo(false);
      setAberto(false);
    } else {
      toast.success("Cliente excluído com sucesso.");
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20" />
        }
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">Excluir cliente</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Tem certeza que deseja excluir <strong className="text-zinc-200">{clienteNome}</strong>?
            Essa ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={() => setAberto(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleExcluir}
            disabled={excluindo}
          >
            {excluindo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
