-- ============================================================
-- SafeTrack — Migration 002: Usuários
-- ============================================================

CREATE TABLE usuarios (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  nome          TEXT NOT NULL,
  perfil        perfil_usuario DEFAULT 'operador',
  ativo         BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id, tenant_id)
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas usuários do próprio tenant
CREATE POLICY "usuarios_tenant_isolation" ON usuarios
  USING (tenant_id = (
    SELECT tenant_id FROM usuarios WHERE id = auth.uid()
  ));

-- Função helper para obter tenant_id do usuário logado
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
