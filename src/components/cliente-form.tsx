"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { clienteSchema, type ClienteFormData } from "@/lib/schemas/cliente";
import { criarCliente, atualizarCliente } from "@/app/(app)/clientes/actions";
import { formatarFusoHorario } from "@/lib/fuso-horario";
import {
  STATUS_CLIENTE,
  GESTORES_PROJETOS,
  GESTORES_TRAFEGO,
  FORMAS_PAGAMENTO,
  FUSOS_HORARIOS,
  PACOTES,
  MOEDAS,
  MOTIVOS_CHURN,
} from "@/types/cliente";
import type { Cliente } from "@/types/cliente";

interface ClienteFormProps {
  cliente?: Cliente;
}

export function ClienteForm({ cliente }: ClienteFormProps) {
  const router = useRouter();
  const modoEdicao = !!cliente;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: cliente
      ? {
          nome: cliente.nome,
          status: cliente.status,
          fuso_horario: cliente.fuso_horario || "",
          fee_mensal: Number(cliente.fee_mensal),
          moeda: cliente.moeda || "BRL",
          forma_pagamento: cliente.forma_pagamento || "",
          inicio_contrato: cliente.inicio_contrato || "",
          fim_contrato: cliente.fim_contrato || "",
          data_pagamento: cliente.data_pagamento,
          gestor_projetos: cliente.gestor_projetos || "",
          gestor_trafego: cliente.gestor_trafego || "",
          responsavel_financeiro: cliente.responsavel_financeiro || "",
          contato_financeiro: cliente.contato_financeiro || "",
          contempla_ghl: cliente.contempla_ghl,
          observacoes: cliente.observacoes || "",
          pacote: cliente.pacote || "start",
          data_saida: cliente.data_saida || null,
          motivo_churn: cliente.motivo_churn || null,
        }
      : {
          status: "a_iniciar",
          fee_mensal: 0,
          moeda: "BRL",
          contempla_ghl: false,
          pacote: "start",
          data_saida: null,
          motivo_churn: null,
        },
  });

  const pacote = watch("pacote");
  const inicioContrato = watch("inicio_contrato");

  // Dialog de churn
  const [churnDialogAberto, setChurnDialogAberto] = useState(false);
  const [dataSaidaChurn, setDataSaidaChurn] = useState(new Date().toISOString().split("T")[0]);
  const [motivoChurn, setMotivoChurn] = useState("");
  const [statusAnterior, setStatusAnterior] = useState(cliente?.status || "a_iniciar");

  // Lógica automática do pacote
  useEffect(() => {
    if (!pacote) return;

    if (pacote === "start" && inicioContrato) {
      const inicio = new Date(inicioContrato + "T00:00:00");
      inicio.setDate(inicio.getDate() + 35);
      const fim = inicio.toISOString().split("T")[0];
      setValue("fim_contrato", fim);
    } else if (pacote === "pro") {
      setValue("fim_contrato", "");
    }
  }, [pacote, inicioContrato, setValue]);

  const isPacotePro = pacote === "pro";

  function handleStatusChange(novoStatus: string) {
    if (novoStatus === "churn") {
      setStatusAnterior(watch("status"));
      setChurnDialogAberto(true);
    } else {
      setValue("status", novoStatus as ClienteFormData["status"]);
      // Limpar dados de churn se saiu do status churn
      setValue("data_saida", null);
      setValue("motivo_churn", null);
    }
  }

  function confirmarChurn() {
    setValue("status", "churn");
    setValue("data_saida", dataSaidaChurn);
    setValue("motivo_churn", motivoChurn || null);
    setChurnDialogAberto(false);
  }

  function cancelarChurn() {
    setValue("status", statusAnterior as ClienteFormData["status"]);
    setChurnDialogAberto(false);
  }

  const onSubmit = async (dados: ClienteFormData) => {
    const resultado = modoEdicao
      ? await atualizarCliente(cliente!.id, dados)
      : await criarCliente(dados);

    if (resultado?.error) {
      toast.error(resultado.error);
    } else {
      toast.success(modoEdicao ? "Cliente atualizado!" : "Cliente cadastrado!");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção 1: Informações gerais */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">
              Informações gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome da empresa/cliente"
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-red-400">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => { if (v) handleStatusChange(v); }}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {STATUS_CLIENTE.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-red-400">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fuso horário</Label>
              <Select
                value={watch("fuso_horario") || ""}
                onValueChange={(v) => setValue("fuso_horario", v ?? "")}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {FUSOS_HORARIOS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {formatarFusoHorario(f.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Contrato */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">
              Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Pacote *</Label>
              <Select
                value={watch("pacote")}
                onValueChange={(v) => { if (v) setValue("pacote", v as ClienteFormData["pacote"]); }}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {PACOTES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pacote && (
                <p className="text-xs text-red-400">{errors.pacote.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee_mensal">Fee mensal *</Label>
              <div className="flex gap-2">
                <Input
                  id="fee_mensal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="border-zinc-800 bg-zinc-950 text-zinc-200 flex-[7]"
                  {...register("fee_mensal", { valueAsNumber: true })}
                />
                <Select
                  value={watch("moeda")}
                  onValueChange={(v) => { if (v) setValue("moeda", v as ClienteFormData["moeda"]); }}
                >
                  <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200 flex-[3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950">
                    {MOEDAS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label} {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.fee_mensal && (
                <p className="text-xs text-red-400">{errors.fee_mensal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={watch("forma_pagamento") || ""}
                onValueChange={(v) => setValue("forma_pagamento", v ?? "")}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Dia do pagamento</Label>
              <Input
                id="data_pagamento"
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 10"
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                {...register("data_pagamento", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inicio_contrato">Início do contrato *</Label>
              <Input
                id="inicio_contrato"
                type="date"
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                {...register("inicio_contrato")}
              />
              {errors.inicio_contrato && (
                <p className="text-xs text-red-400">{errors.inicio_contrato.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fim_contrato">Fim do contrato</Label>
              <Input
                id="fim_contrato"
                type="date"
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                disabled={isPacotePro}
                {...register("fim_contrato")}
              />
              {isPacotePro && (
                <p className="text-xs text-zinc-500">Pacote PRO não possui fim de contrato</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Responsáveis internos */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">
              Responsáveis internos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Gestor de projetos *</Label>
              <Select
                value={watch("gestor_projetos") || ""}
                onValueChange={(v) => setValue("gestor_projetos", v ?? "")}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {GESTORES_PROJETOS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gestor_projetos && (
                <p className="text-xs text-red-400">{errors.gestor_projetos.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gestor de tráfego *</Label>
              <Select
                value={watch("gestor_trafego") || ""}
                onValueChange={(v) => setValue("gestor_trafego", v ?? "")}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {GESTORES_TRAFEGO.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gestor_trafego && (
                <p className="text-xs text-red-400">{errors.gestor_trafego.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 4: Responsável financeiro do cliente */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">
              Responsável financeiro do cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsavel_financeiro">Nome</Label>
              <Input
                id="responsavel_financeiro"
                placeholder="Nome do responsável"
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                {...register("responsavel_financeiro")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato_financeiro">Contato (email/telefone)</Label>
              <Input
                id="contato_financeiro"
                placeholder="Email ou telefone"
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                {...register("contato_financeiro")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seção 5: GHL e Observações */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">
              GHL e Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="contempla_ghl"
                checked={watch("contempla_ghl")}
                onCheckedChange={(checked) => setValue("contempla_ghl", checked)}
              />
              <Label htmlFor="contempla_ghl" className="cursor-pointer">
                Contempla GHL no pacote
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Anotações adicionais sobre o cliente..."
                rows={4}
                className="border-zinc-800 bg-zinc-950 text-zinc-200"
                {...register("observacoes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={() => router.push("/clientes")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modoEdicao ? "Salvar alterações" : "Salvar cliente"}
          </Button>
        </div>
      </form>

      {/* Dialog de confirmação de churn */}
      <Dialog open={churnDialogAberto} onOpenChange={(open) => { if (!open) cancelarChurn(); }}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-200">Confirmar Churn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data_saida_churn">Data de saída *</Label>
              <Input
                id="data_saida_churn"
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
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={cancelarChurn}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarChurn} disabled={!dataSaidaChurn}>
              Confirmar churn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
