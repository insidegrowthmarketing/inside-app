"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogCobrancaAvulsa } from "@/components/dialog-cobranca-avulsa";

interface CobrancasActionsProps {
  clientes: { id: string; nome: string; forma_pagamento: string | null; moeda: string; fee_mensal: number }[];
}

export function CobrancasActions({ clientes }: CobrancasActionsProps) {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = useState(false);

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setDialogAberto(true)}>
        <Plus className="h-4 w-4" />
        Nova cobrança avulsa
      </Button>

      <DialogCobrancaAvulsa
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        onSucesso={() => { router.refresh(); }}
        clientes={clientes}
      />
    </>
  );
}
