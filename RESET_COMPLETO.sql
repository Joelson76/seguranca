-- ============================================================
-- SAFETRACK - RESET COMPLETO E DEFINITIVO
-- Este script APAGA TUDO e recria do zero
-- Cole TUDO no SQL Editor do Supabase e execute UMA VEZ
-- ============================================================

-- ============================================================
-- 1. LIMPAR TUDO (Drop em cascata)
-- ============================================================

DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS assinaturas CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS acidentes CASCADE;
DROP TABLE IF EXISTS funcionario_treinamentos CASCADE;
DROP TABLE IF EXISTS treinamentos CASCADE;
DROP TABLE IF EXISTS entregas_epi CASCADE;
DROP TABLE IF EXISTS movimentacoes_estoque CASCADE;
DROP TABLE IF EXISTS epis CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

DROP TYPE IF EXISTS plano CASCADE;
DROP TYPE IF EXISTS perfil_usuario CASCADE;
DROP TYPE IF EXISTS tipo_movimento CASCADE;
DROP TYPE IF EXISTS status_treinamento CASCADE;
DROP TYPE IF EXISTS tipo_acidente CASCADE;
DROP TYPE IF EXISTS status_acidente CASCADE;
DROP TYPE IF EXISTS status_assinatura CASCADE;

DROP FUNCTION IF EXISTS get_my_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS marcar_todas_notificacoes_lidas() CASCADE;
DROP FUNCTION IF EXISTS epis_estoque_critico() CASCADE;

-- ============================================================
-- 2. CRIAR ENUMS
-- ============================================================

CREATE TYPE plano AS ENUM ('basico', 'profissional', 'enterprise');
CREATE TYPE perfil_usuario AS ENUM ('super_admin', 'admin', 'tecnico_sst', 'operador', 'visualizador');
CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste', 'devolucao', 'descarte');
CREATE TYPE status_treinamento AS ENUM ('valido', 'vencendo', 'vencido', 'pendente');
CREATE TYPE tipo_acidente AS ENUM (
  'acidente_com_afastamento', 'acidente_sem_afastamento',
  'acidente_de_trajeto', 'quase_acidente', 'incidente', 'doenca_ocupacional'
);
CREATE TYPE status_acidente AS ENUM ('aberto', 'em_investigacao', 'concluido', 'arquivado');
CREATE TYPE status_assinatura AS ENUM ('trial', 'ativa', 'inadimplente', 'cancelada', 'suspensa');

-- ============================================================
-- 3. CRIAR TABELAS (SEM RLS)
-- ============================================================

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  cnpj          TEXT UNIQUE NOT NULL,
  plano         plano DEFAULT 'basico',
  ativo         BOOLEAN DEFAULT true,
  logo_url      TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  perfil        perfil_usuario DEFAULT 'operador',
  ativo         BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_usuarios_user_id ON usuarios(user_id);
CREATE INDEX idx_usuarios_tenant_id ON usuarios(tenant_id);

CREATE TABLE funcionarios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

CREATE INDEX idx_funcionarios_tenant ON funcionarios(tenant_id);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);

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

CREATE TABLE movimentacoes_estoque (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  epi_id        UUID NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  tipo          tipo_movimento NOT NULL,
  quantidade    INTEGER NOT NULL,
  observacao    TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  criado_por    UUID
);

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

CREATE TABLE documentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  arquivo_url  TEXT NOT NULL,
  validade     DATE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE notificacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id  UUID,
  titulo      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('info', 'alerta', 'critico', 'sucesso')),
  lida        BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. DESABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE epis DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi DISABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE acidentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. CRIAR FUNÇÕES ÚTEIS
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM usuarios WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ✅ PRONTO!
-- ============================================================
-- Agora recarregue o app e faça login/onboarding
-- O sistema vai criar o tenant e usuário automaticamente
