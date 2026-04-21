-- =============================================
-- Inside App - Módulo de Clientes
-- Migração: 002_ajustes_clientes
-- Descrição: Adiciona colunas pacote e moeda,
--            renomeia usa_crm para contempla_ghl
-- =============================================

-- 1. Adicionar coluna pacote (text, nullable)
ALTER TABLE clientes
  ADD COLUMN pacote TEXT
    CHECK (pacote IN ('start', 'pro', 'gbp', 'ia'));

-- 2. Adicionar coluna moeda (text, not null, default 'BRL')
ALTER TABLE clientes
  ADD COLUMN moeda TEXT NOT NULL DEFAULT 'BRL'
    CHECK (moeda IN ('BRL', 'USD'));

-- 3. Renomear usa_crm para contempla_ghl
ALTER TABLE clientes
  RENAME COLUMN usa_crm TO contempla_ghl;
