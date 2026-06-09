-- ============================================================
-- ADICIONAR COLUNAS FALTANTES EM ACIDENTES
-- Execute no Supabase SQL Editor
-- ============================================================

-- Adicionar as colunas que o código está esperando
ALTER TABLE acidentes
ADD COLUMN IF NOT EXISTS hora_ocorrencia TEXT,
ADD COLUMN IF NOT EXISTS dias_afastamento INTEGER,
ADD COLUMN IF NOT EXISTS cat BOOLEAN DEFAULT false;

-- Renomear colunas para o formato que o código espera
-- (Como ALTER COLUMN RENAME não existe, vamos criar novas e copiar)

-- Se preferir, adicione aliases/views ou use as colunas existentes
-- Alternativa: manter as colunas originais e adicionar as novas

-- Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'acidentes'
ORDER BY ordinal_position;
