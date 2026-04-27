"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { X, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatarMoeda, formatarData } from "@/lib/formatters";
import { formatarReferencia } from "@/lib/faturas";
import { calcularStatusRuntime } from "@/types/fatura";
import type { Fatura, FaturaComCliente, StatusFaturaRuntime } from "@/types/fatura";
import {
  marcarFaturaComoPaga,
  registrarCobranca,
  cancelarFatura,
  atualizarFatura,
  acoesMassaFaturas,
} from "../actions";
import { cn } from "@/lib/utils";

interface TabelaFaturasProps {
  faturas: FaturaComCliente[];
  isAdmin: boolean;
}

function StatusBadgeFatura({ status }: { status: StatusFaturaRuntime }) {
  const cores: Record<StatusFaturaRuntime, string> = {
    pendente: "bg-zinc-700 text-zinc-200",
    paga: "bg-green-900 text-green-300",
    atrasada: "bg-red-900 text-red-300",
    cancelada: "bg-zinc-800 text-zinc-500 line-through",
  };
  const labels: Record<StatusFaturaRuntime, string> = {
    pendente: "Pendente",
    paga: "Paga",
    atrasada: "Atrasada",
    cancelada: "Cancelada",
  };
  return <Badge className={cn("border-0 text-xs font-medium", cores[status])}>{labels[status]}</Badge>;
}

