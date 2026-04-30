"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/schemas/cliente";
import { STATUS_ATIVOS } from "@/types/cliente";
import {
  gerarFaturasIniciaisDoCliente,
  cancelarFaturasFuturas,
  excluirFaturasPendentes,
} from "@/app/(app)/financeiro/actions";
import { clienteGeraFaturasAutomaticamente, getFrequenciaDaFormaPagamento } from "@/lib/faturas";
import { ehAdmin, podeCriarCliente } from "@/lib/permissoes";

/** Retorna email do usuário logado */
async function getEmailLogado() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email;
}

/** Cria um novo cliente e gera faturas automaticamente */
export async function criarCliente(formData: unknown) {
  const email = await getEmailLogado();
  if (!podeCriarCliente(email)) return { error: "Sem permissão para criar cliente." };

  const parsed = clienteSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos. Verifique os campos obrigatórios." };

  const supabase = await createClient();
  const dados = limparDadosVazios(parsed.data);

  const { data, error } = await supabase.from("clientes").insert(dados).select("id").single();
  if (error || !data) {
    console.error("Erro ao criar cliente:", error);
    return { error: "Erro ao salvar cliente. Tente novamente." };
  }

  let faturasGeradas = 0;
  if (clienteGeraFaturasAutomaticamente(parsed.data)) {
    const resultado = await gerarFaturasIniciaisDoCliente(data.id);
    faturasGeradas = resultado.count;
  }

  revalidatePath("/clientes");
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  return { clienteId: data.id, faturasGeradas };
}

/** Atualiza um cliente — admin edita tudo, outros só status */
export async function atualizarCliente(id: string, formData: unknown) {
  const email = await getEmailLogado();
  const parsed = clienteSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos. Verifique os campos obrigatórios." };

  const supabase = await createClient();

  if (ehAdmin(email)) {
    // Buscar cliente atual pra detectar mudança de forma de pagamento
    const { data: clienteAtual } = await supabase.from("clientes").select("forma_pagamento").eq("id", id).single();
    const formaAnterior = clienteAtual?.forma_pagamento || null;
    const formaNova = parsed.data.forma_pagamento || null;

    // Admin pode atualizar TUDO
    const dados = limparDadosVazios(parsed.data);
    const { error } = await supabase.from("clientes").update(dados).eq("id", id);
    if (error) { console.error("Erro ao atualizar cliente:", error); return { error: "Erro ao atualizar cliente." }; }

    const statusAtual = parsed.data.status;

    // Detectar mudança de forma de pagamento
    const anteriorGera = formaAnterior ? !formaAnterior.toLowerCase().startsWith("stripe") && formaAnterior.toLowerCase() !== "asaas" : false;
    const novaGera = formaNova ? !formaNova.toLowerCase().startsWith("stripe") && formaNova.toLowerCase() !== "asaas" : false;
    const freqAnterior = getFrequenciaDaFormaPagamento(formaAnterior);
    const freqNova = getFrequenciaDaFormaPagamento(formaNova);

    if (anteriorGera && !novaGera) {
      // STOP_FATURAS: era Zelle/BOFA, virou Stripe/ASAAS → excluir pendentes
      await excluirFaturasPendentes(id);
    } else if (!anteriorGera && novaGera) {
      // START_FATURAS: era Stripe/ASAAS, virou Zelle/BOFA → gerar novas
      if ((STATUS_ATIVOS as readonly string[]).includes(statusAtual)) {
        await gerarFaturasIniciaisDoCliente(id);
      }
    } else if (anteriorGera && novaGera && freqAnterior !== freqNova) {
      // MUDA_FREQUENCIA: mudou dentro de Zelle/BOFA → excluir + gerar
      await excluirFaturasPendentes(id);
      if ((STATUS_ATIVOS as readonly string[]).includes(statusAtual)) {
        await gerarFaturasIniciaisDoCliente(id);
      }
    } else if (formaAnterior === formaNova && (STATUS_ATIVOS as readonly string[]).includes(statusAtual) && clienteGeraFaturasAutomaticamente(parsed.data)) {
      // Mesma forma, mas pode precisar gerar faturas faltantes (auto-cura)
      await gerarFaturasIniciaisDoCliente(id);
    }

    if (statusAtual === "churn" && parsed.data.data_saida) {
      await cancelarFaturasFuturas(id, parsed.data.data_saida);
    }
  } else {
    // Não-admin: só pode mudar status, data_saida e motivo_churn
    const { error } = await supabase.from("clientes").update({
      status: parsed.data.status,
      data_saida: parsed.data.data_saida || null,
      motivo_churn: parsed.data.motivo_churn || null,
    }).eq("id", id);
    if (error) { console.error("Erro ao atualizar status:", error); return { error: "Erro ao atualizar." }; }

    if (parsed.data.status === "churn" && parsed.data.data_saida) {
      await cancelarFaturasFuturas(id, parsed.data.data_saida);
    }
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  redirect(`/clientes/${id}`);
}

/** Exclui um cliente — só admin */
export async function excluirCliente(id: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) { console.error("Erro ao excluir cliente:", error); return { error: "Erro ao excluir cliente." }; }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  return { success: true };
}

