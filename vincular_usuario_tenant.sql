-- ============================================================
-- VINCULAR USUÁRIO CRIADO NO AUTH A UM TENANT
-- Execute DEPOIS de criar o usuário no Dashboard
-- ============================================================

-- PASSO 1: Ver os usuários do Auth que não têm tenant
SELECT
  au.id as user_id,
  au.email,
  u.id as usuario_existente
FROM auth.users au
LEFT JOIN usuarios u ON u.user_id = au.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- PASSO 2: Criar tenant se não existir
INSERT INTO tenants (nome, cnpj, plano, ativo)
VALUES ('Empresa Exemplo', '00.000.000/0001-00', 'profissional', true)
ON CONFLICT (cnpj) DO UPDATE SET nome = 'Empresa Exemplo'
RETURNING id, nome;

-- PASSO 3: Vincular usuário ao tenant
-- SUBSTITUA 'EMAIL_DO_USUARIO' e 'ID_DO_TENANT'
INSERT INTO usuarios (user_id, tenant_id, nome, email, perfil, ativo)
SELECT
  au.id,
  'ID_DO_TENANT_AQUI'::uuid,  -- Coloque o ID do tenant aqui
  'Administrador',
  au.email,
  'admin',
  true
FROM auth.users au
WHERE au.email = 'admin@exemplo.com'
ON CONFLICT (user_id) DO NOTHING;

-- PASSO 4: Criar assinatura
INSERT INTO assinaturas (tenant_id, plano, valor_mensal, data_inicio, data_proximo_pag, status)
VALUES (
  'ID_DO_TENANT_AQUI'::uuid,
  'profissional',
  349.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'trial'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- PASSO 5: Verificar se funcionou
SELECT
  u.id,
  u.nome,
  u.email,
  u.perfil,
  t.nome as empresa,
  a.status as status_assinatura
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN assinaturas a ON a.tenant_id = u.tenant_id
WHERE u.email = 'admin@exemplo.com';
