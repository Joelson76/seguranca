-- ============================================================
-- SAFETRACK - SETUP COMPLETO DEFINITIVO
-- Cole TUDO no SQL Editor do Supabase e execute
-- ============================================================

-- ============================================================
-- 1. ENUMS (Tipos)
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
-- 2. TABELA: tenants (Empresas)
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

-- ============================================================
-- 3. TABELA: usuarios
-- ============================================================

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
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ============================================================
-- 4. TABELA: funcionarios
-- ============================================================

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
CREATE INDEX idx_funcionarios_nome ON funcionarios(nome);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);

-- ============================================================
-- 5. TABELA: epis
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
CREATE INDEX idx_epis_nome ON epis(nome);

-- ============================================================
-- 6. TABELA: movimentacoes_estoque
-- ============================================================

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

CREATE INDEX idx_movimentacoes_tenant ON movimentacoes_estoque(tenant_id);
CREATE INDEX idx_movimentacoes_epi ON movimentacoes_estoque(epi_id);

-- ============================================================
-- 7. TABELA: entregas_epi
-- ============================================================

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

-- ============================================================
-- 8. TABELA: treinamentos
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
CREATE INDEX idx_treinamentos_nome ON treinamentos(nome);

-- ============================================================
-- 9. TABELA: funcionario_treinamentos
-- ============================================================

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

-- ============================================================
-- 10. TABELA: acidentes
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

-- ============================================================
-- 11. TABELA: documentos
-- ============================================================

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

-- ============================================================
-- 12. TABELA: assinaturas
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

-- ============================================================
-- 13. TABELA: notificacoes
-- ============================================================

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

CREATE INDEX idx_notificacoes_tenant ON notificacoes(tenant_id);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- ============================================================
-- 14. HABILITAR ROW LEVEL SECURITY (RLS)
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
-- 15. POLÍTICAS RLS SIMPLES (Permitir tudo para usuários autenticados)
-- ============================================================

-- Função helper para pegar tenant_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Usuários
CREATE POLICY "usuarios_all" ON usuarios FOR ALL USING (user_id = auth.uid());

-- Funcionários
CREATE POLICY "funcionarios_all" ON funcionarios FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- EPIs
CREATE POLICY "epis_all" ON epis FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Movimentações
CREATE POLICY "movimentacoes_all" ON movimentacoes_estoque FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Entregas
CREATE POLICY "entregas_all" ON entregas_epi FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Treinamentos
CREATE POLICY "treinamentos_all" ON treinamentos FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Funcionário Treinamentos
CREATE POLICY "func_trein_all" ON funcionario_treinamentos FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Acidentes
CREATE POLICY "acidentes_all" ON acidentes FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Documentos
CREATE POLICY "documentos_all" ON documentos FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Assinaturas
CREATE POLICY "assinaturas_all" ON assinaturas FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Notificações
CREATE POLICY "notificacoes_all" ON notificacoes FOR ALL USING (usuario_id = auth.uid());

-- ============================================================
-- 16. FUNÇÕES ÚTEIS
-- ============================================================

-- Marcar todas notificações como lidas
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

-- EPIs com estoque crítico
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
-- ============================================================
-- Execute este SQL e o banco estará completamente configurado!
