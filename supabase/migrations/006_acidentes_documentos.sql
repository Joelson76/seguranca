-- ============================================================
-- SafeTrack — Migration 006: Acidentes e Documentos
-- ============================================================

CREATE TABLE acidentes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  funcionario_id     UUID NOT NULL REFERENCES funcionarios(id),
  tipo               tipo_acidente NOT NULL,
  data_ocorrencia    DATE NOT NULL,
  hora_ocorrencia    TIME NOT NULL,
  local_ocorrencia   TEXT NOT NULL,
  descricao          TEXT NOT NULL,
  causa_imediata     TEXT,
  causa_basica       TEXT,
  medidas_corretivas TEXT,
  dias_afastamento   INTEGER,
  cat                BOOLEAN DEFAULT false,
  numero_cat         TEXT,
  status             status_acidente DEFAULT 'aberto',
  criado_por         UUID REFERENCES auth.users(id),
  criado_em          TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  descricao   TEXT,
  arquivo_url TEXT NOT NULL,
  validade    DATE,
  acidente_id UUID REFERENCES acidentes(id),
  criado_por  UUID REFERENCES auth.users(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE acidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acidentes_tenant" ON acidentes USING (tenant_id = auth.tenant_id());
CREATE POLICY "acidentes_insert" ON acidentes FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "acidentes_update" ON acidentes FOR UPDATE USING (tenant_id = auth.tenant_id());

CREATE POLICY "documentos_tenant" ON documentos USING (tenant_id = auth.tenant_id());
CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "documentos_delete" ON documentos FOR DELETE USING (tenant_id = auth.tenant_id());