/** Exclui múltiplos clientes — só admin */
export async function excluirClientesEmMassa(ids: string[]) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().in("id", ids);
  if (error) return { error: "Erro ao excluir clientes." };

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  return { success: true, count: ids.length };
}

/** Atualiza um campo individual — status permitido pra todos, outros só admin */
export async function atualizarCampoCliente(id: string, campo: string, valor: string | null) {
  const email = await getEmailLogado();
  if (campo !== "status" && !ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();

  // Se mudou forma_pagamento, detectar tipo de mudança e agir sobre faturas
  if (campo === "forma_pagamento") {
    const { data: clienteAtual } = await supabase.from("clientes").select("forma_pagamento").eq("id", id).single();
    const formaAnterior = clienteAtual?.forma_pagamento || null;

    console.log("[atualizarCampoCliente] forma_pagamento mudou:", formaAnterior, "→", valor);

    const { error } = await supabase.from("clientes").update({ [campo]: valor }).eq("id", id);
    if (error) return { error: "Erro ao atualizar." };

    const anteriorGera = formaAnterior ? !formaAnterior.toLowerCase().startsWith("stripe") && formaAnterior.toLowerCase() !== "asaas" : false;
    const novaGera = valor ? !valor.toLowerCase().startsWith("stripe") && valor.toLowerCase() !== "asaas" : false;

    console.log("[atualizarCampoCliente] anteriorGera:", anteriorGera, "novaGera:", novaGera);

    if (anteriorGera && !novaGera) {
      console.log("[atualizarCampoCliente] STOP_FATURAS → excluindo pendentes");
      const res = await excluirFaturasPendentes(id);
      console.log("[atualizarCampoCliente] Faturas excluídas:", res.count);
    }

    revalidatePath("/clientes");
    revalidatePath("/clientes/ltv");
    revalidatePath("/financeiro");
    revalidatePath("/financeiro/cobrancas");
    revalidatePath("/dashboards/financeiro");
    return { success: true };
  }

  const { error } = await supabase.from("clientes").update({ [campo]: valor }).eq("id", id);
  if (error) return { error: "Erro ao atualizar." };

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/financeiro");
  return { success: true };
}

/** Atualiza múltiplos campos de um cliente (ex: forma_pagamento + dia) — só admin */
export async function atualizarMultiplosCamposCliente(
  id: string,
  dados: Record<string, unknown>
) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();

  // Buscar forma anterior pra detectar mudança
  const { data: clienteAtual } = await supabase.from("clientes").select("forma_pagamento, status").eq("id", id).single();
  const formaAnterior = clienteAtual?.forma_pagamento || null;
  const formaNova = (dados.forma_pagamento as string) || formaAnterior;
  const statusAtual = clienteAtual?.status || "ongoing";

  const { error } = await supabase.from("clientes").update(dados).eq("id", id);
  if (error) return { error: "Erro ao atualizar." };

  // Lógica de faturas
  const anteriorGera = formaAnterior ? !formaAnterior.toLowerCase().startsWith("stripe") && formaAnterior.toLowerCase() !== "asaas" : false;
  const novaGera = formaNova ? !formaNova.toLowerCase().startsWith("stripe") && formaNova.toLowerCase() !== "asaas" : false;
  const freqAnterior = getFrequenciaDaFormaPagamento(formaAnterior);
  const freqNova = getFrequenciaDaFormaPagamento(formaNova);

  let faturasExcluidas = 0;
  let faturasGeradas = 0;

  if (anteriorGera && !novaGera) {
    const res = await excluirFaturasPendentes(id);
    faturasExcluidas = res.count;
  } else if (!anteriorGera && novaGera) {
    if ((STATUS_ATIVOS as readonly string[]).includes(statusAtual)) {
      const res = await gerarFaturasIniciaisDoCliente(id);
      faturasGeradas = res.count;
    }
  } else if (anteriorGera && novaGera && freqAnterior !== freqNova) {
    const res1 = await excluirFaturasPendentes(id);
    faturasExcluidas = res1.count;
    if ((STATUS_ATIVOS as readonly string[]).includes(statusAtual)) {
      const res2 = await gerarFaturasIniciaisDoCliente(id);
      faturasGeradas = res2.count;
    }
  }

  revalidatePath("/clientes");
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/cobrancas");
  return { success: true, faturasExcluidas, faturasGeradas };
}

