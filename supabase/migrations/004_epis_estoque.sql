-- ============================================================
-- SafeTrack — Migration 004: EPIs e Estoque
-- ============================================================

CREATE TABLE epis (
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

CREATE TABLE estoque_movimentos (
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

CREATE TABLE entregas_epi (
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
  assinatura_url   TEXT,
  observacoes      TEXT,
  criado_por       UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epis_tenant" ON epis USING (tenant_id = auth.tenant_id());
CREATE POLICY "epis_insert" ON epis FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "epis_update" ON epis FOR UPDATE USING (tenant_id = auth.tenant_id());

CREATE POLICY "estoque_tenant" ON estoque_movimentos USING (tenant_id = auth.tenant_id());
CREATE POLICY "estoque_insert" ON estoque_movimentos FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "entregas_tenant" ON entregas_epi USING (tenant_id = auth.tenant_id());
CREATE POLICY "entregas_insert" ON entregas_epi FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "entregas_update" ON entregas_epi FOR UPDATE USING (tenant_id = auth.tenant_id());
