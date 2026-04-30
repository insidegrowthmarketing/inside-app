-- =============================================
-- Inside App - Módulo de Cobranças WhatsApp
-- Migração: 009_cobrancas_whatsapp
-- Descrição: Cria tabela de histórico de
--            cobranças enviadas via WhatsApp
-- =============================================

CREATE TABLE IF NOT EXISTS cobrancas_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  template_usado TEXT NOT NULL CHECK (template_usado IN ('lembrete_1dia', 'cobranca_dia', 'manual')),
  numero_destino TEXT NOT NULL,
  mensagem_enviada TEXT NOT NULL,
  enviado_por TEXT NOT NULL,
  sucesso BOOLEAN NOT NULL DEFAULT false,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_whatsapp_fatura ON cobrancas_whatsapp(fatura_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_whatsapp_cliente ON cobrancas_whatsapp(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_whatsapp_data ON cobrancas_whatsapp(created_at);

ALTER TABLE cobrancas_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_permitir_tudo_temporario_cobrancas_wa"
  ON cobrancas_whatsapp
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
