-- ============================================================
-- SafeTrack — Migration 002: Usuários (VERSÃO CORRIGIDA)
-- ============================================================

CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  perfil        perfil_usuario DEFAULT 'operador',
  ativo         BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Índices para performance
CREATE INDEX idx_usuarios_user_id ON usuarios(user_id);
CREATE INDEX idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê apenas usuários do próprio tenant
CREATE POLICY "usuarios_tenant_isolation" ON usuarios
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM usuarios WHERE user_id = auth.uid()
    )
  );

-- Política: Permitir inserção (para registro de novos usuários)
CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Atualizar apenas do próprio tenant
CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM usuarios WHERE user_id = auth.uid()
    )
  );

-- Função helper para obter tenant_id do usuário logado (no schema public)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;
