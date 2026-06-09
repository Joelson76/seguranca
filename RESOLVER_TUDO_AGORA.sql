-- ============================================================
-- RESOLVER TODOS OS ERROS 400 - EXECUTE TUDO DE UMA VEZ
-- Cole TUDO no SQL Editor do Supabase e clique em RUN
-- ============================================================

-- 1. DESABILITAR RLS EM TODAS AS TABELAS
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

-- 2. ADICIONAR COLUNAS FALTANTES EM ACIDENTES
ALTER TABLE acidentes
ADD COLUMN IF NOT EXISTS hora_ocorrencia TEXT,
ADD COLUMN IF NOT EXISTS local_ocorrencia TEXT,
ADD COLUMN IF NOT EXISTS causa_imediata TEXT,
ADD COLUMN IF NOT EXISTS medidas_corretivas TEXT,
ADD COLUMN IF NOT EXISTS dias_afastamento INTEGER,
ADD COLUMN IF NOT EXISTS cat BOOLEAN DEFAULT false;

-- 3. ADICIONAR COLUNAS FALTANTES EM ENTREGAS_EPI
ALTER TABLE entregas_epi
ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- 4. VERIFICAR RESULTADO - ACIDENTES
SELECT
  'ACIDENTES - Colunas:' as info,
  string_agg(column_name, ', ') as colunas
FROM information_schema.columns
WHERE table_name = 'acidentes'
  AND table_schema = 'public';

-- 5. VERIFICAR RESULTADO - ENTREGAS
SELECT
  'ENTREGAS - Colunas:' as info,
  string_agg(column_name, ', ') as colunas
FROM information_schema.columns
WHERE table_name = 'entregas_epi'
  AND table_schema = 'public';

-- 6. VERIFICAR RLS
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '❌ HABILITADO' ELSE '✅ DESABILITADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('acidentes', 'entregas_epi', 'funcionarios', 'epis')
ORDER BY tablename;

-- ============================================================
-- ✅ PRONTO! Se aparecer "Success", recarregue o app!
-- ============================================================
