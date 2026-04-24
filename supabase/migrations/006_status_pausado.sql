-- =============================================
-- Inside App - Módulo de Clientes
-- Migração: 006_status_pausado
-- Descrição: Adiciona status 'pausado' à
--            constraint de status da tabela clientes
-- =============================================

ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_status_check;

ALTER TABLE clientes ADD CONSTRAINT clientes_status_check
  CHECK (status IN ('a_iniciar', 'onboarding', 'ongoing', 'aviso_previo', 'churn', 'pausado'));
