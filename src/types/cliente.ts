// =============================================
// Inside App - Tipos do módulo de Clientes
// =============================================

/** Representa um cliente completo vindo do banco de dados */
export type Cliente = {
  id: string;
  nome: string;
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
  data_saida: string | null;
  motivo_churn: string | null;
  dia_semana_pagamento: number | null;
  dias_pagamento_quinzenal: number[] | null;
  head: string | null;
  created_at: string;
  updated_at: string;
};

/** Dados para criação/edição de cliente (sem campos automáticos) */
export type ClienteInput = Omit<Cliente, "id" | "created_at" | "updated_at">;

// =============================================
// Constantes
// =============================================

/** Status considerados "ativos" (todos exceto churn) */
export const STATUS_ATIVOS = ["a_iniciar", "onboarding", "ongoing", "aviso_previo"] as const;

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
  "Luiz Felipe",
  "Samara",
  "Gabriel",
  "Eliane",
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
  "ASAAS",
] as const;

/** Fusos horários disponíveis */
export const FUSOS_HORARIOS = [
  // Brasil — America/Sao_Paulo
  { value: "brasilia_df", label: "Brasília, DF (GMT-3)", timezone: "America/Sao_Paulo" },
  // Costa Leste — America/New_York
  { value: "atlanta_ga", label: "Atlanta, GA", timezone: "America/New_York" },
  { value: "boca_raton_fl", label: "Boca Raton, FL", timezone: "America/New_York" },
  { value: "boston_ma", label: "Boston, MA", timezone: "America/New_York" },
  { value: "charlotte_nc", label: "Charlotte, NC", timezone: "America/New_York" },
  { value: "clearwater_fl", label: "Clearwater, FL", timezone: "America/New_York" },
  { value: "connecticut", label: "Connecticut", timezone: "America/New_York" },
  { value: "delaware", label: "Delaware", timezone: "America/New_York" },
  { value: "destin_fl", label: "Destin, FL", timezone: "America/New_York" },
  { value: "florida", label: "Flórida", timezone: "America/New_York" },
  { value: "fort_myers_fl", label: "Fort Myers, FL", timezone: "America/New_York" },
  { value: "freeport_me", label: "Freeport, ME", timezone: "America/New_York" },
  { value: "gloucester_ma", label: "Gloucester, MA", timezone: "America/New_York" },
  { value: "jacksonville_fl", label: "Jacksonville, FL", timezone: "America/New_York" },
  { value: "jacksonville_nc", label: "Jacksonville, NC", timezone: "America/New_York" },
  { value: "manchester_nh", label: "Manchester, NH", timezone: "America/New_York" },
  { value: "maryland", label: "Maryland", timezone: "America/New_York" },
  { value: "massachusetts", label: "Massachusetts", timezone: "America/New_York" },
  { value: "new_jersey", label: "New Jersey", timezone: "America/New_York" },
  { value: "north_carolina", label: "North Carolina", timezone: "America/New_York" },
  { value: "orlando_fl", label: "Orlando, FL", timezone: "America/New_York" },
  { value: "pompano_beach_fl", label: "Pompano Beach, FL", timezone: "America/New_York" },
  { value: "pennsylvania", label: "Pennsylvania", timezone: "America/New_York" },
  { value: "sarasota_fl", label: "Sarasota, FL", timezone: "America/New_York" },
  { value: "south_carolina", label: "South Carolina", timezone: "America/New_York" },
  { value: "tampa_fl", label: "Tampa, FL", timezone: "America/New_York" },
  // Mountain — America/Denver
  { value: "draper_ut", label: "Draper, UT", timezone: "America/Denver" },
  { value: "utah", label: "Utah", timezone: "America/Denver" },
  // Costa Oeste — America/Los_Angeles
  { value: "california", label: "California", timezone: "America/Los_Angeles" },
  { value: "everett_wa", label: "Everett, WA", timezone: "America/Los_Angeles" },
  { value: "san_francisco_ca", label: "San Francisco, CA", timezone: "America/Los_Angeles" },
  { value: "seattle_wa", label: "Seattle, WA", timezone: "America/Los_Angeles" },
  { value: "washington", label: "Washington", timezone: "America/Los_Angeles" },
] as const;

/** Pacotes disponíveis */
export const PACOTES = [
  { value: "start", label: "Start", dias_contrato: 35 },
  { value: "pro", label: "PRO", dias_contrato: null },
  { value: "gbp", label: "GBP", dias_contrato: null },
  { value: "ia", label: "IA", dias_contrato: null },
] as const;

/** Motivos de churn */
export const MOTIVOS_CHURN = [
  "Alta demanda",
  "Apenas estruturação",
  "Baixo engajamento",
  "Baixa maturidade digital",
  "Baixa verba para investir",
  "Baixo retorno",
  "Cumpriu contrato e não renovou",
  "Inadimplente",
  "Primarizou",
  "Fechou a empresa",
] as const;

/** Heads (responsáveis estratégicos) */
export const HEADS = ["Caio", "Jean"] as const;

/** Moedas aceitas */
export const MOEDAS = [
  { value: "BRL", label: "R$", nome: "Real" },
  { value: "USD", label: "US$", nome: "Dólar" },
] as const;
