/**
 * Utilitários de integração com WhatsApp via API Stevo.
 *
 * Variáveis de ambiente necessárias no .env.local:
 *   STEVO_API_URL=https://sm-galo.stevo.chat
 *   STEVO_API_KEY=sua_chave_aqui
 */

import { formatarMoeda } from "./formatters";

// =============================================
// Normalização de telefone
// =============================================

/** Extrai e normaliza número de telefone de um contato */
export function normalizarTelefone(contato: string | null | undefined): string | null {
  if (!contato) return null;

  // Se tem " - ", pegar só a parte depois (telefone)
  const partes = contato.split(" - ");
  const parteNumero = partes.length > 1 ? partes.slice(1).join(" - ") : contato;

  // Extrair só dígitos
  const digitos = parteNumero.replace(/\D/g, "");
  if (!digitos || digitos.length < 10) return null;

  // EUA: começa com 1 e tem 11 dígitos → já está completo
  if (digitos.startsWith("1") && digitos.length === 11) return digitos;

  // EUA: 10 dígitos sem o 1 → adicionar
  if (!digitos.startsWith("1") && !digitos.startsWith("55") && digitos.length === 10) return "1" + digitos;

  // Brasil: começa com 55 e tem 12-13 dígitos → já está completo
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) return digitos;

  // Brasil: DDD + número (10-11 dígitos, DDD entre 11-99) → adicionar 55
  if (!digitos.startsWith("55") && !digitos.startsWith("1")) {
    const ddd = parseInt(digitos.substring(0, 2));
    if (ddd >= 11 && ddd <= 99 && (digitos.length === 10 || digitos.length === 11)) {
      return "55" + digitos;
    }
  }

  // Já tem código de país e parece válido
  if (digitos.length >= 11 && digitos.length <= 15) return digitos;

  return null;
}

// =============================================
// Templates de mensagem
// =============================================

type TemplateCobranca = "lembrete_1dia" | "cobranca_dia" | "manual";

interface DadosTemplate {
  nomeContato: string;
  dataVencimento: string;
  moeda: "BRL" | "USD";
  valor: number;
  formaPagamento: string;
}

/** Extrai primeiro nome do contato financeiro */
function extrairNome(responsavel: string | null, contato: string | null): string {
  if (responsavel) return responsavel.split(" ")[0];
  if (contato) {
    const partes = contato.split(" - ");
    if (partes.length > 1) return partes[0].trim().split(" ")[0];
    // Se só tem número, retornar genérico
    if (/^\d/.test(contato)) return "Cliente";
    return contato.split(" ")[0];
  }
  return "Cliente";
}

/** Gera mensagem de cobrança baseada no template */
export function gerarMensagemTemplate(
  template: TemplateCobranca,
  fatura: { data_vencimento: string; valor: number; moeda: "BRL" | "USD" },
  cliente: {
    responsavel_financeiro: string | null;
    contato_financeiro: string | null;
    forma_pagamento: string | null;
  }
): string {
  const nome = extrairNome(cliente.responsavel_financeiro, cliente.contato_financeiro);
  const d = new Date(fatura.data_vencimento + "T00:00:00");
  const dataFmt = d.toLocaleDateString("pt-BR");
  const simbolo = fatura.moeda === "BRL" ? "R$" : "US$";
  const valorFmt = formatarMoeda(fatura.valor, fatura.moeda);
  const forma = cliente.forma_pagamento || "—";

  // Chave Zelle condicional (1 quebra simples — fica colada com "Forma de pagamento")
  const ehZelle = (cliente.forma_pagamento || "").toLowerCase().includes("zelle");
  const dadosPagamento = ehZelle ? "\nChave Zelle: jessicapenaforte@hotmail.com" : "";

  switch (template) {
    case "lembrete_1dia":
      return `Oi ${nome}!\n\nLembrete automático: amanhã (${dataFmt}) vence sua cobrança Inside no valor de ${valorFmt}.\n\nForma de pagamento: ${forma}.${dadosPagamento}\n\nQualquer dúvida, é só chamar 💜`;

    case "cobranca_dia":
      return `Oi ${nome}!\n\n⚠️ Hoje é o vencimento da sua cobrança Inside no valor de ${valorFmt}. Pode compartilhar o comprovante quando realizar?\n\nForma de pagamento: ${forma}.${dadosPagamento}\n\nConta com a gente! 🤝\n*Mensagem automática - desconsiderar caso já tenha efetuado o pagamento.`;

    case "manual":
    default:
      return `Oi ${nome}!\n\nSua cobrança Inside no valor de ${valorFmt} com vencimento em ${dataFmt} está pendente.\n\nForma de pagamento: ${forma}.${dadosPagamento}\n\nQualquer dúvida, estamos por aqui! 💜`;
  }
}

// =============================================
// Envio via API Stevo
// =============================================

/** Envia mensagem de texto via WhatsApp (API Stevo) */
export async function enviarMensagemWhatsApp(
  numero: string,
  texto: string
): Promise<{ sucesso: boolean; erro?: string }> {
  const apiUrl = process.env.STEVO_API_URL;
  const apiKey = process.env.STEVO_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error("[WhatsApp] STEVO_API_URL ou STEVO_API_KEY não configuradas");
    return { sucesso: false, erro: "Configuração da API WhatsApp não encontrada" };
  }

  const url = `${apiUrl}/send/text`;

  console.log(`[WhatsApp] Enviando pra ${numero}: ${texto.substring(0, 60)}...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: numero,
        text: texto,
        delay: 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[WhatsApp] Erro ${response.status}:`, body);
      return { sucesso: false, erro: `Erro ${response.status}: ${body.substring(0, 200)}` };
    }

    console.log("[WhatsApp] Mensagem enviada com sucesso");
    return { sucesso: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] Erro de rede:", msg);
    return { sucesso: false, erro: msg.includes("abort") ? "Timeout (15s)" : msg };
  }
}
