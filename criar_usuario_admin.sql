-- ============================================================
-- CRIAR USUÁRIO ADMIN MANUALMENTE
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Criar o tenant (empresa)
INSERT INTO tenants (id, nome, cnpj, plano, ativo)
VALUES (
  gen_random_uuid(),
  'Empresa Exemplo',
  '00.000.000/0001-00',
  'profissional',
  true
)
ON CONFLICT (cnpj) DO NOTHING
RETURNING id;

-- 2. Anotar o ID do tenant que apareceu acima
-- Exemplo: 550e8400-e29b-41d4-a716-446655440000

-- 3. Criar usuário no Auth (SUBSTITUA 'ID_DO_TENANT' pelo UUID acima)
-- Este passo precisa ser feito via Dashboard do Supabase:
-- Vá em Authentication → Add User
-- E-mail: admin@exemplo.com
-- Senha: senha123
-- Confirme o e-mail automaticamente

-- 4. Após criar o usuário no Dashboard, pegue o ID dele
-- Vá em Authentication → Users → clique no usuário → copie o UUID

-- 5. Execute isto (SUBSTITUA os IDs):
INSERT INTO usuarios (id, user_id, tenant_id, nome, email, perfil, ativo)
VALUES (
  gen_random_uuid(),
  'USER_ID_DO_AUTH',  -- UUID do usuário criado no passo 3
  'ID_DO_TENANT',      -- UUID do tenant criado no passo 1
  'Administrador',
  'admin@exemplo.com',
  'admin',
  true
)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Criar assinatura trial
INSERT INTO assinaturas (tenant_id, plano, valor_mensal, data_inicio, data_proximo_pag, status)
VALUES (
  'ID_DO_TENANT',  -- UUID do tenant
  'profissional',
  349.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'trial'
)
ON CONFLICT (tenant_id) DO NOTHING;
