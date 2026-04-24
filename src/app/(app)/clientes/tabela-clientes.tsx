"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, formatarData, formatarDiaPagamento } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { formatarFusoHorario } from "@/lib/fuso-horario";
import {
  atualizarCampoCliente,
  atualizarClientesEmMassa,
  atualizarPacoteCliente,
  marcarChurn,
  marcarChurnEmMassa,
  excluirCliente,
  excluirClientesEmMassa,
} from "./actions";
import {
  STATUS_CLIENTE,
  FORMAS_PAGAMENTO,
  GESTORES_PROJETOS,
  GESTORES_TRAFEGO,
  PACOTES,
  MOTIVOS_CHURN,
} from "@/types/cliente";
import type { Cliente } from "@/types/cliente";

interface TabelaClientesProps {
  clientes: Cliente[];
}

type CampoMassa = "status" | "forma_pagamento" | "gestor_projetos" | "gestor_trafego";

const OPCOES_MASSA: { campo: CampoMassa; label: string; opcoes: readonly string[] }[] = [
  { campo: "status", label: "Alterar status", opcoes: STATUS_CLIENTE.map((s) => s.value) },
  { campo: "forma_pagamento", label: "Alterar forma de pagamento", opcoes: FORMAS_PAGAMENTO },
  { campo: "gestor_projetos", label: "Alterar gestor de projetos", opcoes: GESTORES_PROJETOS },
  { campo: "gestor_trafego", label: "Alterar gestor de tráfego", opcoes: GESTORES_TRAFEGO },
];

function getLabelStatus(value: string) {
  return STATUS_CLIENTE.find((s) => s.value === value)?.label ?? value;
}

