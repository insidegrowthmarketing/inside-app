"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { formatarMoeda } from "@/lib/formatters";
import { FORMAS_PAGAMENTO, MOEDAS } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";
import { criarCobrancaAvulsa } from "@/app/(app)/financeiro/actions";

interface DialogCobrancaAvulsaProps {
  open: boolean;
  onClose: () => void;
  onSucesso: () => void;
  clientes: { id: string; nome: string; forma_pagamento: string | null; moeda: string; fee_mensal: number }[];
}

export function DialogCobrancaAvulsa({ open, onClose, onSucesso, clientes }: DialogCobrancaAvulsaProps) {
  const [clienteId, setClienteId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [moeda, setMoeda] = useState<"BRL" | "USD">("USD");
  const [frequencia, setFrequencia] = useState<"unica" | "recorrente" | "parcelada">("unica");
  const [quantidade, setQuantidade] = useState(2);
  const [periodicidade, setPeriodicidade] = useState<"semanal" | "quinzenal" | "mensal">("mensal");
  const [dataPrimeira, setDataPrimeira] = useState(new Date().toISOString().split("T")[0]);
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [criando, setCriando] = useState(false);

  // Auto-preencher ao selecionar cliente
  useEffect(() => {
    if (!clienteId) return;
    const c = clientes.find((cl) => cl.id === clienteId);
    if (c) {
      setFormaPagamento(c.forma_pagamento || "");
      setMoeda((c.moeda || "USD") as "BRL" | "USD");
    }
  }, [clienteId, clientes]);

  // Preview das datas
  const qtd = frequencia === "unica" ? 1 : quantidade;
  const previewDatas: string[] = [];
  if (dataPrimeira && qtd > 0) {
    const primeira = new Date(dataPrimeira + "T00:00:00");
    for (let i = 0; i < qtd; i++) {
      const d = new Date(primeira);
      if (i > 0) {
        switch (periodicidade) {
          case "semanal": d.setDate(d.getDate() + 7 * i); break;
          case "quinzenal": d.setDate(d.getDate() + 15 * i); break;
          case "mensal": d.setMonth(d.getMonth() + i); break;
        }
      }
      previewDatas.push(d.toLocaleDateString("pt-BR"));
    }
  }
  const totalPreview = valor * qtd;

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const podeConfirmar = clienteId && formaPagamento && valor > 0 && dataPrimeira;

  async function handleCriar() {
    if (!podeConfirmar) return;
    setCriando(true);
    const resultado = await criarCobrancaAvulsa({
      cliente_id: clienteId,
      forma_pagamento: formaPagamento,
      moeda,
      frequencia,
      quantidade: qtd,
      periodicidade: frequencia === "unica" ? null : periodicidade,
      data_primeira_cobranca: dataPrimeira,
      valor_por_fatura: valor,
      descricao: descricao || null,
    });
    setCriando(false);

    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success(`${resultado.count} fatura${resultado.count > 1 ? "s" : ""} criada${resultado.count > 1 ? "s" : ""}`);
      onSucesso();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="border-zinc-800 bg-zinc-900 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">Nova cobrança avulsa</DialogTitle>
          <p className="text-sm text-zinc-500">Crie cobranças extras: upsell, taxa única ou parcelamento</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Cliente *</Label>
            <Select value={clienteId} onValueChange={(v) => { if (v) setClienteId(v); }}>
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 max-h-60">
                {clientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Forma de pagamento */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Forma de pagamento *</Label>
              <Select value={formaPagamento} onValueChange={(v) => { if (v) setFormaPagamento(v); }}>
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">{FORMAS_PAGAMENTO.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            {/* Moeda */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Moeda</Label>
              <Select value={moeda} onValueChange={(v) => { if (v) setMoeda(v as "BRL" | "USD"); }}>
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">{MOEDAS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label} {m.nome}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Frequência */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Frequência *</Label>
              <Select value={frequencia} onValueChange={(v) => { if (v) setFrequencia(v as typeof frequencia); }}>
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  <SelectItem value="unica">Única</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                  <SelectItem value="parcelada">Parcelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade */}
            {frequencia !== "unica" && (
              <div className="space-y-2">
                <Label className="text-zinc-300">{frequencia === "parcelada" ? "Parcelas" : "Quantidade"}</Label>
                <Input type="number" min={2} max={frequencia === "parcelada" ? 12 : 24} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value) || 2)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
              </div>
            )}

            {/* Periodicidade */}
            {frequencia !== "unica" && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Periodicidade</Label>
                <Select value={periodicidade} onValueChange={(v) => { if (v) setPeriodicidade(v as typeof periodicidade); }}>
                  <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950">
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Data primeira cobrança */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Data da primeira cobrança *</Label>
              <Input type="date" value={dataPrimeira} onChange={(e) => setDataPrimeira(e.target.value)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Valor por fatura *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={valor || ""} onChange={(e) => setValor(Number(e.target.value) || 0)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
              {clienteSelecionado && (
                <p className="text-xs text-zinc-500">Contrato: {formatarMoeda(Number(clienteSelecionado.fee_mensal), moeda)}/mês</p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Descrição</Label>
            <Textarea placeholder="Ex: Setup inicial, Boost Black Friday, Parcela 1/3 de produção de vídeo" rows={2} maxLength={200} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
          </div>

          {/* Preview */}
          {valor > 0 && previewDatas.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-950/50">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-400 mb-2">{previewDatas.length} fatura{previewDatas.length > 1 ? "s" : ""} será{previewDatas.length > 1 ? "ão" : ""} criada{previewDatas.length > 1 ? "s" : ""}:</p>
                <div className="space-y-1">
                  {previewDatas.map((d, i) => (
                    <p key={i} className="text-sm text-zinc-300">• {d} — {formatarMoeda(valor, moeda)}</p>
                  ))}
                </div>
                {previewDatas.length > 1 && (
                  <p className="mt-2 pt-2 border-t border-zinc-800 text-sm font-medium text-zinc-200">
                    Total: {formatarMoeda(totalPreview, moeda)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCriar} disabled={!podeConfirmar || criando}>
            {criando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar cobrança avulsa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
