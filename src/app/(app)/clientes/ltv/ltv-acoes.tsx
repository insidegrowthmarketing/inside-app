"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { excluirCliente } from "../actions";

interface LtvAcoesProps {
  clienteId: string;
  clienteNome: string;
  isAdmin: boolean;
}

export function LtvAcoes({ clienteId, clienteNome, isAdmin }: LtvAcoesProps) {
  const router = useRouter();
  const [excluirAberto, setExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleExcluir() {
    setExcluindo(true);
    const res = await excluirCliente(clienteId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Cliente excluído com sucesso");
    }
    setExcluindo(false);
    setExcluirAberto(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="border-zinc-800 bg-zinc-950">
          <DropdownMenuItem className="text-zinc-300 gap-2" onClick={() => router.push(`/clientes/${clienteId}`)}>
            <Pencil className="h-3.5 w-3.5" />
            Ver detalhes
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem className="text-red-400 gap-2" onClick={() => setExcluirAberto(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Excluir cliente
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={excluirAberto} onOpenChange={(open) => { if (!open) setExcluirAberto(false); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-200">Excluir cliente definitivamente?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. Todos os dados de{" "}
              <strong className="text-zinc-200">{clienteNome}</strong>{" "}
              serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setExcluirAberto(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluir} disabled={excluindo}>
              Sim, excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
