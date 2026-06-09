-- Migration: Sistema de Notificações
-- Fase 5: Edge Functions + Notificações Realtime
-- Data: 2026-06-08

-- Tabela de notificações
CREATE TABLE notificacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('info', 'alerta', 'critico', 'sucesso')),
  lida        BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_notificacoes_tenant ON notificacoes(tenant_id);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_criado_em ON notificacoes(criado_em DESC);

-- RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê apenas suas notificações
CREATE POLICY "notificacoes_usuario" ON notificacoes
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Política: usuário pode marcar suas notificações como lidas
CREATE POLICY "notificacoes_update" ON notificacoes
  FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Política: sistema pode criar notificações (via service_role)
CREATE POLICY "notificacoes_insert_service" ON notificacoes
  FOR INSERT
  WITH CHECK (true);

-- View para estatísticas de notificações por tenant
CREATE OR REPLACE VIEW notificacoes_stats AS
SELECT
  tenant_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE lida = false) as nao_lidas,
  COUNT(*) FILTER (WHERE tipo = 'critico') as criticas,
  COUNT(*) FILTER (WHERE tipo = 'alerta') as alertas
FROM notificacoes
GROUP BY tenant_id;

-- Função RPC para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION marcar_todas_notificacoes_lidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notificacoes
  SET lida = true
  WHERE usuario_id = auth.uid() AND lida = false;
END;
$$;

-- Comentários
COMMENT ON TABLE notificacoes IS 'Notificações in-app para usuários do sistema';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipos: info, alerta, critico, sucesso';
COMMENT ON FUNCTION marcar_todas_notificacoes_lidas() IS 'Marca todas as notificações do usuário atual como lidas';
