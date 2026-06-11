-- =====================================================
-- Migration 011: LGPD Compliance
-- Adiciona funcionalidades para compliance com LGPD
-- =====================================================

-- 1. Tabela de Log de Auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome TEXT,
  acao TEXT NOT NULL,
  entidade TEXT,
  entidade_id UUID,
  detalhes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_criado ON audit_log(criado_em DESC);
CREATE INDEX idx_audit_log_acao ON audit_log(acao);

-- RLS para audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver logs do seu tenant"
  ON audit_log FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Super admins podem ver todos os logs
CREATE POLICY "Super admins podem ver todos os logs"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE auth_user_id = auth.uid() 
      AND perfil = 'super_admin'
    )
  );

-- 2. Adicionar campos de consentimento LGPD na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS consentimento_data TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS consentimento_ip TEXT;

-- 3. Adicionar campo de anonimização
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS anonimizado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS anonimizado_em TIMESTAMPTZ;

-- 4. Função para registrar audit log
CREATE OR REPLACE FUNCTION registrar_audit_log(
  p_acao TEXT,
  p_entidade TEXT DEFAULT NULL,
  p_entidade_id UUID DEFAULT NULL,
  p_detalhes JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_usuario_nome TEXT;
  v_log_id UUID;
BEGIN
  -- Buscar tenant_id e nome do usuário
  SELECT tenant_id, nome INTO v_tenant_id, v_usuario_nome
  FROM usuarios
  WHERE auth_user_id = auth.uid();

  -- Inserir log
  INSERT INTO audit_log (
    tenant_id,
    user_id,
    usuario_nome,
    acao,
    entidade,
    entidade_id,
    detalhes
  ) VALUES (
    v_tenant_id,
    auth.uid(),
    v_usuario_nome,
    p_acao,
    p_entidade,
    p_entidade_id,
    p_detalhes
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para exportar dados do usuário (LGPD)
CREATE OR REPLACE FUNCTION exportar_dados_usuario()
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_dados JSONB;
BEGIN
  -- Buscar tenant_id do usuário
  SELECT tenant_id INTO v_tenant_id
  FROM usuarios
  WHERE auth_user_id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Montar JSON com todos os dados
  SELECT jsonb_build_object(
    'usuario', (
      SELECT jsonb_build_object(
        'nome', nome,
        'email', email,
        'cpf', cpf,
        'telefone', telefone,
        'perfil', perfil,
        'criado_em', criado_em
      ) FROM usuarios WHERE auth_user_id = auth.uid()
    ),
    'tenant', (
      SELECT jsonb_build_object(
        'nome', nome,
        'cnpj', cnpj,
        'telefone', telefone,
        'endereco', endereco
      ) FROM tenants WHERE id = v_tenant_id
    ),
    'funcionarios', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'nome', nome,
          'cpf', cpf,
          'cargo', cargo,
          'setor', setor,
          'data_admissao', data_admissao
        )
      ), '[]'::jsonb)
      FROM funcionarios WHERE tenant_id = v_tenant_id
    ),
    'epis', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'nome', nome,
          'ca', ca,
          'tipo', tipo
        )
      ), '[]'::jsonb)
      FROM epis WHERE tenant_id = v_tenant_id
    ),
    'entregas', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'data_entrega', data_entrega,
          'quantidade', quantidade,
          'funcionario', (SELECT nome FROM funcionarios WHERE id = e.funcionario_id),
          'epi', (SELECT nome FROM epis WHERE id = e.epi_id)
        )
      ), '[]'::jsonb)
      FROM entregas_epi e WHERE tenant_id = v_tenant_id
    ),
    'exportado_em', NOW()
  ) INTO v_dados;

  -- Registrar no audit log
  PERFORM registrar_audit_log(
    'EXPORTACAO_DADOS',
    'usuario',
    auth.uid(),
    jsonb_build_object('timestamp', NOW())
  );

  RETURN v_dados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para anonimizar conta (direito ao esquecimento)
CREATE OR REPLACE FUNCTION anonimizar_conta()
RETURNS BOOLEAN AS $$
DECLARE
  v_tenant_id UUID;
  v_usuario_id UUID;
BEGIN
  -- Buscar dados do usuário
  SELECT id, tenant_id INTO v_usuario_id, v_tenant_id
  FROM usuarios
  WHERE auth_user_id = auth.uid();

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Registrar no audit log ANTES de anonimizar
  PERFORM registrar_audit_log(
    'ANONIMIZACAO_CONTA',
    'usuario',
    v_usuario_id,
    jsonb_build_object('timestamp', NOW())
  );

  -- Anonimizar dados pessoais do usuário
  UPDATE usuarios SET
    nome = 'Usuário Removido',
    email = 'anonimizado_' || id || '@removed.local',
    cpf = NULL,
    telefone = NULL,
    foto_url = NULL,
    assinatura_url = NULL,
    anonimizado = TRUE,
    anonimizado_em = NOW()
  WHERE id = v_usuario_id;

  -- Anonimizar dados de funcionários (manter registros para compliance)
  UPDATE funcionarios SET
    nome = 'Funcionário Anonimizado ' || id,
    cpf = 'ANONIMIZADO',
    email = NULL,
    telefone = NULL,
    foto_url = NULL,
    assinatura_url = NULL
  WHERE tenant_id = v_tenant_id;

  -- NÃO deletar registros de entregas, acidentes, treinamentos
  -- (necessário para compliance trabalhista)
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentários
COMMENT ON TABLE audit_log IS 'Log de auditoria para compliance LGPD';
COMMENT ON FUNCTION exportar_dados_usuario() IS 'Exporta todos os dados do usuário (LGPD Art. 18)';
COMMENT ON FUNCTION anonimizar_conta() IS 'Anonimiza dados pessoais (direito ao esquecimento - LGPD Art. 18)';
