"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/schemas/cliente";

/** Cria um novo cliente no Supabase */
export async function criarCliente(formData: unknown) {
  const parsed = clienteSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const supabase = await createClient();
  const dados = limparDadosVazios(parsed.data);

  const { error } = await supabase.from("clientes").insert(dados);

  if (error) {
    console.error("Erro ao criar cliente:", error);
    return { error: "Erro ao salvar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
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

/** Remove strings vazias para enviar null ao banco */
function limparDadosVazios(dados: Record<string, unknown>) {
  const limpo: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    limpo[chave] = valor === "" ? null : valor;
  }
  return limpo;
}
