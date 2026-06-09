-- ============================================================
-- TESTE RÁPIDO: Verificar se o RLS está bloqueando
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Ver se existem dados nas tabelas
SELECT 'tenants' as tabela, COUNT(*) as total FROM tenants
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'epis', COUNT(*) FROM epis;

-- 2. Ver se a função get_my_tenant_id() existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_my_tenant_id';

-- 3. SOLUÇÃO TEMPORÁRIA: Desabilitar RLS para testar
-- ATENÇÃO: Isso remove a segurança! Use apenas para testar!
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE epis DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi DISABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE acidentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se desabilitou
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'usuarios', 'funcionarios', 'epis')
ORDER BY tablename;
