-- ============================================
-- FASE 2: EPIs, Estoque e Entregas
-- ============================================
-- Execute este SQL no Supabase SQL Editor

-- Tabela de EPIs
CREATE TABLE IF NOT EXISTS epis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  nome            TEXT NOT NULL,
  descricao       TEXT,
  ca              TEXT NOT NULL,
  ca_validade     DATE NOT NULL,
  categoria       TEXT NOT NULL,
  unidade_medida  TEXT DEFAULT 'unidade',
  estoque_atual   INTEGER DEFAULT 0,
  estoque_minimo  INTEGER DEFAULT 10,
  vida_util_dias  INTEGER,
  fornecedor      TEXT,
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Movimentos de Estoque
CREATE TABLE IF NOT EXISTS estoque_movimentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  epi_id      UUID NOT NULL REFERENCES epis(id),
  tipo        tipo_movimento NOT NULL,
  quantidade  INTEGER NOT NULL,
  motivo      TEXT,
  documento   TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  criado_por  UUID REFERENCES auth.users(id)
);

-- Tabela de Entregas de EPI
CREATE TABLE IF NOT EXISTS entregas_epi (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  funcionario_id   UUID NOT NULL REFERENCES funcionarios(id),
  epi_id           UUID NOT NULL REFERENCES epis(id),
  quantidade       INTEGER NOT NULL,
  data_entrega     TIMESTAMPTZ DEFAULT NOW(),
  data_vencimento  DATE,
  motivo_devolucao TEXT,
  devolvido        BOOLEAN DEFAULT false,
  data_devolucao   TIMESTAMPTZ,
  assinado_por     TEXT,
  observacoes      TEXT,
  criado_por       UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "epis_tenant" ON epis
  USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "estoque_tenant" ON estoque_movimentos
  USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "entregas_tenant" ON entregas_epi
  USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_epis_tenant ON epis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_epis_ativo ON epis(ativo);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_epi ON estoque_movimentos(epi_id);
CREATE INDEX IF NOT EXISTS idx_entregas_funcionario ON entregas_epi(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_entregas_epi ON entregas_epi(epi_id);
CREATE INDEX IF NOT EXISTS idx_entregas_devolvido ON entregas_epi(devolvido);

-- Function para alertas de estoque baixo
CREATE OR REPLACE FUNCTION epis_estoque_critico()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  estoque_atual INTEGER,
  estoque_minimo INTEGER,
  tenant_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nome, e.estoque_atual, e.estoque_minimo, e.tenant_id
  FROM epis e
  WHERE e.estoque_atual <= e.estoque_minimo
  AND e.ativo = true;
END;
$$ LANGUAGE plpgsql;
