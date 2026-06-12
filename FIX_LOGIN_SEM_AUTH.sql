-- ================================================
-- FIX LOGIN - Versão sem permissão de schema auth
-- ================================================
-- Cria função no schema public em vez de auth
-- ================================================

-- PASSO 1: Criar função helper no schema PUBLIC
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon, authenticated, service_role;

-- PASSO 2: Ajustar RLS para usar a nova função
DROP POLICY IF EXISTS "usuarios_tenant_isolation" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;

-- Políticas mais permissivas
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (id = auth.uid());

-- PASSO 3: Ajustar RLS de outras tabelas para usar public.get_my_tenant_id()
-- (apenas se necessário - por enquanto vamos focar em fazer o login funcionar)

-- PASSO 4: Criar trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_novo UUID;
BEGIN
  -- Verificar se já existe
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Criar tenant
  INSERT INTO public.tenants (nome, tipo, ativo)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Empresa Padrão'),
    'trial',
    true
  )
  RETURNING id INTO tenant_id_novo;

  -- Criar usuário
  INSERT INTO public.usuarios (id, tenant_id, nome, perfil)
  VALUES (
    NEW.id,
    tenant_id_novo,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 5: Corrigir usuários existentes sem registro
DO $$
DECLARE
  auth_user RECORD;
  tenant_id_novo UUID;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.usuarios u ON u.id = au.id
    WHERE u.id IS NULL
  LOOP
    RAISE NOTICE 'Corrigindo usuário: %', auth_user.email;

    -- Criar tenant
    INSERT INTO public.tenants (nome, tipo, ativo)
    VALUES (
      COALESCE(auth_user.raw_user_meta_data->>'empresa', 'Empresa ' || split_part(auth_user.email, '@', 1)),
      'trial',
      true
    )
    RETURNING id INTO tenant_id_novo;

    -- Criar registro
    INSERT INTO public.usuarios (id, tenant_id, nome, perfil)
    VALUES (
      auth_user.id,
      tenant_id_novo,
      COALESCE(auth_user.raw_user_meta_data->>'nome', split_part(auth_user.email, '@', 1)),
      'admin'
    );
  END LOOP;
END $$;

-- ================================================
-- VERIFICAÇÕES FINAIS
-- ================================================

-- 1. Testar função
SELECT public.get_my_tenant_id() AS meu_tenant_id;

-- 2. Ver usuários e tenants
SELECT
  u.id,
  u.nome,
  u.perfil,
  t.nome as tenant,
  u.criado_em
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.criado_em DESC;

-- 3. Ver usuários sem registro
SELECT
  au.email,
  au.created_at,
  CASE WHEN u.id IS NULL THEN '❌ SEM REGISTRO' ELSE '✅ OK' END as status
FROM auth.users au
LEFT JOIN usuarios u ON u.id = au.id
ORDER BY au.created_at DESC;

-- ================================================
-- IMPORTANTE: Agora você precisa atualizar as outras
-- tabelas que usam auth.tenant_id() para usar
-- public.get_my_tenant_id()
-- ================================================

-- Exemplo para funcionarios (execute depois se necessário):
-- DROP POLICY IF EXISTS "funcionarios_tenant" ON funcionarios;
-- CREATE POLICY "funcionarios_tenant" ON funcionarios
--   USING (tenant_id = public.get_my_tenant_id());
