-- ============================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA entregas_epi
-- Execute no Supabase SQL Editor
-- ============================================================

-- Adicionar colunas para devoluções e vencimento
ALTER TABLE entregas_epi
ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entregas_epi'
ORDER BY ordinal_position;
