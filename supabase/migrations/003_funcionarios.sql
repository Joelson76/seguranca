-- ============================================================
-- SafeTrack — Migration 003: Funcionários
-- ============================================================

CREATE TABLE funcionarios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  matricula      TEXT NOT NULL,
  nome           TEXT NOT NULL,
  cpf            TEXT NOT NULL,
  cargo          TEXT NOT NULL,
  setor          TEXT NOT NULL,
  data_admissao  DATE NOT NULL,
  ativo          BOOLEAN DEFAULT true,
  foto_url       TEXT,
  assinatura_url TEXT,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(matricula, tenant_id),
  UNIQUE(cpf, tenant_id)
);

ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funcionarios_tenant" ON funcionarios
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "funcionarios_insert" ON funcionarios
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "funcionarios_update" ON funcionarios
  FOR UPDATE USING (tenant_id = auth.tenant_id());
