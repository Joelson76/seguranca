-- ================================================
-- FIX DEFINITIVO: Login SafeTrack
-- ================================================
-- PROBLEMA: Incompatibilidade entre migration e código
-- Migration usa: usuarios.id = auth.users.id
-- Código espera: usuarios.user_id = auth.users.id
-- ================================================

-- OPÇÃO A: Criar função compatível com migration atual
-- (Recomendado se a tabela já tem dados)
-- ================================================

CREATE OR REPLACE FUNCTION auth.tenant_id()
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
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO anon, authenticated, service_role;

-- Ajustar RLS da tabela usuarios para ser mais permissivo
DROP POLICY IF EXISTS "usuarios_tenant_isolation" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (id = auth.uid());

-- ================================================
-- Verificar se usuário logado tem registro
-- ================================================

DO $$
DECLARE
  usuario_atual UUID;
  tenant_novo UUID;
BEGIN
  -- Pegar ID do usuário autenticado (se estiver logado via service_role)
  SELECT id INTO usuario_atual FROM auth.users ORDER BY created_at DESC LIMIT 1;

  -- Verificar se tem registro na tabela usuarios
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = usuario_atual) THEN
    RAISE NOTICE 'Usuário % não tem registro na tabela usuarios', usuario_atual;

    -- Criar tenant
    INSERT INTO public.tenants (nome, tipo, ativo)
    VALUES ('Empresa Demo', 'trial', true)
    RETURNING id INTO tenant_novo;

    -- Criar registro
    INSERT INTO public.usuarios (id, tenant_id, nome, perfil)
    SELECT
      au.id,
      tenant_novo,
      COALESCE(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1)),
      'admin'
    FROM auth.users au
    WHERE au.id = usuario_atual;

    RAISE NOTICE 'Registro criado para usuário %', usuario_atual;
  ELSE
    RAISE NOTICE 'Usuário % já tem registro', usuario_atual;
  END IF;
END $$;

-- ================================================
-- Criar trigger para novos usuários
-- ================================================

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

-- ================================================
-- Corrigir todos usuários existentes
-- ================================================

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
-- Verificações finais
-- ================================================

-- 1. Testar função
SELECT auth.tenant_id() AS funcao_ok;

-- 2. Ver usuários
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
