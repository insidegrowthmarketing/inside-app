// =============================================
// Inside App - Tipos do módulo Financeiro
// =============================================

/** Representa uma fatura no banco de dados */
export type Fatura = {
  id: string;
  cliente_id: string;
  data_referencia: string;
  data_vencimento: string;
  valor: number;
  moeda: "BRL" | "USD";
  forma_pagamento: string | null;
  status: "pendente" | "paga" | "cancelada";
  data_pagamento_real: string | null;
  ultima_cobranca_em: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

/** Fatura com dados do cliente (join) */
export type FaturaComCliente = Fatura & {
  clientes: {
    nome: string;
    id: string;
    responsavel_financeiro?: string | null;
    contato_financeiro?: string | null;
  } | null;
};

/** Status em runtime (inclui 'atrasada' derivado) */
export type StatusFaturaRuntime = "pendente" | "paga" | "cancelada" | "atrasada";

/** Calcula o status em runtime (atrasada = pendente + vencida) */
export function calcularStatusRuntime(fatura: Fatura): StatusFaturaRuntime {
  if (fatura.status === "paga") return "paga";
  if (fatura.status === "cancelada") return "cancelada";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(fatura.data_vencimento + "T00:00:00");
  if (vencimento < hoje) return "atrasada";
  return "pendente";
}

/** Status da fatura com label e cor para badge */
export const STATUS_FATURA = [
  { value: "pendente", label: "Pendente", cor: "zinc" },
  { value: "paga", label: "Paga", cor: "green" },
  { value: "atrasada", label: "Atrasada", cor: "red" },
  { value: "cancelada", label: "Cancelada", cor: "strikethrough" },
] as const;

/** Dias da semana */
export const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
] as const;
