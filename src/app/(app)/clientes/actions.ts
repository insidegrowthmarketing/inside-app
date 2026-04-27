"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/schemas/cliente";
import { STATUS_ATIVOS } from "@/types/cliente";
import {
  gerarFaturasIniciaisDoCliente,
  cancelarFaturasFuturas,
} from "@/app/(app)/financeiro/actions";
import { clienteGeraFaturasAutomaticamente } from "@/lib/faturas";
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
    // Admin pode atualizar TUDO
    const dados = limparDadosVazios(parsed.data);
    const { error } = await supabase.from("clientes").update(dados).eq("id", id);
    if (error) { console.error("Erro ao atualizar cliente:", error); return { error: "Erro ao atualizar cliente." }; }

    const statusAtual = parsed.data.status;
    if ((STATUS_ATIVOS as readonly string[]).includes(statusAtual) && clienteGeraFaturasAutomaticamente(parsed.data)) {
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
  const { error } = await supabase.from("clientes").update({ [campo]: valor }).eq("id", id);
  if (error) return { error: "Erro ao atualizar." };

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath("/financeiro");
  return { success: true };
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
