import { z } from "zod";

/** Schema de validação para o formulário de cliente */
export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  status: z.enum(["a_iniciar", "onboarding", "ongoing", "aviso_previo", "churn"], {
    message: "Status é obrigatório",
  }),
  fuso_horario: z.string(),
  fee_mensal: z.number({ message: "Fee é obrigatório" }).min(0, "Fee deve ser positivo"),
  moeda: z.enum(["BRL", "USD"], { message: "Moeda é obrigatória" }),
  forma_pagamento: z.string(),
  inicio_contrato: z.string().min(1, "Data de início é obrigatória"),
  fim_contrato: z.string(),
  data_pagamento: z.number().int().min(1).max(31).nullable(),
  dia_semana_pagamento: z.number().int().min(0).max(6).nullable(),
  dias_pagamento_quinzenal: z.array(z.number().int().min(1).max(31)).nullable(),
  gestor_projetos: z.string().min(1, "Gestor de projetos é obrigatório"),
  gestor_trafego: z.string().min(1, "Gestor de tráfego é obrigatório"),
  responsavel_financeiro: z.string(),
  contato_financeiro: z.string(),
  contempla_ghl: z.boolean(),
  observacoes: z.string(),
  pacote: z.enum(["start", "pro", "gbp", "ia"], { message: "Pacote é obrigatório" }),
  data_saida: z.string().nullable().optional(),
  motivo_churn: z.string().nullable().optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
