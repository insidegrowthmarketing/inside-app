-- =============================================
-- Inside App - Módulo Financeiro
-- Migração: 008_tipo_fatura
-- Descrição: Adiciona campo tipo (recorrente/avulsa)
--            e descricao na tabela faturas
-- =============================================

ALTER TABLE faturas ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'recorrente'
  CHECK (tipo IN ('recorrente', 'avulsa'));

ALTER TABLE faturas ADD COLUMN IF NOT EXISTS descricao TEXT;
