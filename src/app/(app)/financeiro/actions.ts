"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getFrequenciaDaFormaPagamento,
  calcularValorFatura,
  gerarDatasFaturas,
} from "@/lib/faturas";
import type { Cliente } from "@/types/cliente";

function revalidar() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  revalidatePath("/clientes");
}

/** Gera faturas do mês para todos os clientes ativos, sem duplicar */
export async function gerarFaturasDoMes(mesStr: string) {
  const supabase = await createClient();
  const mes = new Date(mesStr + "T00:00:00");
  const inicioMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .in("status", ["a_iniciar", "onboarding", "ongoing", "aviso_previo"]);

  if (!clientes || clientes.length === 0) return { count: 0 };

  let count = 0;
  for (const cliente of clientes as Cliente[]) {
    const frequencia = getFrequenciaDaFormaPagamento(cliente.forma_pagamento);
    if (!frequencia) continue;

    const datas = gerarDatasFaturas(cliente, inicioMes, fimMes);
    const valor = calcularValorFatura(Number(cliente.fee_mensal), frequencia);

    for (const data of datas) {
      const dataStr = data.toISOString().split("T")[0];

      // Verificar duplicata
      const { data: existente } = await supabase
        .from("faturas")
        .select("id")
        .eq("cliente_id", cliente.id)
        .eq("data_vencimento", dataStr)
        .limit(1);

      if (existente && existente.length > 0) continue;

      await supabase.from("faturas").insert({
        cliente_id: cliente.id,
        data_referencia: inicioMes.toISOString().split("T")[0],
        data_vencimento: dataStr,
        valor,
        moeda: cliente.moeda || "BRL",
        forma_pagamento: cliente.forma_pagamento,
      });
      count++;
    }
  }

  revalidar();
  return { count };
}

/** Gera faturas retroativas para um cliente num intervalo */
export async function gerarFaturasRetroativas(
  clienteId: string,
  dataInicioStr: string,
  dataFimStr: string
) {
  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (!cliente) return { error: "Cliente não encontrado", count: 0 };

  const c = cliente as Cliente;
  const frequencia = getFrequenciaDaFormaPagamento(c.forma_pagamento);
  if (!frequencia) return { count: 0 };

  const dataInicio = new Date(dataInicioStr + "T00:00:00");
  const dataFim = new Date(dataFimStr + "T00:00:00");
  const datas = gerarDatasFaturas(c, dataInicio, dataFim);
  const valor = calcularValorFatura(Number(c.fee_mensal), frequencia);

  let count = 0;
  for (const data of datas) {
    const dataStr = data.toISOString().split("T")[0];
    const { data: existente } = await supabase
      .from("faturas")
      .select("id")
      .eq("cliente_id", clienteId)
      .eq("data_vencimento", dataStr)
      .limit(1);

    if (existente && existente.length > 0) continue;

    await supabase.from("faturas").insert({
      cliente_id: clienteId,
      data_referencia: new Date(data.getFullYear(), data.getMonth(), 1)
        .toISOString()
        .split("T")[0],
      data_vencimento: dataStr,
      valor,
      moeda: c.moeda || "BRL",
      forma_pagamento: c.forma_pagamento,
    });
    count++;
  }

  revalidar();
  return { count };
}

/** Gera faturas de aviso prévio (hoje até dataSaida) */
export async function gerarFaturasAvisoPrevio(
  clienteId: string,
  dataSaidaStr: string
) {
  const hoje = new Date().toISOString().split("T")[0];
  return gerarFaturasRetroativas(clienteId, hoje, dataSaidaStr);
}

/** Cancela faturas pendentes após uma data */
export async function cancelarFaturasAposData(
  clienteId: string,
  dataStr: string
) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("faturas")
    .update({ status: "cancelada" })
    .eq("cliente_id", clienteId)
    .eq("status", "pendente")
    .gt("data_vencimento", dataStr);

  if (error) {
    console.error("Erro ao cancelar faturas:", error);
    return { error: "Erro ao cancelar faturas." };
  }

  revalidar();
  return { count: count ?? 0 };
}

/** Marca uma fatura como paga */
export async function marcarFaturaComoPaga(
  faturaId: string,
  dataPagamentoReal: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("faturas")
    .update({ status: "paga", data_pagamento_real: dataPagamentoReal })
    .eq("id", faturaId);

  if (error) {
    console.error("Erro ao marcar como paga:", error);
    return { error: "Erro ao marcar como paga." };
  }

  revalidar();
  return { success: true };
}

/** Registra data da última cobrança */
export async function registrarCobranca(faturaId: string) {
  const supabase = await createClient();
  const hoje = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("faturas")
    .update({ ultima_cobranca_em: hoje })
    .eq("id", faturaId);

  if (error) return { error: "Erro ao registrar cobrança." };

  revalidar();
  return { success: true };
}

/** Cancela uma fatura */
export async function cancelarFatura(faturaId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("faturas")
    .update({ status: "cancelada" })
    .eq("id", faturaId);

  if (error) return { error: "Erro ao cancelar fatura." };

  revalidar();
  return { success: true };
}

/** Atualiza campos de uma fatura */
export async function atualizarFatura(
  faturaId: string,
  dados: Record<string, unknown>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("faturas")
    .update(dados)
    .eq("id", faturaId);

  if (error) return { error: "Erro ao atualizar fatura." };

  revalidar();
  return { success: true };
}

/** Ações em massa em faturas */
export async function acoesMassaFaturas(
  faturaIds: string[],
  acao: "marcar_paga" | "cancelar",
  dataPagamento?: string
) {
  const supabase = await createClient();

  if (acao === "marcar_paga") {
    const { error } = await supabase
      .from("faturas")
      .update({
        status: "paga",
        data_pagamento_real: dataPagamento || new Date().toISOString().split("T")[0],
      })
      .in("id", faturaIds);

    if (error) return { error: "Erro ao marcar como pagas." };
  }

  if (acao === "cancelar") {
    const { error } = await supabase
      .from("faturas")
      .update({ status: "cancelada" })
      .in("id", faturaIds);

    if (error) return { error: "Erro ao cancelar faturas." };
  }

  revalidar();
  return { success: true, count: faturaIds.length };
}
