import { z } from "zod";

/** Schema de validação para o formulário de cliente */
export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  status: z.enum(["a_iniciar", "onboarding", "ongoing", "aviso_previo", "churn"], {
    message: "Status é obrigatório",
  }),
  regiao: z.string(),
  fuso_horario: z.string(),
  fee_mensal: z.number({ message: "Fee é obrigatório" }).min(0, "Fee deve ser positivo"),
  forma_pagamento: z.string(),
  inicio_contrato: z.string().min(1, "Data de início é obrigatória"),
  fim_contrato: z.string(),
  data_pagamento: z.number().int().min(1).max(31).nullable(),
  gestor_projetos: z.string().min(1, "Gestor de projetos é obrigatório"),
  gestor_trafego: z.string().min(1, "Gestor de tráfego é obrigatório"),
  responsavel_financeiro: z.string(),
  contato_financeiro: z.string(),
  usa_crm: z.boolean(),
  observacoes: z.string(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
