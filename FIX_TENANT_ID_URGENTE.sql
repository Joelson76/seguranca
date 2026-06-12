-- ================================================
-- FIX URGENTE: Criar função auth.tenant_id()
-- ================================================
-- PROBLEMA: function auth.tenant_id() does not exist
-- SOLUÇÃO: Criar a função e corrigir RLS
-- ================================================

-- PASSO 1: Criar a função auth.tenant_id()
CREATE OR REPLACE FUNCTION auth.tenant_id()
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

-- PASSO 2: Garantir permissões
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO anon, authenticated, service_role;

-- PASSO 3: Testar a função
SELECT auth.tenant_id() AS meu_tenant_id;

-- PASSO 4: Verificar tabela usuarios
SELECT COUNT(*) as total_usuarios FROM public.usuarios;

-- PASSO 5: Verificar auth.users
SELECT
  id,
  email,
  created_at,
  (SELECT COUNT(*) FROM public.usuarios WHERE user_id = auth.users.id) as tem_perfil
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
