"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIAS_SEMANA } from "@/types/fatura";

interface DadosDia {
  data_pagamento: number | null;
  dia_semana_pagamento: number | null;
  dias_pagamento_quinzenal: number[] | null;
  data_inicio_quinzenal: string | null;
}

interface DialogMudarFormaPagamentoProps {
  open: boolean;
  onClose: () => void;
  novaForma: string;
  onConfirm: (dados: DadosDia) => void;
}

export function DialogMudarFormaPagamento({
  open,
  onClose,
  novaForma,
  onConfirm,
}: DialogMudarFormaPagamentoProps) {
  const fp = novaForma.toLowerCase();
  const ehMensal = fp.includes("mensal");
  const ehSemanal = fp.includes("semanal") && !fp.includes("quinzenal");
  const ehQuinzenal = fp.includes("quinzenal");

  const [diaMes, setDiaMes] = useState<number | "">("");
  const [diaSemana, setDiaSemana] = useState<string>("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);

  const podeConfirmar =
    (ehMensal && diaMes !== "" && Number(diaMes) >= 1 && Number(diaMes) <= 31) ||
    (ehSemanal && diaSemana !== "") ||
    (ehQuinzenal && dataInicio);

  function handleConfirm() {
    const dados: DadosDia = {
      data_pagamento: ehMensal ? Number(diaMes) : null,
      dia_semana_pagamento: ehSemanal ? Number(diaSemana) : null,
      dias_pagamento_quinzenal: null,
      data_inicio_quinzenal: ehQuinzenal ? dataInicio : null,
    };
    onConfirm(dados);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">Configurar dia de pagamento</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Você está alterando a forma de pagamento para <strong className="text-zinc-200">{novaForma}</strong>.
            Defina quando o cliente deve ser cobrado.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {ehMensal && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Dia do mês (1-31)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 10"
                value={diaMes}
                onChange={(e) => setDiaMes(e.target.value ? Number(e.target.value) : "")}
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
              />
            </div>
          )}

          {ehSemanal && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Dia da semana</Label>
              <Select value={diaSemana} onValueChange={(v) => { if (v) setDiaSemana(v); }}>
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {ehQuinzenal && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Data da primeira cobrança</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
              />
              <p className="text-xs text-zinc-500">As próximas cobranças serão a cada 15 dias</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!podeConfirmar}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
