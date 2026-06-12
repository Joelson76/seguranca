-- ================================================
-- FIX LOGIN SIMPLES - Apenas o essencial
-- ================================================
-- Ignora tabelas que não existem
-- ================================================

-- 1. Criar função helper
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

-- 2. Ajustar RLS da tabela usuarios
DROP POLICY IF EXISTS "usuarios_tenant_isolation" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (user_id = auth.uid());

-- 3. Criar trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_novo UUID;
  cnpj_temp TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  cnpj_temp := '00000000' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  INSERT INTO public.tenants (nome, cnpj, plano, ativo)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Empresa ' || split_part(NEW.email, '@', 1)),
    cnpj_temp,
    'basico',
    true
  )
  RETURNING id INTO tenant_id_novo;

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Corrigir usuários existentes
DO $$
DECLARE
  auth_user RECORD;
  tenant_id_novo UUID;
  cnpj_temp TEXT;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.usuarios u ON u.user_id = au.id
    WHERE u.id IS NULL
  LOOP
    RAISE NOTICE 'Corrigindo usuário: %', auth_user.email;

    cnpj_temp := '00000000' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    INSERT INTO public.tenants (nome, cnpj, plano, ativo)
    VALUES (
      COALESCE(auth_user.raw_user_meta_data->>'empresa', 'Empresa ' || split_part(auth_user.email, '@', 1)),
      cnpj_temp,
      'basico',
      true
    )
    RETURNING id INTO tenant_id_novo;

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

-- 5. Atualizar RLS apenas das tabelas que existem
DO $$
BEGIN
  -- FUNCIONARIOS
  BEGIN
    DROP POLICY IF EXISTS "funcionarios_tenant" ON funcionarios;
    CREATE POLICY "funcionarios_tenant" ON funcionarios
      USING (tenant_id = public.get_my_tenant_id());

    DROP POLICY IF EXISTS "funcionarios_insert" ON funcionarios;
    CREATE POLICY "funcionarios_insert" ON funcionarios
      FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: funcionarios';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela funcionarios não existe - pulando';
  END;

  -- EPIS
  BEGIN
    DROP POLICY IF EXISTS "epis_tenant" ON epis;
    CREATE POLICY "epis_tenant" ON epis
      USING (tenant_id = public.get_my_tenant_id());

    DROP POLICY IF EXISTS "epis_insert" ON epis;
    CREATE POLICY "epis_insert" ON epis
      FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: epis';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela epis não existe - pulando';
  END;

  -- ESTOQUE_MOVIMENTOS
  BEGIN
    DROP POLICY IF EXISTS "estoque_tenant" ON estoque_movimentos;
    CREATE POLICY "estoque_tenant" ON estoque_movimentos
      USING (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: estoque_movimentos';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela estoque_movimentos não existe - pulando';
  END;

  -- ENTREGAS_EPI
  BEGIN
    DROP POLICY IF EXISTS "entregas_tenant" ON entregas_epi;
    CREATE POLICY "entregas_tenant" ON entregas_epi
      USING (tenant_id = public.get_my_tenant_id());

    DROP POLICY IF EXISTS "entregas_insert" ON entregas_epi;
    CREATE POLICY "entregas_insert" ON entregas_epi
      FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: entregas_epi';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela entregas_epi não existe - pulando';
  END;

  -- TREINAMENTOS
  BEGIN
    DROP POLICY IF EXISTS "treinamentos_tenant" ON treinamentos;
    CREATE POLICY "treinamentos_tenant" ON treinamentos
      USING (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: treinamentos';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela treinamentos não existe - pulando';
  END;

  -- DOCUMENTOS
  BEGIN
    DROP POLICY IF EXISTS "documentos_tenant" ON documentos;
    CREATE POLICY "documentos_tenant" ON documentos
      USING (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: documentos';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela documentos não existe - pulando';
  END;

  -- ACIDENTES
  BEGIN
    DROP POLICY IF EXISTS "acidentes_tenant" ON acidentes;
    CREATE POLICY "acidentes_tenant" ON acidentes
      USING (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: acidentes';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela acidentes não existe - pulando';
  END;

  -- NOTIFICACOES
  BEGIN
    DROP POLICY IF EXISTS "notificacoes_tenant" ON notificacoes;
    CREATE POLICY "notificacoes_tenant" ON notificacoes
      USING (tenant_id = public.get_my_tenant_id());

    RAISE NOTICE 'RLS atualizado: notificacoes';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Tabela notificacoes não existe - pulando';
  END;
END $$;

-- 6. Verificar resultado
SELECT
  u.user_id,
  u.nome,
  u.email,
  u.perfil,
  t.nome as tenant,
  t.cnpj,
  t.plano
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.criado_em DESC;

SELECT '✅ FIX CONCLUÍDO! Agora teste o login.' as status;