export function TabelaClientes({ clientes }: TabelaClientesProps) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [excluirDialog, setExcluirDialog] = useState<{ id: string; nome: string } | null>(null);
  const [excluirMassaDialog, setExcluirMassaDialog] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [dialogMassa, setDialogMassa] = useState<{
    campo: CampoMassa;
    label: string;
    opcoes: readonly string[];
  } | null>(null);
  const [valorMassa, setValorMassa] = useState("");

  // Dialog de churn (inline)
  const [churnDialog, setChurnDialog] = useState<{ tipo: "inline"; clienteId: string } | { tipo: "massa" } | null>(null);
  const [dataSaidaChurn, setDataSaidaChurn] = useState(new Date().toISOString().split("T")[0]);
  const [motivoChurn, setMotivoChurn] = useState("");

  const todosIds = clientes.map((c) => c.id);
  const todosSelecionados = clientes.length > 0 && selecionados.size === clientes.length;

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(todosIds));
    }
  }

  function toggleUm(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleInlineStatusChange(id: string, novoStatus: string) {
    if (novoStatus === "churn") {
      setChurnDialog({ tipo: "inline", clienteId: id });
      setDataSaidaChurn(new Date().toISOString().split("T")[0]);
      setMotivoChurn("");
      return;
    }
    const resultado = await atualizarCampoCliente(id, "status", novoStatus);
    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Status atualizado");
    }
  }

  async function handleInlineChange(id: string, campo: string, valor: string) {
    const resultado = await atualizarCampoCliente(id, campo, valor || null);
    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Atualizado com sucesso");
    }
  }

  async function handlePacoteChange(id: string, novoPacote: string) {
    const resultado = await atualizarPacoteCliente(id, novoPacote);
    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Pacote atualizado");
    }
  }

  async function confirmarChurn() {
    if (!churnDialog || !dataSaidaChurn) return;

    if (churnDialog.tipo === "inline") {
      const resultado = await marcarChurn(churnDialog.clienteId, dataSaidaChurn, motivoChurn || null);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success("Cliente marcado como churn");
      }
    } else {
      const ids = Array.from(selecionados);
      const resultado = await marcarChurnEmMassa(ids, dataSaidaChurn, motivoChurn || null);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success(`${resultado.count} clientes marcados como churn`);
        setSelecionados(new Set());
      }
    }

    setChurnDialog(null);
  }

  async function handleMassa() {
    if (!dialogMassa || !valorMassa) return;

    // Se for status churn, abrir dialog de churn
    if (dialogMassa.campo === "status" && valorMassa === "churn") {
      setDialogMassa(null);
      setValorMassa("");
      setChurnDialog({ tipo: "massa" });
      setDataSaidaChurn(new Date().toISOString().split("T")[0]);
      setMotivoChurn("");
      return;
    }

    const ids = Array.from(selecionados);
    const resultado = await atualizarClientesEmMassa(ids, dialogMassa.campo, valorMassa);
    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success(`${resultado.count} clientes atualizados`);
      setSelecionados(new Set());
    }
    setDialogMassa(null);
    setValorMassa("");
  }

  async function handleExcluir() {
    if (!excluirDialog) return;
    setExcluindo(true);
    const res = await excluirCliente(excluirDialog.id);
    if (res.error) { toast.error(res.error); } else { toast.success("Cliente excluído com sucesso"); }
    setExcluindo(false);
    setExcluirDialog(null);
  }

  async function handleExcluirMassa() {
    const ids = Array.from(selecionados);
    setExcluindo(true);
    const res = await excluirClientesEmMassa(ids);
    if (res.error) { toast.error(res.error); } else { toast.success(`${res.count} clientes excluídos`); setSelecionados(new Set()); }
    setExcluindo(false);
    setExcluirMassaDialog(false);
  }

  function getOpcoesLabel(campo: CampoMassa, valor: string): string {
    if (campo === "status") return getLabelStatus(valor);
    return valor;
  }

  return (
    <>
      {/* Barra de ação em massa */}
      {selecionados.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 mb-4">
          <span className="text-sm text-zinc-300 font-medium">
            {selecionados.size} cliente{selecionados.size > 1 ? "s" : ""} selecionado{selecionados.size > 1 ? "s" : ""}
          </span>

          {OPCOES_MASSA.map((op) => (
            <Button
              key={op.campo}
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-white"
              onClick={() => {
                setDialogMassa(op);
                setValorMassa("");
              }}
            >
              {op.label}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-red-400 hover:text-red-300"
            onClick={() => setExcluirMassaDialog(true)}
          >
            <Trash2 className="h-3 w-3" />
            Excluir selecionados
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1 text-xs text-zinc-500 hover:text-white"
            onClick={() => setSelecionados(new Set())}
          >
            <X className="h-3 w-3" />
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Tabela com scroll horizontal */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-10 text-zinc-400">
                <Checkbox checked={todosSelecionados} onCheckedChange={toggleTodos} />
              </TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Nome</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Status</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Pacote</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Fee mensal</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Forma de pagamento</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Dia pagamento</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Gestor de projetos</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Gestor de tráfego</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Head</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Fuso horário</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Início contrato</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Fim contrato</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">GHL</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow
                key={cliente.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
                data-selected={selecionados.has(cliente.id) || undefined}
              >
                <TableCell>
                  <Checkbox checked={selecionados.has(cliente.id)} onCheckedChange={() => toggleUm(cliente.id)} />
                </TableCell>
                <TableCell className="font-medium text-zinc-200 whitespace-nowrap">
                  {cliente.nome}
                </TableCell>
                {/* Status - dropdown inline */}
                <TableCell>
                  <Select
                    value={cliente.status}
                    onValueChange={(v) => { if (v) handleInlineStatusChange(cliente.id, v); }}
                  >
                    <SelectTrigger className="h-8 w-[130px] border-zinc-800 bg-transparent text-xs p-1">
                      <StatusBadge status={cliente.status} />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-950">
                      {STATUS_CLIENTE.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* Pacote - dropdown inline */}
                <TableCell>
                  <Select
                    value={cliente.pacote || ""}
                    onValueChange={(v) => { if (v) handlePacoteChange(cliente.id, v); }}
                  >
                    <SelectTrigger className="h-8 w-[100px] border-zinc-800 bg-transparent text-xs text-zinc-300">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-950">
                      {PACOTES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* Fee mensal com moeda */}
                <TableCell className="text-zinc-300 whitespace-nowrap">
                  {formatarMoeda(Number(cliente.fee_mensal), cliente.moeda || "BRL")}
                </TableCell>
                {/* Forma de pagamento - dropdown inline */}
                <TableCell>
                  <Select
                    value={cliente.forma_pagamento || ""}
                    onValueChange={(v) => { if (v) handleInlineChange(cliente.id, "forma_pagamento", v); }}
                  >
                    <SelectTrigger className="h-8 w-[180px] border-zinc-800 bg-transparent text-xs text-zinc-300">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-950">
                      {FORMAS_PAGAMENTO.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* Dia pagamento */}
                <TableCell className="text-zinc-400 whitespace-nowrap text-xs">
                  {formatarDiaPagamento(cliente)}
                </TableCell>
                {/* Gestor de projetos - dropdown inline */}
                <TableCell>
                  <Select
                    value={cliente.gestor_projetos || ""}
                    onValueChange={(v) => { if (v) handleInlineChange(cliente.id, "gestor_projetos", v); }}
                  >
                    <SelectTrigger className="h-8 w-[140px] border-zinc-800 bg-transparent text-xs text-zinc-300">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-950">
                      {GESTORES_PROJETOS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* Gestor de tráfego - dropdown inline */}
                <TableCell>
                  <Select
                    value={cliente.gestor_trafego || ""}
                    onValueChange={(v) => { if (v) handleInlineChange(cliente.id, "gestor_trafego", v); }}
                  >
                    <SelectTrigger className="h-8 w-[140px] border-zinc-800 bg-transparent text-xs text-zinc-300">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-950">
                      {GESTORES_TRAFEGO.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* Head */}
                <TableCell className="text-zinc-400 whitespace-nowrap">
                  {cliente.head || "—"}
                </TableCell>
                {/* Fuso horário */}
                <TableCell className="text-zinc-400 whitespace-nowrap">
                  {cliente.fuso_horario ? formatarFusoHorario(cliente.fuso_horario) : "—"}
                </TableCell>
                {/* Início contrato */}
                <TableCell className="text-zinc-400 whitespace-nowrap">
                  {formatarData(cliente.inicio_contrato)}
                </TableCell>
                {/* Fim contrato */}
                <TableCell className="text-zinc-400 whitespace-nowrap">
                  {formatarData(cliente.fim_contrato)}
                </TableCell>
                {/* GHL */}
                <TableCell className="whitespace-nowrap">
                  {cliente.contempla_ghl
                    ? <Badge className="border-0 text-xs bg-green-500/20 text-green-400">Sim</Badge>
                    : <Badge className="border-0 text-xs bg-zinc-800 text-zinc-500">Não</Badge>
                  }
                </TableCell>
                {/* Ações */}
                <TableCell className="text-right whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-zinc-800 bg-zinc-950">
                      <DropdownMenuItem className="text-zinc-300 gap-2" onClick={() => router.push(`/clientes/${cliente.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Ver/Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 gap-2" onClick={() => setExcluirDialog({ id: cliente.id, nome: cliente.nome })}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir cliente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edição em massa */}
      <Dialog open={!!dialogMassa} onOpenChange={(open) => { if (!open) setDialogMassa(null); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-200">{dialogMassa?.label}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={valorMassa} onValueChange={(v) => { if (v) setValorMassa(v); }}>
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                <SelectValue placeholder="Selecione o novo valor" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950">
                {dialogMassa?.opcoes.map((op) => (
                  <SelectItem key={op} value={op}>
                    {dialogMassa ? getOpcoesLabel(dialogMassa.campo, op) : op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setDialogMassa(null)}>
              Cancelar
            </Button>
            <Button onClick={handleMassa} disabled={!valorMassa}>
              Aplicar a {selecionados.size} cliente{selecionados.size > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de churn */}
      <Dialog open={!!churnDialog} onOpenChange={(open) => { if (!open) setChurnDialog(null); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-200">Confirmar Churn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data_saida_inline">Data de saída *</Label>
              <Input
                id="data_saida_inline"
                type="date"
                value={dataSaidaChurn}
                onChange={(e) => setDataSaidaChurn(e.target.value)}
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo do churn</Label>
              <Select value={motivoChurn} onValueChange={(v) => { if (v) setMotivoChurn(v); }}>
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="— Selecione —" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {MOTIVOS_CHURN.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setChurnDialog(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarChurn} disabled={!dataSaidaChurn}>
              Confirmar churn
              {churnDialog?.tipo === "massa" && ` (${selecionados.size} clientes)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão individual */}
      <Dialog open={!!excluirDialog} onOpenChange={(open) => { if (!open) setExcluirDialog(null); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-200">Excluir cliente definitivamente?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. Todos os dados do cliente{" "}
              <strong className="text-zinc-200">{excluirDialog?.nome}</strong>{" "}
              serão removidos permanentemente, incluindo TODAS as suas faturas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setExcluirDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluir} disabled={excluindo}>
              {excluindo && <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />}
              Sim, excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão em massa */}
      <Dialog open={excluirMassaDialog} onOpenChange={(open) => { if (!open) setExcluirMassaDialog(false); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-200">Excluir {selecionados.size} clientes?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. Todos os dados dos clientes selecionados
              serão removidos permanentemente, incluindo TODAS as suas faturas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setExcluirMassaDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluirMassa} disabled={excluindo}>
              {excluindo && <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />}
              Sim, excluir {selecionados.size} clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
