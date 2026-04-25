import type { Cliente } from "@/types/cliente";

/** Verifica se o cliente deve ter faturas geradas automaticamente */
export function clienteGeraFaturasAutomaticamente(cliente: {
  forma_pagamento?: string | null;
  status?: string;
}): boolean {
  const forma = (cliente.forma_pagamento ?? "").toLowerCase();

  // Forma de pagamento com integração externa futura — não gera manualmente
  if (forma.startsWith("stripe")) return false;
  if (forma === "asaas") return false;

  // Status que não devem gerar faturas
  if (cliente.status === "pausado") return false;
  if (cliente.status === "churn") return false;

  // Todos os demais (a_iniciar, onboarding, ongoing, aviso_previo) com Zelle/BOFA geram
  return true;
}

/** Frequência de cobrança derivada da forma de pagamento */
export type Frequencia = "mensal" | "semanal" | "quinzenal";

/** Determina a frequência com base no nome da forma de pagamento */
export function getFrequenciaDaFormaPagamento(
  formaPagamento: string | null
): Frequencia | null {
  if (!formaPagamento) return null;
  const fp = formaPagamento.toLowerCase();
  // Checar "semanal" antes de "mensal" pois "semanal" não contém "mensal"
  // Mas "quinzenal" deve vir primeiro pois também não contém os outros
  if (fp.includes("quinzenal")) return "quinzenal";
  if (fp.includes("semanal")) return "semanal";
  if (fp.includes("mensal")) return "mensal";
  return null;
}

/** Calcula o valor de cada fatura com base na frequência */
export function calcularValorFatura(
  feeMensal: number,
  frequencia: Frequencia
): number {
  switch (frequencia) {
    case "mensal":
      return Math.round(feeMensal * 100) / 100;
    case "semanal":
      return Math.round((feeMensal / 4) * 100) / 100;
    case "quinzenal":
      return Math.round((feeMensal / 2) * 100) / 100;
  }
}

/**
 * Gera todas as datas de vencimento para um cliente num intervalo.
 *
 * MENSAL: uma fatura por mês no dia data_pagamento
 * SEMANAL: uma fatura por semana no dia_semana_pagamento (0=dom, 6=sáb)
 * QUINZENAL: duas faturas por mês nos dias_pagamento_quinzenal[0] e [1]
 */
export function gerarDatasFaturas(
  cliente: Cliente,
  dataInicio: Date,
  dataFim: Date
): Date[] {
  const frequencia = getFrequenciaDaFormaPagamento(cliente.forma_pagamento);
  if (!frequencia) return [];

  const datas: Date[] = [];

  if (frequencia === "mensal") {
    const dia = cliente.data_pagamento || 1;
    // Começar do mês de dataInicio
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dia);
    // Se a data calculada caiu antes do início, avançar 1 mês
    if (cursor < dataInicio) {
      cursor.setMonth(cursor.getMonth() + 1);
    }
    while (cursor <= dataFim) {
      datas.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  if (frequencia === "semanal") {
    const diaSemana = cliente.dia_semana_pagamento ?? 1; // default segunda
    // Começar do dataInicio e avançar até o primeiro dia da semana correto
    const cursor = new Date(dataInicio);
    while (cursor.getDay() !== diaSemana) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor > dataFim) break;
    }
    // Iterar semana a semana
    while (cursor <= dataFim) {
      datas.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  if (frequencia === "quinzenal") {
    // Novo modelo: a cada 15 dias a partir de data_inicio_quinzenal
    if (cliente.data_inicio_quinzenal) {
      const cursor = new Date(cliente.data_inicio_quinzenal + "T00:00:00");
      while (cursor <= dataFim) {
        if (cursor >= dataInicio) {
          datas.push(new Date(cursor));
        }
        cursor.setDate(cursor.getDate() + 15);
      }
    }
    // Modelo antigo: 2 dias fixos por mês
    else if (cliente.dias_pagamento_quinzenal && cliente.dias_pagamento_quinzenal.length === 2) {
      const dias = cliente.dias_pagamento_quinzenal;
      const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
      while (cursor <= dataFim) {
        for (const dia of dias) {
          const d = new Date(cursor.getFullYear(), cursor.getMonth(), dia);
          if (d >= dataInicio && d <= dataFim) {
            datas.push(d);
          }
        }
        cursor.setMonth(cursor.getMonth() + 1);
      }
      datas.sort((a, b) => a.getTime() - b.getTime());
    }
  }

  return datas;
}

/** Formata data de referência legível */
export function formatarReferencia(
  dataRef: string,
  formaPagamento: string | null
): string {
  const d = new Date(dataRef + "T00:00:00");
  if (isNaN(d.getTime())) return dataRef;

  const freq = getFrequenciaDaFormaPagamento(formaPagamento);
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  if (freq === "semanal") {
    const inicio = new Date(d.getFullYear(), 0, 1);
    const semana = Math.ceil(
      ((d.getTime() - inicio.getTime()) / 86400000 + inicio.getDay() + 1) / 7
    );
    return `Semana ${semana}/${d.getFullYear()}`;
  }

  return `${meses[d.getMonth()]}/${d.getFullYear()}`;
}
