"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarFaturasDoMes } from "./actions";

export function GerarFaturasButton() {
  const [gerando, setGerando] = useState(false);

  async function handleGerar() {
    setGerando(true);
    const hoje = new Date().toISOString().split("T")[0];
    const resultado = await gerarFaturasDoMes(hoje);
    if ("error" in resultado) {
      toast.error(String(resultado.error));
    } else {
      toast.success(`${resultado.count} faturas geradas`);
    }
    setGerando(false);
  }

  return (
    <Button size="sm" className="gap-2" onClick={handleGerar} disabled={gerando}>
      {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Gerar faturas do mês
    </Button>
  );
}
