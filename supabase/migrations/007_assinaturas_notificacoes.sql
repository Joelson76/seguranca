-- ============================================================
-- SafeTrack — Migration 007: Assinaturas e Notificações
-- ============================================================

CREATE TABLE assinaturas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID UNIQUE NOT NULL REFERENCES tenants(id),
  plano             plano NOT NULL,
  valor_mensal      NUMERIC(10,2) NOT NULL,
  data_inicio       DATE NOT NULL,
  data_proximo_pag  DATE NOT NULL,
  status            status_assinatura DEFAULT 'trial',
  gateway           TEXT,
  gateway_sub_id    TEXT,
  criado_em         TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notificacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  usuario_id  UUID REFERENCES auth.users(id),
  titulo      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  tipo        TEXT NOT NULL, -- 'estoque', 'treinamento', 'acidente', 'documento'
  lida        BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assinatura_tenant" ON assinaturas
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "notificacoes_usuario" ON notificacoes
  USING (usuario_id = auth.uid());

-- ============================================================
-- Buckets de Storage (executar também no dashboard ou via CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('documentos', 'documentos', false),
--   ('assinaturas', 'assinaturas', false),
--   ('fotos-funcionario', 'fotos-funcionario', false),
--   ('certificados', 'certificados', false),
--   ('logos', 'logos', true);
