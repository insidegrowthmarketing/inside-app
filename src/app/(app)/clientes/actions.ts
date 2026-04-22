"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/schemas/cliente";

/** Cria um novo cliente no Supabase e retorna o ID (sem redirecionar) */
export async function criarCliente(formData: unknown) {
  const parsed = clienteSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const supabase = await createClient();
  const dados = limparDadosVazios(parsed.data);

  const { data, error } = await supabase.from("clientes").insert(dados).select("id").single();

  if (error || !data) {
    console.error("Erro ao criar cliente:", error);
    return { error: "Erro ao salvar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  return { clienteId: data.id };
}

/** Atualiza um cliente existente no Supabase */
export async function atualizarCliente(id: string, formData: unknown) {
  const parsed = clienteSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const supabase = await createClient();
  const dados = limparDadosVazios(parsed.data);

  const { error } = await supabase.from("clientes").update(dados).eq("id", id);

  if (error) {
    console.error("Erro ao atualizar cliente:", error);
    return { error: "Erro ao atualizar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

/** Exclui um cliente do Supabase */
export async function excluirCliente(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir cliente:", error);
    return { error: "Erro ao excluir cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

/** Atualiza um campo individual de um cliente (para edição inline na listagem) */
export async function atualizarCampoCliente(
  id: string,
  campo: string,
  valor: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({ [campo]: valor })
    .eq("id", id);

  if (error) {
    console.error(`Erro ao atualizar ${campo}:`, error);
    return { error: `Erro ao atualizar. Tente novamente.` };
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  return { success: true };
}

/** Atualiza o pacote de um cliente com lógica de fim_contrato */
export async function atualizarPacoteCliente(
  id: string,
  novoPacote: string
) {
  const supabase = await createClient();

  // Buscar dados atuais do cliente para calcular fim_contrato
  const { data: cliente, error: fetchErr } = await supabase
    .from("clientes")
    .select("inicio_contrato")
    .eq("id", id)
    .single();

  if (fetchErr || !cliente) {
    return { error: "Erro ao buscar cliente." };
  }

  const updateData: Record<string, unknown> = { pacote: novoPacote };

  if (novoPacote === "start" && cliente.inicio_contrato) {
    const inicio = new Date(cliente.inicio_contrato + "T00:00:00");
    inicio.setDate(inicio.getDate() + 35);
    updateData.fim_contrato = inicio.toISOString().split("T")[0];
  } else if (novoPacote === "pro") {
    updateData.fim_contrato = null;
  }

  const { error } = await supabase
    .from("clientes")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar pacote:", error);
    return { error: "Erro ao atualizar pacote. Tente novamente." };
  }

  revalidatePath("/clientes");
  return { success: true };
}

/** Marca um cliente como churn com data de saída e motivo */
export async function marcarChurn(
  id: string,
  dataSaida: string,
  motivoChurn: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({
      status: "churn",
      data_saida: dataSaida,
      motivo_churn: motivoChurn,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao marcar churn:", error);
    return { error: "Erro ao marcar churn. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  return { success: true };
}

/** Marca múltiplos clientes como churn em massa */
export async function marcarChurnEmMassa(
  ids: string[],
  dataSaida: string,
  motivoChurn: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({
      status: "churn",
      data_saida: dataSaida,
      motivo_churn: motivoChurn,
    })
    .in("id", ids);

  if (error) {
    console.error("Erro ao marcar churn em massa:", error);
    return { error: "Erro ao marcar churn. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  return { success: true, count: ids.length };
}

/** Atualiza um campo em massa para múltiplos clientes */
export async function atualizarClientesEmMassa(
  ids: string[],
  campo: string,
  valor: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({ [campo]: valor })
    .in("id", ids);

  if (error) {
    console.error(`Erro ao atualizar em massa:`, error);
    return { error: "Erro ao atualizar clientes. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/ltv");
  return { success: true, count: ids.length };
}

/** Remove strings vazias para enviar null ao banco */
function limparDadosVazios(dados: Record<string, unknown>) {
  const limpo: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    limpo[chave] = valor === "" ? null : valor;
  }
  return limpo;
}
