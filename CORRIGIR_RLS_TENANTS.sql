-- ============================================================
-- CORRIGIR RLS DA TABELA TENANTS
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

-- Remover política existente (se houver)
DROP POLICY IF EXISTS tenants_select ON tenants;
DROP POLICY IF EXISTS tenants_insert ON tenants;
DROP POLICY IF EXISTS tenants_update ON tenants;

-- Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer usuário autenticado pode LER tenants (para select)
CREATE POLICY tenants_select ON tenants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Qualquer usuário autenticado pode CRIAR tenant (para registro)
CREATE POLICY tenants_insert ON tenants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Apenas usuários do tenant podem ATUALIZAR
CREATE POLICY tenants_update ON tenants
  FOR UPDATE
  USING (id = public.get_my_tenant_id());

-- ============================================================
-- PRONTO! Agora usuários podem criar tenants ao se registrar
-- ============================================================
