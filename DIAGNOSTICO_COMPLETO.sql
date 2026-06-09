-- ============================================================
-- DIAGNÓSTICO COMPLETO - Execute no Supabase SQL Editor
-- ============================================================

-- 1. VERIFICAR QUAIS TABELAS EXISTEM
SELECT
  'TABELAS EXISTENTES' as tipo,
  tablename as nome,
  CASE WHEN rowsecurity THEN 'HABILITADO ❌' ELSE 'DESABILITADO ✅' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFICAR COLUNAS DA TABELA FUNCIONARIOS
SELECT
  'COLUNAS - funcionarios' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'funcionarios'
ORDER BY ordinal_position;

-- 3. VERIFICAR COLUNAS DA TABELA EPIS
SELECT
  'COLUNAS - epis' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'epis'
ORDER BY ordinal_position;

-- 4. VERIFICAR COLUNAS DA TABELA USUARIOS
SELECT
  'COLUNAS - usuarios' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- 5. VERIFICAR SE HÁ DADOS NAS TABELAS
SELECT
  'DADOS NAS TABELAS' as tipo,
  'tenants' as tabela,
  COUNT(*) as total
FROM tenants
UNION ALL
SELECT 'DADOS NAS TABELAS', 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'DADOS NAS TABELAS', 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'DADOS NAS TABELAS', 'epis', COUNT(*) FROM epis;

-- 6. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT
  'POLÍTICAS RLS' as tipo,
  schemaname,
  tablename,
  policyname,
  CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. VERIFICAR FUNÇÕES
SELECT
  'FUNÇÕES' as tipo,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%tenant%'
ORDER BY routine_name;
