// =============================================
// Inside App - Tipos do módulo de Clientes
// =============================================

/** Representa um cliente completo vindo do banco de dados */
export type Cliente = {
  id: string;
  nome: string;
  regiao: string | null;
  fuso_horario: string | null;
  status: "a_iniciar" | "onboarding" | "ongoing" | "aviso_previo" | "churn";
  fee_mensal: number;
  forma_pagamento: string | null;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  data_pagamento: number | null;
  gestor_projetos: string | null;
  gestor_trafego: string | null;
  responsavel_financeiro: string | null;
  contato_financeiro: string | null;
  usa_crm: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

/** Dados para criação/edição de cliente (sem campos automáticos) */
export type ClienteInput = Omit<Cliente, "id" | "created_at" | "updated_at">;

// =============================================
// Constantes
// =============================================

/** Status possíveis do cliente com label em português e cor do badge */
export const STATUS_CLIENTE = [
  { value: "a_iniciar", label: "A iniciar", cor: "zinc" },
  { value: "onboarding", label: "Onboarding", cor: "blue" },
  { value: "ongoing", label: "Ongoing", cor: "green" },
  { value: "aviso_previo", label: "Aviso prévio", cor: "yellow" },
  { value: "churn", label: "Churn", cor: "red" },
] as const;

/** Gestores de projetos da agência */
export const GESTORES_PROJETOS = [
  "Maria Paula",
  "Gabriela",
  "Aline",
  "Sergio",
  "Bruna",
  "Gerlaine",
] as const;

/** Gestores de tráfego da agência */
export const GESTORES_TRAFEGO = [
  "Jean",
  "Caio",
  "Ana Luiza",
  "Lucas",
  "Rodrigo",
  "Mirella",
  "Luiz Felipe",
] as const;

/** Formas de pagamento aceitas */
export const FORMAS_PAGAMENTO = [
  "PIX",
  "Boleto",
  "Cartão",
  "Transferência",
] as const;

/** Fusos horários disponíveis */
export const FUSOS_HORARIOS = [
  "GMT-2",
  "GMT-3 (Brasília)",
  "GMT-4",
  "GMT-5",
] as const;
