-- ========================================
-- Migration 015: BIOMETRIA COMPLETA - Versão Corrigida
-- ========================================
-- Cria tabelas de biometria com RLS usando public.get_my_tenant_id()
-- ========================================

-- 1. Garantir que função existe
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon, authenticated, service_role;

-- 2. Adicionar colunas de biometria na tabela entregas_epi
ALTER TABLE entregas_epi
ADD COLUMN IF NOT EXISTS biometria_hash TEXT,
ADD COLUMN IF NOT EXISTS biometria_tipo VARCHAR(20) CHECK (biometria_tipo IN ('webauthn', 'hardware', 'assinatura')),
ADD COLUMN IF NOT EXISTS biometria_dispositivo TEXT,
ADD COLUMN IF NOT EXISTS biometria_metadata JSONB;

-- 3. Criar índice
CREATE INDEX IF NOT EXISTS idx_entregas_biometria_tipo ON entregas_epi(biometria_tipo);

-- 4. Criar tabela para credenciais biométricas
CREATE TABLE IF NOT EXISTS funcionarios_credenciais_biometricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('webauthn', 'hardware')),
  dispositivo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  ultimo_uso TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true
);

-- 5. RLS para credenciais biométricas
ALTER TABLE funcionarios_credenciais_biometricas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credenciais_tenant" ON funcionarios_credenciais_biometricas
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "credenciais_insert" ON funcionarios_credenciais_biometricas
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "credenciais_update" ON funcionarios_credenciais_biometricas
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_credenciais_funcionario ON funcionarios_credenciais_biometricas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_credenciais_credential_id ON funcionarios_credenciais_biometricas(credential_id);
CREATE INDEX IF NOT EXISTS idx_credenciais_ativo ON funcionarios_credenciais_biometricas(ativo) WHERE ativo = true;

-- 7. Comentários
COMMENT ON COLUMN entregas_epi.biometria_hash IS 'Hash da biometria capturada (SHA-256)';
COMMENT ON COLUMN entregas_epi.biometria_tipo IS 'Tipo: webauthn (dispositivo), hardware (leitor externo), assinatura (canvas)';
COMMENT ON COLUMN entregas_epi.biometria_dispositivo IS 'Informações do dispositivo/leitor usado';
COMMENT ON COLUMN entregas_epi.biometria_metadata IS 'Metadados adicionais da captura (timestamp, IP, etc)';

COMMENT ON TABLE funcionarios_credenciais_biometricas IS 'Credenciais biométricas registradas dos funcionários';
COMMENT ON COLUMN funcionarios_credenciais_biometricas.credential_id IS 'ID único da credencial WebAuthn ou hardware';
COMMENT ON COLUMN funcionarios_credenciais_biometricas.public_key IS 'Chave pública para validação';
COMMENT ON COLUMN funcionarios_credenciais_biometricas.counter IS 'Contador de uso (previne replay attacks)';
