-- ============================================================
-- DIAGNÓSTICO SIMPLES - Execute no Supabase SQL Editor
-- ============================================================

-- 1. VERIFICAR QUAIS TABELAS EXISTEM E STATUS DO RLS
SELECT
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFICAR COLUNAS DA TABELA FUNCIONARIOS
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'funcionarios'
ORDER BY ordinal_position;

-- 3. VERIFICAR COLUNAS DA TABELA EPIS
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'epis'
ORDER BY ordinal_position;

-- 4. CONTAR DADOS NAS TABELAS
SELECT 'tenants' as tabela, COUNT(*) as total FROM tenants
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'epis', COUNT(*) FROM epis;

-- 5. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
