-- ============================================================
-- Corrigir coluna acidente_id na tabela documentos
-- ============================================================

-- Verificar e adicionar coluna acidente_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'documentos'
    AND column_name = 'acidente_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN acidente_id UUID REFERENCES acidentes(id);
    RAISE NOTICE '✅ Coluna acidente_id adicionada em documentos!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna acidente_id já existe em documentos.';
  END IF;
END $$;

-- Verificar estrutura da tabela documentos
SELECT '=== ESTRUTURA DA TABELA documentos ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;

-- Recarregar o schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
