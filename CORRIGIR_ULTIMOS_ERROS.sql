-- ============================================================
-- CORRIGIR ÚLTIMOS ERROS - Execute no Supabase
-- ============================================================

-- 1. Adicionar colunas faltantes em entregas_epi
ALTER TABLE entregas_epi
ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- 2. Verificar se a tabela acidentes tem tenant_id
-- (O erro 400 pode ser porque a query não está filtrando corretamente)

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'acidentes'
ORDER BY ordinal_position;

-- 3. Se necessário, garantir que RLS está desabilitado em acidentes
ALTER TABLE acidentes DISABLE ROW LEVEL SECURITY;

-- 4. Verificar Storage - Criar bucket 'assinaturas' se não existir
-- (Execute no Supabase Dashboard → Storage → New Bucket)
-- Nome: assinaturas
-- Tipo: Private

-- 5. Depois, adicionar política ao bucket assinaturas:
-- (Execute no SQL Editor)
