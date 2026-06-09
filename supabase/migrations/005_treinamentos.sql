-- ============================================================
-- SafeTrack — Migration 005: Treinamentos
-- ============================================================

CREATE TABLE treinamentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  nome                  TEXT NOT NULL,
  descricao             TEXT,
  carga_horaria         INTEGER NOT NULL,
  validade_meses        INTEGER NOT NULL,
  norma_regulamentadora TEXT,
  ativo                 BOOLEAN DEFAULT true,
  criado_em             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE funcionario_treinamentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id   UUID NOT NULL REFERENCES funcionarios(id),
  treinamento_id   UUID NOT NULL REFERENCES treinamentos(id),
  data_realizacao  DATE NOT NULL,
  data_vencimento  DATE NOT NULL,
  instrutor        TEXT,
  local_realizacao TEXT,
  status           status_treinamento DEFAULT 'valido',
  certificado_url  TEXT,
  criado_em        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treinamentos_tenant" ON treinamentos
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "treinamentos_insert" ON treinamentos
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "func_treinamentos_tenant" ON funcionario_treinamentos
  USING (funcionario_id IN (
    SELECT id FROM funcionarios WHERE tenant_id = auth.tenant_id()
  ));
CREATE POLICY "func_treinamentos_insert" ON funcionario_treinamentos
  FOR INSERT WITH CHECK (
    funcionario_id IN (SELECT id FROM funcionarios WHERE tenant_id = auth.tenant_id())
  );
