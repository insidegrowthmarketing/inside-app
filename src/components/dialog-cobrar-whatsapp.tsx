"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarMoeda } from "@/lib/formatters";
import { normalizarTelefone, gerarMensagemTemplate } from "@/lib/whatsapp";
import { cobrarViaWhatsApp } from "@/app/(app)/financeiro/actions";

interface DialogCobrarWhatsAppProps {
  open: boolean;
  onClose: () => void;
  fatura: {
    id: string;
    data_vencimento: string;
    valor: number;
    moeda: "BRL" | "USD";
  };
  cliente: {
    nome: string;
    responsavel_financeiro: string | null;
    contato_financeiro: string | null;
    forma_pagamento: string | null;
  };
}

export function DialogCobrarWhatsApp({ open, onClose, fatura, cliente }: DialogCobrarWhatsAppProps) {
  const [template, setTemplate] = useState<"lembrete_1dia" | "cobranca_dia" | "manual">("manual");
  const [enviando, setEnviando] = useState(false);

  const numero = useMemo(() => normalizarTelefone(cliente.contato_financeiro), [cliente.contato_financeiro]);

  const preview = useMemo(
    () => gerarMensagemTemplate(template, fatura, cliente),
    [template, fatura, cliente]
  );

  async function handleEnviar() {
    setEnviando(true);
    const resultado = await cobrarViaWhatsApp(fatura.id, template);
    setEnviando(false);

    if ("error" in resultado && resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Mensagem enviada via WhatsApp");
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="border-zinc-800 bg-zinc-900 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-200 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Cobrar via WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações */}
          <div className="text-sm text-zinc-400 space-y-1">
            <p>Cliente: <span className="text-zinc-200">{cliente.nome}</span></p>
            <p>Valor: <span className="text-zinc-200">{formatarMoeda(fatura.valor, fatura.moeda)}</span></p>
            <p>Número: <span className={numero ? "text-zinc-200" : "text-red-400"}>{numero || "Não encontrado"}</span></p>
          </div>

          {!numero && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400">
                Telefone do cliente inválido ou não cadastrado. Edite o cliente para adicionar um contato válido.
              </p>
            </div>
          )}

          {numero && (
            <>
              {/* Template */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Template</Label>
                <Select value={template} onValueChange={(v) => { if (v) setTemplate(v as typeof template); }}>
                  <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950">
                    <SelectItem value="manual">Cobrança padrão</SelectItem>
                    <SelectItem value="lembrete_1dia">Lembrete (1 dia antes)</SelectItem>
                    <SelectItem value="cobranca_dia">Cobrança no dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs">Preview da mensagem</Label>
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-300 whitespace-pre-wrap">
                  {preview}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={onClose}>
            Cancelar
          </Button>
          {numero && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={handleEnviar}
              disabled={enviando}
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Enviar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