export function TabelaFaturas({ faturas, isAdmin }: TabelaFaturasProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dialogPaga, setDialogPaga] = useState<string | null>(null); // faturaId
  const [dataPgto, setDataPgto] = useState(new Date().toISOString().split("T")[0]);
  const [dialogEditar, setDialogEditar] = useState<FaturaComCliente | null>(null);
  const [editValor, setEditValor] = useState("");
  const [editVencimento, setEditVencimento] = useState("");
  const [editObs, setEditObs] = useState("");

  // Massa
  const [dialogMassaPaga, setDialogMassaPaga] = useState(false);
  const [dataMassaPgto, setDataMassaPgto] = useState(new Date().toISOString().split("T")[0]);

  const todosIds = faturas.map((f) => f.id);
  const todosSelecionados = faturas.length > 0 && selecionados.size === faturas.length;

  function toggleTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(todosIds));
  }
  function toggleUm(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleMarcarPaga() {
    if (!dialogPaga) return;
    const res = await marcarFaturaComoPaga(dialogPaga, dataPgto);
    if (res.error) toast.error(res.error); else toast.success("Fatura marcada como paga");
    setDialogPaga(null);
  }

  async function handleRegistrarCobranca(id: string) {
    const res = await registrarCobranca(id);
    if (res.error) toast.error(res.error); else toast.success("Cobrança registrada");
  }

  async function handleCancelar(id: string) {
    const res = await cancelarFatura(id);
    if (res.error) toast.error(res.error); else toast.success("Fatura cancelada");
  }

  async function handleSalvarEdicao() {
    if (!dialogEditar) return;
    const dados: Record<string, unknown> = {};
    if (editValor) dados.valor = Number(editValor);
    if (editVencimento) dados.data_vencimento = editVencimento;
    if (editObs !== undefined) dados.observacoes = editObs || null;
    const res = await atualizarFatura(dialogEditar.id, dados);
    if (res.error) toast.error(res.error); else toast.success("Fatura atualizada");
    setDialogEditar(null);
  }

  async function handleMassaPaga() {
    const ids = Array.from(selecionados);
    const res = await acoesMassaFaturas(ids, "marcar_paga", dataMassaPgto);
    if (res.error) toast.error(res.error); else { toast.success(`${res.count} faturas marcadas como pagas`); setSelecionados(new Set()); }
    setDialogMassaPaga(false);
  }

  async function handleMassaCancelar() {
    const ids = Array.from(selecionados);
    const res = await acoesMassaFaturas(ids, "cancelar");
    if (res.error) toast.error(res.error); else { toast.success(`${res.count} faturas canceladas`); setSelecionados(new Set()); }
  }

  async function handleMassaCobranca() {
    const ids = Array.from(selecionados);
    for (const id of ids) await registrarCobranca(id);
    toast.success(`Cobrança registrada em ${ids.length} faturas`);
    setSelecionados(new Set());
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <>
      {/* Barra de ação em massa — só admin */}
      {isAdmin && selecionados.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 mb-4">
          <span className="text-sm text-zinc-300 font-medium">
            {selecionados.size} fatura{selecionados.size > 1 ? "s" : ""} selecionada{selecionados.size > 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white" onClick={() => { setDialogMassaPaga(true); setDataMassaPgto(new Date().toISOString().split("T")[0]); }}>Marcar como pagas</Button>
          <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white" onClick={handleMassaCobranca}>Registrar cobrança</Button>
          <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300" onClick={handleMassaCancelar}>Cancelar selecionadas</Button>
          <Button variant="ghost" size="sm" className="ml-auto gap-1 text-xs text-zinc-500 hover:text-white" onClick={() => setSelecionados(new Set())}>
            <X className="h-3 w-3" /> Limpar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              {isAdmin && <TableHead className="w-10 text-zinc-400"><Checkbox checked={todosSelecionados} onCheckedChange={toggleTodos} /></TableHead>}
              <TableHead className="text-zinc-400 whitespace-nowrap">Cliente</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Referência</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Vencimento</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Atraso</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Valor</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Pagamento</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Status</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Data pgto</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Últ. cobrança</TableHead>
              {isAdmin && <TableHead className="text-zinc-400 whitespace-nowrap text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {faturas.map((f) => {
              const statusRT = calcularStatusRuntime(f);
              const venc = new Date(f.data_vencimento + "T00:00:00");
              const diasAtraso = statusRT === "atrasada" ? Math.ceil((hoje.getTime() - venc.getTime()) / 86400000) : 0;
              return (
                <TableRow key={f.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  {isAdmin && <TableCell><Checkbox checked={selecionados.has(f.id)} onCheckedChange={() => toggleUm(f.id)} /></TableCell>}
                  <TableCell className="font-medium text-zinc-200 whitespace-nowrap">
                    <Link href={`/clientes/${f.clientes?.id || f.cliente_id}`} className="hover:underline">{f.clientes?.nome || "—"}</Link>
                  </TableCell>
                  <TableCell className="text-zinc-400 whitespace-nowrap">{formatarReferencia(f.data_referencia, f.forma_pagamento)}</TableCell>
                  <TableCell className="text-zinc-400 whitespace-nowrap">{formatarData(f.data_vencimento)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {statusRT === "atrasada" ? <span className="text-red-400 font-medium">{diasAtraso}d</span> : "—"}
                  </TableCell>
                  <TableCell className="text-zinc-300 whitespace-nowrap">{formatarMoeda(Number(f.valor), f.moeda)}</TableCell>
                  <TableCell className="text-zinc-400 whitespace-nowrap text-xs">{f.forma_pagamento || "—"}</TableCell>
                  <TableCell><StatusBadgeFatura status={statusRT} /></TableCell>
                  <TableCell className="text-zinc-400 whitespace-nowrap">{formatarData(f.data_pagamento_real)}</TableCell>
                  <TableCell className="text-zinc-500 whitespace-nowrap">{formatarData(f.ultima_cobranca_em)}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="border-zinc-800 bg-zinc-950">
                          <DropdownMenuItem className="text-zinc-300" onClick={() => { setDialogPaga(f.id); setDataPgto(new Date().toISOString().split("T")[0]); }}>Marcar como paga</DropdownMenuItem>
                          <DropdownMenuItem className="text-zinc-300" onClick={() => handleRegistrarCobranca(f.id)}>Registrar cobrança</DropdownMenuItem>
                          <DropdownMenuItem className="text-zinc-300" onClick={() => { setDialogEditar(f); setEditValor(String(f.valor)); setEditVencimento(f.data_vencimento); setEditObs(f.observacoes || ""); }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400" onClick={() => handleCancelar(f.id)}>Cancelar fatura</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog marcar como paga (individual) */}
      <Dialog open={!!dialogPaga} onOpenChange={(open) => { if (!open) setDialogPaga(null); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader><DialogTitle className="text-zinc-200">Marcar como paga</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Data do pagamento</Label>
            <Input type="date" value={dataPgto} onChange={(e) => setDataPgto(e.target.value)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setDialogPaga(null)}>Cancelar</Button>
            <Button onClick={handleMarcarPaga}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog marcar como paga (massa) */}
      <Dialog open={dialogMassaPaga} onOpenChange={(open) => { if (!open) setDialogMassaPaga(false); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader><DialogTitle className="text-zinc-200">Marcar {selecionados.size} faturas como pagas</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Data do pagamento</Label>
            <Input type="date" value={dataMassaPgto} onChange={(e) => setDataMassaPgto(e.target.value)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setDialogMassaPaga(false)}>Cancelar</Button>
            <Button onClick={handleMassaPaga}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog editar fatura */}
      <Dialog open={!!dialogEditar} onOpenChange={(open) => { if (!open) setDialogEditar(null); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader><DialogTitle className="text-zinc-200">Editar fatura</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={editValor} onChange={(e) => setEditValor(e.target.value)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="date" value={editVencimento} onChange={(e) => setEditVencimento(e.target.value)} className="border-zinc-800 bg-zinc-950 text-zinc-200" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={editObs} onChange={(e) => setEditObs(e.target.value)} placeholder="Opcional" className="border-zinc-800 bg-zinc-950 text-zinc-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setDialogEditar(null)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
