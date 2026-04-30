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
import { ehAdmin } from "@/lib/permissoes";

async function getEmailLogado() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user?.email;
}

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

/** Gera faturas a partir de HOJE + próximos 2 meses para um cliente. NÃO revalida. */
export async function gerarFaturasIniciaisDoCliente(clienteId: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const fimHorizonte = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 0);

  const inicioStr = hoje.toISOString().split("T")[0];
  const fimStr = fimHorizonte.toISOString().split("T")[0];

  console.log("[gerarFaturasIniciaisDoCliente] Intervalo:", inicioStr, "→", fimStr);
  return gerarFaturasDoCliente(clienteId, inicioStr, fimStr);
}

/** Auto-cura: preenche buracos de faturas para clientes ativos. NÃO revalida. */
export async function autoCurarFaturas() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, forma_pagamento, status")
    .in("status", [...STATUS_ATIVOS]);

  if (!clientes || clientes.length === 0) return { count: 0 };

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const em30dias = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30);
  const em30diasStr = em30dias.toISOString().split("T")[0];

  let totalGeradas = 0;

  for (const c of clientes) {
    if (!clienteGeraFaturasAutomaticamente(c)) continue;
    if (!getFrequenciaDaFormaPagamento(c.forma_pagamento)) continue;

    const { data: futuras } = await supabase
      .from("faturas")
      .select("id")
      .eq("cliente_id", c.id)
      .in("status", ["pendente", "paga"])
      .gte("data_vencimento", hojeStr)
      .lte("data_vencimento", em30diasStr)
      .limit(1);

    if (futuras && futuras.length > 0) continue;

    const resultado = await gerarFaturasIniciaisDoCliente(c.id);
    totalGeradas += resultado.count;
  }

  return { count: totalGeradas };
}

/** Exclui (deleta) TODAS as faturas pendentes de um cliente. NÃO revalida. */
export async function excluirFaturasPendentes(clienteId: string) {
  console.log("[excluirFaturasPendentes] Cliente:", clienteId);
  const supabase = await createClient();

  // Primeiro contar quantas existem
  const { data: pendentes } = await supabase
    .from("faturas")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("status", "pendente");

  const total = pendentes?.length ?? 0;
  console.log("[excluirFaturasPendentes] Faturas pendentes encontradas:", total);

  if (total === 0) return { count: 0 };

  const ids = pendentes!.map((f) => f.id);
  const { error } = await supabase
    .from("faturas")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("[excluirFaturasPendentes] Erro:", error);
    return { error: "Erro ao excluir faturas.", count: 0 };
  }

  console.log("[excluirFaturasPendentes] Faturas excluídas:", total);
  return { count: total };
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

/** Cria cobrança(s) avulsa(s) — só admin */
export async function criarCobrancaAvulsa(dados: {
  cliente_id: string;
  forma_pagamento: string;
  moeda: "BRL" | "USD";
  frequencia: "unica" | "recorrente" | "parcelada";
  quantidade: number;
  periodicidade: "semanal" | "quinzenal" | "mensal" | null;
  data_primeira_cobranca: string;
  valor_por_fatura: number;
  descricao: string | null;
}) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão.", count: 0 };

  const supabase = await createClient();
  const qtd = dados.frequencia === "unica" ? 1 : dados.quantidade;

  // Calcular datas
  const datas: string[] = [];
  const primeira = new Date(dados.data_primeira_cobranca + "T00:00:00");

  for (let i = 0; i < qtd; i++) {
    const d = new Date(primeira);
    if (i > 0 && dados.periodicidade) {
      switch (dados.periodicidade) {
        case "semanal": d.setDate(d.getDate() + 7 * i); break;
        case "quinzenal": d.setDate(d.getDate() + 15 * i); break;
        case "mensal": d.setMonth(d.getMonth() + i); break;
      }
    }
    datas.push(d.toISOString().split("T")[0]);
  }

  // Inserir faturas
  const faturas = datas.map((dataVenc) => ({
    cliente_id: dados.cliente_id,
    data_referencia: dataVenc,
    data_vencimento: dataVenc,
    valor: dados.valor_por_fatura,
    moeda: dados.moeda,
    forma_pagamento: dados.forma_pagamento,
    tipo: "avulsa" as const,
    descricao: dados.descricao,
    status: "pendente" as const,
  }));

  const { error } = await supabase.from("faturas").insert(faturas);
  if (error) {
    console.error("Erro ao criar cobrança avulsa:", error);
    return { error: "Erro ao criar cobrança.", count: 0 };
  }

  revalidar();
  return { success: true, count: faturas.length };
}

/** Gera faturas do mês para todos os clientes ativos (botão manual) — só admin */
export async function gerarFaturasDoMes(mesStr: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão.", count: 0 };
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

/** Marca uma fatura como paga — só admin */
export async function marcarFaturaComoPaga(faturaId: string, dataPagamentoReal: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("faturas")
    .update({ status: "paga", data_pagamento_real: dataPagamentoReal })
    .eq("id", faturaId);

  if (error) return { error: "Erro ao marcar como paga." };

  revalidar();
  return { success: true };
}

/** Registra data da última cobrança — só admin */
export async function registrarCobranca(faturaId: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };
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

/** Cancela uma fatura — só admin */
export async function cancelarFatura(faturaId: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("faturas")
    .update({ status: "cancelada" })
    .eq("id", faturaId);

  if (error) return { error: "Erro ao cancelar fatura." };

  revalidar();
  return { success: true };
}

/** Atualiza campos de uma fatura — só admin */
export async function atualizarFatura(faturaId: string, dados: Record<string, unknown>) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("faturas")
    .update(dados)
    .eq("id", faturaId);

  if (error) return { error: "Erro ao atualizar fatura." };

  revalidar();
  return { success: true };
}

/** Ações em massa em faturas — só admin */
export async function acoesMassaFaturas(faturaIds: string[], acao: "marcar_paga" | "cancelar", dataPagamento?: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };
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
