import type { Cliente } from "@/types/cliente";

/** Frequência de cobrança derivada da forma de pagamento */
export type Frequencia = "mensal" | "semanal" | "quinzenal";

/** Determina a frequência com base no nome da forma de pagamento */
export function getFrequenciaDaFormaPagamento(
  formaPagamento: string | null
): Frequencia | null {
  if (!formaPagamento) return null;
  const fp = formaPagamento.toLowerCase();
  if (fp.includes("semanal")) return "semanal";
  if (fp.includes("quinzenal")) return "quinzenal";
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

/** Gera todas as datas de vencimento para um cliente num intervalo */
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
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dia);
    if (cursor < dataInicio) cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= dataFim) {
      datas.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  if (frequencia === "semanal") {
    const diaSemana = cliente.dia_semana_pagamento ?? 1; // default segunda
    const cursor = new Date(dataInicio);
    // Avançar até o primeiro dia da semana correto
    while (cursor.getDay() !== diaSemana) {
      cursor.setDate(cursor.getDate() + 1);
    }
    while (cursor <= dataFim) {
      datas.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  if (frequencia === "quinzenal") {
    const dias = cliente.dias_pagamento_quinzenal || [1, 15];
    const cursor = new Date(
      dataInicio.getFullYear(),
      dataInicio.getMonth(),
      1
    );
    if (cursor < dataInicio) {
      // Se o mês começou antes do intervalo, tenta o mês anterior
    }
    // Iterar mês a mês e gerar 2 faturas por mês
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
    // Calcular número da semana no ano
    const inicio = new Date(d.getFullYear(), 0, 1);
    const semana = Math.ceil(
      ((d.getTime() - inicio.getTime()) / 86400000 + inicio.getDay() + 1) / 7
    );
    return `Semana ${semana}/${d.getFullYear()}`;
  }

  return `${meses[d.getMonth()]}/${d.getFullYear()}`;
}
