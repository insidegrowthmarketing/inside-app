-- =============================================
-- Inside App - Módulo de Clientes
-- Migração: 003_ltv_e_ajustes
-- Descrição: Remove coluna regiao, adiciona
--            data_saida e motivo_churn para LTV
-- =============================================

-- 1. Remover coluna regiao
ALTER TABLE clientes DROP COLUMN IF EXISTS regiao;

-- 2. Adicionar coluna data_saida (date, nullable)
ALTER TABLE clientes ADD COLUMN data_saida DATE;

-- 3. Adicionar coluna motivo_churn (text, nullable)
ALTER TABLE clientes ADD COLUMN motivo_churn TEXT;
