-- ========================================
-- VERIFICAÇÃO: Tabelas de Biometria
-- ========================================
-- Execute este script para verificar se está tudo OK
-- ========================================

-- 1. Verificar se tabela funcionarios_credenciais_biometricas existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'funcionarios_credenciais_biometricas'
    )
    THEN '✅ Tabela funcionarios_credenciais_biometricas existe'
    ELSE '❌ Tabela funcionarios_credenciais_biometricas NÃO existe'
  END as status_tabela;

-- 2. Verificar colunas de biometria na tabela entregas_epi
SELECT
  column_name,
  data_type,
  CASE WHEN column_name IN (
    'biometria_hash',
    'biometria_tipo',
    'biometria_dispositivo',
    'biometria_metadata'
  ) THEN '✅ OK' ELSE '' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entregas_epi'
  AND column_name LIKE 'biometria%'
ORDER BY column_name;

-- 3. Verificar se função get_my_tenant_id() existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'get_my_tenant_id'
    )
    THEN '✅ Função public.get_my_tenant_id() existe'
    ELSE '❌ Função public.get_my_tenant_id() NÃO existe'
  END as status_funcao;

-- 4. Verificar políticas RLS da tabela credenciais
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%get_my_tenant_id%' THEN '✅ Usa get_my_tenant_id()'
    WHEN qual LIKE '%auth.tenant_id%' THEN '❌ Usa auth.tenant_id() - PRECISA CORRIGIR'
    ELSE '⚠️ Outro critério'
  END as status_policy
FROM pg_policies
WHERE tablename = 'funcionarios_credenciais_biometricas'
ORDER BY policyname;

-- 5. Verificar se tabelas necessárias existem
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'tenants',
      'usuarios',
      'funcionarios',
      'entregas_epi',
      'funcionarios_credenciais_biometricas'
    ) THEN '✅ Existe'
    ELSE ''
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'tenants',
    'usuarios',
    'funcionarios',
    'epis',
    'entregas_epi',
    'funcionarios_credenciais_biometricas'
  )
ORDER BY table_name;

-- 6. Resumo final
SELECT
  '========================================' as separador
UNION ALL
SELECT 'RESUMO DA VERIFICAÇÃO'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT
  CASE
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'funcionarios_credenciais_biometricas'
    ) > 0
    AND (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'entregas_epi'
      AND column_name LIKE 'biometria%'
    ) >= 4
    AND (
      SELECT COUNT(*) FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'get_my_tenant_id'
    ) > 0
    THEN '✅ TUDO OK! Biometria pronta para usar'
    ELSE '❌ FALTA ALGO - Execute as migrations'
  END as resultado;
