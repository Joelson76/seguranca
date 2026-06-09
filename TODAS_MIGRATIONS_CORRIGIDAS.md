# 🔧 Todas as Migrations Corrigidas

Execute NESTA ORDEM no SQL Editor do Supabase.

Todas já estão com `public.get_my_tenant_id()` no lugar de `auth.tenant_id()`

---

## ✅ Execute Este Script Único

**Cole TUDO de uma vez** no SQL Editor:

```sql
-- ============================================================
-- TODAS AS MIGRATIONS DO SAFETRACK - VERSÃO CORRIGIDA
-- Execute TUDO de uma vez no SQL Editor do Supabase
-- ============================================================

-- Já executados (não execute de novo):
-- ✅ 001_enums_e_tenants.sql
-- ✅ 002_usuarios.sql

-- ============================================================
-- 004: EPIs e Estoque
-- ============================================================

CREATE TABLE epis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  ca               TEXT NOT NULL,
  validade_ca      DATE,
  estoque_minimo   INTEGER DEFAULT 10,
  quantidade_atual INTEGER DEFAULT 0,
  ativo            BOOLEAN DEFAULT true,
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ca, tenant_id)
);

CREATE INDEX idx_epis_tenant ON epis(tenant_id);

ALTER TABLE epis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epis_select" ON epis FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "epis_insert" ON epis FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "epis_update" ON epis FOR UPDATE USING (tenant_id = public.get_my_tenant_id());


CREATE TABLE movimentacoes_estoque (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  epi_id        UUID NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  tipo          tipo_movimento NOT NULL,
  quantidade    INTEGER NOT NULL,
  observacao    TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  criado_por    UUID REFERENCES usuarios(id)
);

CREATE INDEX idx_movimentacoes_tenant ON movimentacoes_estoque(tenant_id);
CREATE INDEX idx_movimentacoes_epi ON movimentacoes_estoque(epi_id);

ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimentacoes_select" ON movimentacoes_estoque FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "movimentacoes_insert" ON movimentacoes_estoque FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());


CREATE TABLE entregas_epi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  funcionario_id  UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  epi_id          UUID NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  quantidade      INTEGER DEFAULT 1,
  data_entrega    DATE DEFAULT CURRENT_DATE,
  assinatura_base64 TEXT,
  observacao      TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entregas_tenant ON entregas_epi(tenant_id);
CREATE INDEX idx_entregas_funcionario ON entregas_epi(funcionario_id);

ALTER TABLE entregas_epi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entregas_select" ON entregas_epi FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "entregas_insert" ON entregas_epi FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());


-- ============================================================
-- 005: Treinamentos
-- ============================================================

CREATE TABLE treinamentos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  nr_relacionada TEXT,
  carga_horaria  INTEGER,
  validade_meses INTEGER,
  ativo          BOOLEAN DEFAULT true,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_treinamentos_tenant ON treinamentos(tenant_id);

ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treinamentos_select" ON treinamentos FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "treinamentos_insert" ON treinamentos FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "treinamentos_update" ON treinamentos FOR UPDATE USING (tenant_id = public.get_my_tenant_id());


CREATE TABLE funcionario_treinamentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  funcionario_id    UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  treinamento_id    UUID NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
  data_realizacao   DATE NOT NULL,
  data_vencimento   DATE,
  certificado_url   TEXT,
  status            status_treinamento DEFAULT 'valido',
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_func_trein_tenant ON funcionario_treinamentos(tenant_id);
CREATE INDEX idx_func_trein_funcionario ON funcionario_treinamentos(funcionario_id);

ALTER TABLE funcionario_treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "func_trein_select" ON funcionario_treinamentos FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "func_trein_insert" ON funcionario_treinamentos FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "func_trein_update" ON funcionario_treinamentos FOR UPDATE USING (tenant_id = public.get_my_tenant_id());


-- ============================================================
-- 006: Acidentes e Documentos
-- ============================================================

CREATE TABLE acidentes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  funcionario_id     UUID REFERENCES funcionarios(id),
  tipo               tipo_acidente NOT NULL,
  data_ocorrencia    TIMESTAMPTZ NOT NULL,
  local_acidente     TEXT NOT NULL,
  descricao          TEXT NOT NULL,
  causas             TEXT,
  acoes_corretivas   TEXT,
  status             status_acidente DEFAULT 'aberto',
  criado_em          TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_acidentes_tenant ON acidentes(tenant_id);
CREATE INDEX idx_acidentes_funcionario ON acidentes(funcionario_id);

ALTER TABLE acidentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acidentes_select" ON acidentes FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "acidentes_insert" ON acidentes FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "acidentes_update" ON acidentes FOR UPDATE USING (tenant_id = public.get_my_tenant_id());


CREATE TABLE documentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  arquivo_url  TEXT NOT NULL,
  validade     DATE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documentos_tenant ON documentos(tenant_id);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_select" ON documentos FOR SELECT USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "documentos_delete" ON documentos FOR DELETE USING (tenant_id = public.get_my_tenant_id());


-- ============================================================
-- 007: Assinaturas
-- (Notificações pule - será feito separado)
-- ============================================================

CREATE TABLE assinaturas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assinatura_select" ON assinaturas FOR SELECT USING (tenant_id = public.get_my_tenant_id());


-- ============================================================
-- 010: Índices de Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_epis_nome ON epis(nome);
CREATE INDEX IF NOT EXISTS idx_treinamentos_nome ON treinamentos(nome);


-- ============================================================
-- PRONTO!
-- ============================================================
```

**Cole TUDO acima e execute de uma vez!**

Isso criará todas as tabelas necessárias.

---

## Depois Execute Separadamente:

### **Notificações:**
Arquivo: `20260608_notificacoes.sql` (copie do arquivo original)

### **RPC Estoque Crítico:**
Arquivo: `20260608_rpc_estoque_critico.sql` (copie do arquivo original)

---

**Execute o script acima e me avise quando terminar!** 🚀