/** Atualiza pacote — só admin */
export async function atualizarPacoteCliente(id: string, novoPacote: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();
  const { data: cliente, error: fetchErr } = await supabase.from("clientes").select("inicio_contrato").eq("id", id).single();
  if (fetchErr || !cliente) return { error: "Erro ao buscar cliente." };

  const updateData: Record<string, unknown> = { pacote: novoPacote };
  if (novoPacote === "start" && cliente.inicio_contrato) {
    const inicio = new Date(cliente.inicio_contrato + "T00:00:00");
    inicio.setDate(inicio.getDate() + 35);
    updateData.fim_contrato = inicio.toISOString().split("T")[0];
  } else if (novoPacote === "pro") {
    updateData.fim_contrato = null;
  }

  const { error } = await supabase.from("clientes").update(updateData).eq("id", id);
  if (error) return { error: "Erro ao atualizar pacote." };

  revalidatePath("/clientes");
  return { success: true };
}

/** Recupera cliente do LTV (churn → ongoing) — só admin */
export async function recuperarCliente(id: string) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({
    status: "ongoing",
    data_saida: null,
    motivo_churn: null,
  }).eq("id", id);

  if (error) return { error: "Erro ao recuperar cliente." };

  // Gerar faturas se aplicável
  let faturasGeradas = 0;
  if (clienteGeraFaturasAutomaticamente({ status: "ongoing" })) {
    const resultado = await gerarFaturasIniciaisDoCliente(id);
    faturasGeradas = resultado.count;
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/dashboards/ltv");
  revalidatePath("/dashboards/clientes");
  revalidatePath("/financeiro/cobrancas");
  return { success: true, faturasGeradas };
}

/** Marca churn — todos podem (é mudança de status) */
export async function marcarChurn(id: string, dataSaida: string, motivoChurn: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ status: "churn", data_saida: dataSaida, motivo_churn: motivoChurn }).eq("id", id);
  if (error) return { error: "Erro ao marcar churn." };
  await cancelarFaturasFuturas(id, dataSaida);
  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/financeiro");
  return { success: true };
}

/** Marca churn em massa — todos podem (status) */
export async function marcarChurnEmMassa(ids: string[], dataSaida: string, motivoChurn: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ status: "churn", data_saida: dataSaida, motivo_churn: motivoChurn }).in("id", ids);
  if (error) return { error: "Erro ao marcar churn." };
  for (const id of ids) await cancelarFaturasFuturas(id, dataSaida);
  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/financeiro");
  return { success: true, count: ids.length };
}

/** Atualiza campo em massa — só admin */
export async function atualizarClientesEmMassa(ids: string[], campo: string, valor: string | null) {
  const email = await getEmailLogado();
  if (!ehAdmin(email)) return { error: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ [campo]: valor }).in("id", ids);
  if (error) return { error: "Erro ao atualizar clientes." };

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  return { success: true, count: ids.length };
}

function limparDadosVazios(dados: Record<string, unknown>) {
  const limpo: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    limpo[chave] = valor === "" ? null : valor;
  }
  return limpo;
}
