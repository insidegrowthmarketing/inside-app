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
  contempla_ghl: boolean;
  observacoes: string | null;
  pacote: "start" | "pro" | "gbp" | "ia" | null;
  moeda: "BRL" | "USD";
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
  "Gabriel Samara",
  "Luiz Felipe",
] as const;

/** Formas de pagamento aceitas */
export const FORMAS_PAGAMENTO = [
  "Stripe Brasil mensal",
  "Stripe Brasil semanal",
  "Stripe EUA mensal",
  "Stripe EUA semanal",
  "Transferência BOFA quinzenal",
  "Zelle mensal",
  "Zelle quinzenal",
  "Zelle semanal",
] as const;

/** Fusos horários disponíveis (cidades americanas com diferença em relação a Brasília) */
export const FUSOS_HORARIOS = [
  // Costa Leste (-2h em relação a Brasília)
  { value: "Atlanta, GA", label: "Atlanta, GA (-2h)", diferenca_brasilia: -2 },
  { value: "Boca Raton, FL", label: "Boca Raton, FL (-2h)", diferenca_brasilia: -2 },
  { value: "Boston, MA", label: "Boston, MA (-2h)", diferenca_brasilia: -2 },
  { value: "Charlotte, NC", label: "Charlotte, NC (-2h)", diferenca_brasilia: -2 },
  { value: "Clearwater, FL", label: "Clearwater, FL (-2h)", diferenca_brasilia: -2 },
  { value: "Connecticut", label: "Connecticut (-2h)", diferenca_brasilia: -2 },
  { value: "Delaware", label: "Delaware (-2h)", diferenca_brasilia: -2 },
  { value: "Destin, FL", label: "Destin, FL (-2h)", diferenca_brasilia: -2 },
  { value: "Fort Myers, FL", label: "Fort Myers, FL (-2h)", diferenca_brasilia: -2 },
  { value: "Freeport, ME", label: "Freeport, ME (-2h)", diferenca_brasilia: -2 },
  { value: "Jacksonville, FL", label: "Jacksonville, FL (-2h)", diferenca_brasilia: -2 },
  { value: "Jacksonville, NC", label: "Jacksonville, NC (-2h)", diferenca_brasilia: -2 },
  { value: "Manchester, NH", label: "Manchester, NH (-2h)", diferenca_brasilia: -2 },
  { value: "Maryland", label: "Maryland (-2h)", diferenca_brasilia: -2 },
  { value: "Massachusetts", label: "Massachusetts (-2h)", diferenca_brasilia: -2 },
  { value: "New Jersey", label: "New Jersey (-2h)", diferenca_brasilia: -2 },
  { value: "Orlando, FL", label: "Orlando, FL (-2h)", diferenca_brasilia: -2 },
  { value: "Pennsylvania", label: "Pennsylvania (-2h)", diferenca_brasilia: -2 },
  { value: "Sarasota, FL", label: "Sarasota, FL (-2h)", diferenca_brasilia: -2 },
  { value: "South Carolina", label: "South Carolina (-2h)", diferenca_brasilia: -2 },
  { value: "Tampa, FL", label: "Tampa, FL (-2h)", diferenca_brasilia: -2 },
  // Mountain (-3h em relação a Brasília)
  { value: "Draper, UT", label: "Draper, UT (-3h)", diferenca_brasilia: -3 },
  { value: "Utah", label: "Utah (-3h)", diferenca_brasilia: -3 },
  // Costa Oeste (-4h em relação a Brasília)
  { value: "California", label: "California (-4h)", diferenca_brasilia: -4 },
  { value: "Everett, WA", label: "Everett, WA (-4h)", diferenca_brasilia: -4 },
  { value: "San Francisco, CA", label: "San Francisco, CA (-4h)", diferenca_brasilia: -4 },
  { value: "Seattle, WA", label: "Seattle, WA (-4h)", diferenca_brasilia: -4 },
] as const;

/** Pacotes disponíveis */
export const PACOTES = [
  { value: "start", label: "Start", dias_contrato: 35 },
  { value: "pro", label: "PRO", dias_contrato: null },
  { value: "gbp", label: "GBP", dias_contrato: null },
  { value: "ia", label: "IA", dias_contrato: null },
] as const;

/** Moedas aceitas */
export const MOEDAS = [
  { value: "BRL", label: "R$", nome: "Real" },
  { value: "USD", label: "US$", nome: "Dólar" },
] as const;
