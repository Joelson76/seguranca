-- ============================================================
-- DESABILITAR RLS - EXECUTE AGORA NO SUPABASE
-- ============================================================

-- Desabilitar RLS em TODAS as tabelas
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS epis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS movimentacoes_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas_epi DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS funcionario_treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS acidentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notificacoes DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas RLS
DROP POLICY IF EXISTS usuarios_all ON usuarios;
DROP POLICY IF EXISTS funcionarios_all ON funcionarios;
DROP POLICY IF EXISTS epis_all ON epis;
DROP POLICY IF EXISTS movimentacoes_all ON movimentacoes_estoque;
DROP POLICY IF EXISTS entregas_all ON entregas_epi;
DROP POLICY IF EXISTS treinamentos_all ON treinamentos;
DROP POLICY IF EXISTS func_trein_all ON funcionario_treinamentos;
DROP POLICY IF EXISTS acidentes_all ON acidentes;
DROP POLICY IF EXISTS documentos_all ON documentos;
DROP POLICY IF EXISTS assinaturas_all ON assinaturas;
DROP POLICY IF EXISTS notificacoes_all ON notificacoes;

-- Verificar se desabilitou (deve retornar "f" para todas)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'usuarios', 'funcionarios', 'epis')
ORDER BY tablename;
