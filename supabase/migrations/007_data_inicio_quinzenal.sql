-- =============================================
-- Inside App - Módulo de Clientes
-- Migração: 007_data_inicio_quinzenal
-- Descrição: Adiciona campo data_inicio_quinzenal
--            para nova lógica de cobrança a cada 15 dias
-- =============================================

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_inicio_quinzenal DATE;
