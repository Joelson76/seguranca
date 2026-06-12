-- ========================================
-- Migration 015: Corrigir RLS da tabela de biometria
-- ========================================
-- Substitui auth.tenant_id() por public.get_my_tenant_id()
-- ========================================

-- Garantir que a função helper existe
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

-- Recriar políticas RLS da tabela funcionarios_credenciais_biometricas
DROP POLICY IF EXISTS "credenciais_tenant" ON funcionarios_credenciais_biometricas;
DROP POLICY IF EXISTS "credenciais_insert" ON funcionarios_credenciais_biometricas;
DROP POLICY IF EXISTS "credenciais_update" ON funcionarios_credenciais_biometricas;

CREATE POLICY "credenciais_tenant" ON funcionarios_credenciais_biometricas
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "credenciais_insert" ON funcionarios_credenciais_biometricas
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "credenciais_update" ON funcionarios_credenciais_biometricas
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- Verificar se tabela existe e está acessível
SELECT
  COUNT(*) as total_credenciais,
  COUNT(DISTINCT tenant_id) as total_tenants
FROM funcionarios_credenciais_biometricas;

SELECT '✅ RLS de biometria corrigido!' as status;
