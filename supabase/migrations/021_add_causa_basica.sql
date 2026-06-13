-- ============================================================
-- SafeTrack — Migration 021: Adicionar coluna causa_basica
-- ============================================================

-- Adicionar coluna causa_basica que ficou faltando
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS causa_basica TEXT;

-- Comentário
COMMENT ON COLUMN acidentes.causa_basica IS 'Causa básica do acidente (condição subjacente)';

-- Sucesso
DO $$ BEGIN
  RAISE NOTICE '✅ Coluna causa_basica adicionada com sucesso!';
END $$;
