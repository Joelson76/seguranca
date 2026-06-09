-- ============================================================
-- CRIAR CONTA COMPLETA - EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================================

-- IMPORTANTE: Execute este script DEPOIS de criar o usuário no Authentication
-- Vá em: Authentication → Users → Add User
-- Email: seuemail@exemplo.com
-- Password: suasenha123
-- ✅ Marque "Auto Confirm User"

-- ============================================================

-- PASSO 1: Criar o tenant (empresa)
DO $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  -- Criar tenant
  INSERT INTO tenants (nome, cnpj, plano, ativo)
  VALUES ('Minha Empresa', '12.345.678/0001-00', 'profissional', true)
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Tenant criado com ID: %', v_tenant_id;

  -- Pegar o último usuário criado no auth
  SELECT id INTO v_user_id
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE 'Usando user_id: %', v_user_id;

  -- Criar usuário na tabela usuarios
  INSERT INTO usuarios (user_id, tenant_id, nome, email, perfil, ativo)
  SELECT
    au.id,
    v_tenant_id,
    'Administrador',
    au.email,
    'admin',
    true
  FROM auth.users au
  WHERE au.id = v_user_id;

  RAISE NOTICE 'Usuário vinculado ao tenant';

  -- Criar assinatura trial
  INSERT INTO assinaturas (tenant_id, plano, valor_mensal, data_inicio, data_proximo_pag, status)
  VALUES (
    v_tenant_id,
    'profissional',
    349.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'trial'
  );

  RAISE NOTICE 'Assinatura trial criada';

  -- Mostrar resultado
  RAISE NOTICE '✅ Conta criada com sucesso!';
  RAISE NOTICE 'Faça login com o e-mail que você criou no Authentication';

END $$;

-- Verificar se funcionou
SELECT
  u.id,
  u.nome,
  u.email,
  u.perfil,
  t.nome as empresa,
  a.plano,
  a.status as status_assinatura
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN assinaturas a ON a.tenant_id = u.tenant_id
ORDER BY u.criado_em DESC
LIMIT 1;
