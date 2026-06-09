-- ============================================================
-- SAFETRACK - COMPLETAR SETUP
-- Este script cria APENAS o que ainda NÃO existe
-- ============================================================

-- ============================================================
-- 1. Criar tipos que ainda não existem
-- ============================================================

DO $$ BEGIN
  CREATE TYPE plano AS ENUM ('basico', 'profissional', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE perfil_usuario AS ENUM ('super_admin', 'admin', 'tecnico_sst', 'operador', 'visualizador');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste', 'devolucao', 'descarte');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_treinamento AS ENUM ('valido', 'vencendo', 'vencido', 'pendente');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_acidente AS ENUM (
    'acidente_com_afastamento', 'acidente_sem_afastamento',
    'acidente_de_trajeto', 'quase_acidente', 'incidente', 'doenca_ocupacional'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_acidente AS ENUM ('aberto', 'em_investigacao', 'concluido', 'arquivado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_assinatura AS ENUM ('trial', 'ativa', 'inadimplente', 'cancelada', 'suspensa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. Tabela tenants (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  cnpj          TEXT UNIQUE NOT NULL,
  plano         plano DEFAULT 'basico',
  ativo         BOOLEAN DEFAULT true,
  logo_url      TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Tabela usuarios (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
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

-- ============================================================
-- 4. Tabela funcionarios (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS funcionarios (
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

-- ============================================================
-- 5. Tabela epis (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS epis (
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

-- ============================================================
-- 6. Tabela movimentacoes_estoque (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  epi_id        UUID NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  tipo          tipo_movimento NOT NULL,
  quantidade    INTEGER NOT NULL,
  observacao    TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  criado_por    UUID
);

-- ============================================================
-- 7. Tabela entregas_epi (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS entregas_epi (
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

-- ============================================================
-- 8. Tabela treinamentos (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS treinamentos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  nr_relacionada TEXT,
  carga_horaria  INTEGER,
  validade_meses INTEGER,
  ativo          BOOLEAN DEFAULT true,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. Tabela funcionario_treinamentos (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS funcionario_treinamentos (
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

-- ============================================================
-- 10. Tabela acidentes (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS acidentes (
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

-- ============================================================
-- 11. Tabela documentos (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS documentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  arquivo_url  TEXT NOT NULL,
  validade     DATE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. Tabela assinaturas (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS assinaturas (
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

-- ============================================================
-- 13. Tabela notificacoes (se não existir)
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacoes (
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
-- 14. Índices (IF NOT EXISTS)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant ON funcionarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome);
CREATE INDEX IF NOT EXISTS idx_funcionarios_ativo ON funcionarios(ativo);
CREATE INDEX IF NOT EXISTS idx_epis_tenant ON epis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_epis_nome ON epis(nome);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tenant ON movimentacoes_estoque(tenant_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_epi ON movimentacoes_estoque(epi_id);
CREATE INDEX IF NOT EXISTS idx_entregas_tenant ON entregas_epi(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entregas_funcionario ON entregas_epi(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_tenant ON treinamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_nome ON treinamentos(nome);
CREATE INDEX IF NOT EXISTS idx_func_trein_tenant ON funcionario_treinamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_func_trein_funcionario ON funcionario_treinamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_acidentes_tenant ON acidentes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acidentes_funcionario ON acidentes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tenant ON documentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tenant ON notificacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- ============================================================
-- 15. Habilitar RLS
-- ============================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE acidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 16. Função helper
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 17. Políticas RLS (DROP e recriar)
-- ============================================================

DROP POLICY IF EXISTS usuarios_all ON usuarios;
CREATE POLICY usuarios_all ON usuarios FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS funcionarios_all ON funcionarios;
CREATE POLICY funcionarios_all ON funcionarios FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS epis_all ON epis;
CREATE POLICY epis_all ON epis FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS movimentacoes_all ON movimentacoes_estoque;
CREATE POLICY movimentacoes_all ON movimentacoes_estoque FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS entregas_all ON entregas_epi;
CREATE POLICY entregas_all ON entregas_epi FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS treinamentos_all ON treinamentos;
CREATE POLICY treinamentos_all ON treinamentos FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS func_trein_all ON funcionario_treinamentos;
CREATE POLICY func_trein_all ON funcionario_treinamentos FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS acidentes_all ON acidentes;
CREATE POLICY acidentes_all ON acidentes FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS documentos_all ON documentos;
CREATE POLICY documentos_all ON documentos FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS assinaturas_all ON assinaturas;
CREATE POLICY assinaturas_all ON assinaturas FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS notificacoes_all ON notificacoes;
CREATE POLICY notificacoes_all ON notificacoes FOR ALL USING (usuario_id = auth.uid());

-- ============================================================
-- 18. Funções úteis
-- ============================================================

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

CREATE OR REPLACE FUNCTION epis_estoque_critico()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  nome TEXT,
  ca TEXT,
  quantidade_atual INTEGER,
  estoque_minimo INTEGER,
  diferenca INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.tenant_id,
    e.nome,
    e.ca,
    e.quantidade_atual,
    e.estoque_minimo,
    (e.estoque_minimo - e.quantidade_atual) as diferenca
  FROM epis e
  WHERE e.quantidade_atual <= e.estoque_minimo
    AND e.tenant_id = public.get_my_tenant_id()
  ORDER BY (e.estoque_minimo - e.quantidade_atual) DESC;
END;
$$;

-- ============================================================
-- PRONTO! ✅
-- Tudo criado ou atualizado!
-- ============================================================
