-- ================================================
-- FIX COMPLETO: Login SafeTrack
-- Execute este script no Supabase SQL Editor
-- ================================================

-- 1. Criar função auth.tenant_id() se não existir
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- 2. Garantir que RLS está ativo mas não muito restritivo
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (user_id = auth.uid());

-- 3. Criar trigger de auto-criação (se não existir)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_novo UUID;
BEGIN
  -- Verificar se já existe registro
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Criar tenant automático se for primeiro usuário
  INSERT INTO public.tenants (nome, tipo, ativo)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Empresa Padrão'),
    'trial',
    true
  )
  RETURNING id INTO tenant_id_novo;

  -- Criar registro de usuário
  INSERT INTO public.usuarios (user_id, tenant_id, nome, email, perfil)
  VALUES (
    NEW.id,
    tenant_id_novo,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Corrigir usuários existentes que não têm registro na tabela usuarios
DO $$
DECLARE
  auth_user RECORD;
  tenant_id_novo UUID;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.usuarios u ON u.user_id = au.id
    WHERE u.id IS NULL
  LOOP
    RAISE NOTICE 'Corrigindo usuário: %', auth_user.email;

    -- Criar tenant
    INSERT INTO public.tenants (nome, tipo, ativo)
    VALUES (
      COALESCE(auth_user.raw_user_meta_data->>'empresa', 'Empresa Padrão'),
      'trial',
      true
    )
    RETURNING id INTO tenant_id_novo;

    -- Criar registro de usuário
    INSERT INTO public.usuarios (user_id, tenant_id, nome, email, perfil)
    VALUES (
      auth_user.id,
      tenant_id_novo,
      COALESCE(auth_user.raw_user_meta_data->>'nome', split_part(auth_user.email, '@', 1)),
      auth_user.email,
      'admin'
    );
  END LOOP;
END $$;

-- 5. Verificar resultado
SELECT
  u.nome,
  u.email,
  u.perfil,
  t.nome as tenant,
  u.criado_em
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.criado_em DESC;
