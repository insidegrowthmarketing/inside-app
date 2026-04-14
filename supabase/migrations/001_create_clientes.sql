-- =============================================
-- Inside App - Módulo de Clientes
-- Migração: 001_create_clientes
-- Descrição: Cria a tabela de clientes da agência
-- =============================================

-- Tabela principal de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informações gerais
  nome TEXT NOT NULL,
  regiao TEXT,
  fuso_horario TEXT,
  status TEXT NOT NULL DEFAULT 'a_iniciar'
    CHECK (status IN ('a_iniciar', 'onboarding', 'ongoing', 'aviso_previo', 'churn')),

  -- Contrato e financeiro
  fee_mensal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  inicio_contrato DATE,
  fim_contrato DATE,
  data_pagamento INTEGER CHECK (data_pagamento >= 1 AND data_pagamento <= 31),

  -- Responsáveis internos
  gestor_projetos TEXT,
  gestor_trafego TEXT,

  -- Responsável financeiro do cliente
  responsavel_financeiro TEXT,
  contato_financeiro TEXT,

  -- Outros
  usa_crm BOOLEAN DEFAULT FALSE,
  observacoes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice em status para buscas rápidas por filtro
CREATE INDEX idx_clientes_status ON clientes (status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que dispara a função em cada UPDATE
CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- Habilitar Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política permissiva temporária: qualquer usuário autenticado
-- pode fazer SELECT, INSERT, UPDATE e DELETE.
-- (Vamos refinar as permissões por role/equipe depois)
CREATE POLICY "Acesso total para usuários autenticados"
  ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
