-- ============================================================
-- CORREÇÃO DEFINITIVA - EXECUTE TUDO DE UMA VEZ
-- ============================================================

-- 1. DESABILITAR RLS EM ABSOLUTAMENTE TUDO
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 2. DROPAR TODAS AS POLÍTICAS RLS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. ADICIONAR TODAS AS COLUNAS FALTANTES EM ACIDENTES
ALTER TABLE acidentes DROP COLUMN IF EXISTS hora_ocorrencia CASCADE;
ALTER TABLE acidentes DROP COLUMN IF EXISTS local_ocorrencia CASCADE;
ALTER TABLE acidentes DROP COLUMN IF EXISTS causa_imediata CASCADE;
ALTER TABLE acidentes DROP COLUMN IF EXISTS medidas_corretivas CASCADE;
ALTER TABLE acidentes DROP COLUMN IF EXISTS dias_afastamento CASCADE;
ALTER TABLE acidentes DROP COLUMN IF EXISTS cat CASCADE;

ALTER TABLE acidentes
ADD COLUMN hora_ocorrencia TEXT,
ADD COLUMN local_ocorrencia TEXT,
ADD COLUMN causa_imediata TEXT,
ADD COLUMN medidas_corretivas TEXT,
ADD COLUMN dias_afastamento INTEGER,
ADD COLUMN cat BOOLEAN DEFAULT false;

-- 4. ADICIONAR TODAS AS COLUNAS FALTANTES EM ENTREGAS_EPI
ALTER TABLE entregas_epi DROP COLUMN IF EXISTS devolvido CASCADE;
ALTER TABLE entregas_epi DROP COLUMN IF EXISTS data_devolucao CASCADE;
ALTER TABLE entregas_epi DROP COLUMN IF EXISTS data_vencimento CASCADE;

ALTER TABLE entregas_epi
ADD COLUMN devolvido BOOLEAN DEFAULT false,
ADD COLUMN data_devolucao TIMESTAMPTZ,
ADD COLUMN data_vencimento DATE;

-- 5. VERIFICAR TODAS AS TABELAS
SELECT
    tablename,
    CASE WHEN rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. VERIFICAR COLUNAS DE ACIDENTES
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'acidentes'
ORDER BY ordinal_position;

-- 7. VERIFICAR COLUNAS DE ENTREGAS_EPI
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entregas_epi'
ORDER BY ordinal_position;
