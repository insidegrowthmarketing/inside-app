-- =============================================
-- Inside App - Módulo Financeiro
-- Migração: 004_financeiro
-- Descrição: Adiciona campos de frequência de
--            pagamento em clientes e cria tabela
--            de faturas
-- =============================================

-- 1. Dia da semana para pagamentos semanais (0=domingo, 6=sábado)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS dia_semana_pagamento INTEGER
    CHECK (dia_semana_pagamento BETWEEN 0 AND 6);

-- 2. Dois dias do mês para pagamentos quinzenais
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS dias_pagamento_quinzenal INTEGER[]
    CHECK (
      dias_pagamento_quinzenal IS NULL
      OR (
        array_length(dias_pagamento_quinzenal, 1) = 2
        AND dias_pagamento_quinzenal[1] BETWEEN 1 AND 31
        AND dias_pagamento_quinzenal[2] BETWEEN 1 AND 31
      )
    );

-- 3. Tabela de faturas
CREATE TABLE IF NOT EXISTS faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  moeda TEXT NOT NULL CHECK (moeda IN ('BRL', 'USD')),
  forma_pagamento TEXT,

  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'paga', 'cancelada')),

  data_pagamento_real DATE,
  ultima_cobranca_em DATE,
  observacoes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON faturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento ON faturas(data_vencimento);

-- 5. Trigger updated_at (reutiliza função existente)
CREATE TRIGGER faturas_updated_at
  BEFORE UPDATE ON faturas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- 6. RLS + política permissiva temporária
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_permitir_tudo_temporario_faturas"
  ON faturas
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
