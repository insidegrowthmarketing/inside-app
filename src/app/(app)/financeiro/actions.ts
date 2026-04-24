"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  clienteGeraFaturasAutomaticamente,
  getFrequenciaDaFormaPagamento,
  calcularValorFatura,
  gerarDatasFaturas,
} from "@/lib/faturas";
import { STATUS_ATIVOS } from "@/types/cliente";
import type { Cliente } from "@/types/cliente";

/** Revalida rotas afetadas pelo financeiro (só chamar de Server Actions diretas) */
function revalidar() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  revalidatePath("/clientes");
}

// =============================================
// Funções puras de geração (sem revalidatePath)
// Podem ser chamadas durante render ou por outras funções
// =============================================

/** Gera faturas de um cliente num intervalo, sem duplicar. NÃO revalida. */
export async function gerarFaturasDoCliente(
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

  // Stripe/ASAAS/onboarding: nunca gerar faturas automaticamente
  if (!clienteGeraFaturasAutomaticamente(c)) return { count: 0 };

  const frequencia = getFrequenciaDaFormaPagamento(c.forma_pagamento);
  if (!frequencia) return { count: 0 };

  const dataInicio = new Date(dataInicioStr + "T00:00:00");
  const dataFim = new Date(dataFimStr + "T00:00:00");
  const datas = gerarDatasFaturas(c, dataInicio, dataFim);
  const valor = calcularValorFatura(Number(c.fee_mensal), frequencia);

  let count = 0;
  for (const data of datas) {
    const vencStr = data.toISOString().split("T")[0];
    const refStr = new Date(data.getFullYear(), data.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { data: existente } = await supabase
      .from("faturas")
      .select("id")
      .eq("cliente_id", clienteId)
      .eq("data_vencimento", vencStr)
      .limit(1);

    if (existente && existente.length > 0) continue;

    await supabase.from("faturas").insert({
      cliente_id: clienteId,
      data_referencia: refStr,
      data_vencimento: vencStr,
      valor,
      moeda: c.moeda || "BRL",
      forma_pagamento: c.forma_pagamento,
    });
    count++;
  }

  return { count };
}

/** Gera faturas do mês atual + próximos 2 meses para um cliente. NÃO revalida. */
export async function gerarFaturasIniciaisDoCliente(clienteId: string) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimHorizonte = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 0);

  const inicioStr = inicioMes.toISOString().split("T")[0];
  const fimStr = fimHorizonte.toISOString().split("T")[0];

  return gerarFaturasDoCliente(clienteId, inicioStr, fimStr);
}

/** Auto-cura: preenche buracos de faturas para clientes ativos. NÃO revalida. */
export async function autoCurarFaturas() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, forma_pagamento, status")
    .in("status", [...STATUS_ATIVOS]);

  if (!clientes || clientes.length === 0) return { count: 0 };

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const em30dias = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30);
  const em30diasStr = em30dias.toISOString().split("T")[0];

  let totalGeradas = 0;

  for (const c of clientes) {
    // Pular Stripe/ASAAS/onboarding — nunca gerar faturas automaticamente
    if (!clienteGeraFaturasAutomaticamente(c)) continue;
    if (!getFrequenciaDaFormaPagamento(c.forma_pagamento)) continue;

    const { data: futuras } = await supabase
      .from("faturas")
      .select("id")
      .eq("cliente_id", c.id)
      .eq("status", "pendente")
      .gte("data_vencimento", hojeStr)
      .lte("data_vencimento", em30diasStr)
      .limit(1);

    if (futuras && futuras.length > 0) continue;

    const resultado = await gerarFaturasIniciaisDoCliente(c.id);
    totalGeradas += resultado.count;
  }

  return { count: totalGeradas };
}

/** Cancela faturas pendentes após uma data. NÃO revalida. */
export async function cancelarFaturasFuturas(
  clienteId: string,
  dataLimiteStr: string
) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("faturas")
    .update({ status: "cancelada" })
    .eq("cliente_id", clienteId)
    .eq("status", "pendente")
    .gt("data_vencimento", dataLimiteStr);

  if (error) {
    console.error("Erro ao cancelar faturas:", error);
    return { error: "Erro ao cancelar faturas." };
  }

  return { count: count ?? 0 };
}

// =============================================
// Server Actions diretas (chamadas por botão/form do usuário)
// Estas SIM chamam revalidar()
// =============================================

/** Gera faturas do mês para todos os clientes ativos (botão manual) */
export async function gerarFaturasDoMes(mesStr: string) {
  const supabase = await createClient();
  const mes = new Date(mesStr + "T00:00:00");
  const inicioMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id")
    .in("status", [...STATUS_ATIVOS]);

  if (!clientes || clientes.length === 0) return { count: 0 };

  let count = 0;
  const inicioStr = inicioMes.toISOString().split("T")[0];
  const fimStr = fimMes.toISOString().split("T")[0];

  for (const c of clientes) {
    const resultado = await gerarFaturasDoCliente(c.id, inicioStr, fimStr);
    count += resultado.count;
  }

  revalidar();
  return { count };
}

/** Gera faturas de aviso prévio (Server Action direta) */
export async function gerarFaturasAvisoPrevio(
  clienteId: string,
  dataSaidaStr: string
) {
  const hoje = new Date().toISOString().split("T")[0];
  const resultado = await gerarFaturasDoCliente(clienteId, hoje, dataSaidaStr);
  revalidar();
  return resultado;
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

  if (error) return { error: "Erro ao marcar como paga." };

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

/** Cancela uma fatura (Server Action direta) */
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
