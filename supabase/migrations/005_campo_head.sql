-- =============================================
-- Inside App - Módulo de Clientes
-- Migração: 005_campo_head
-- Descrição: Adiciona coluna head (responsável
--            estratégico) na tabela clientes
-- =============================================

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS head TEXT;
