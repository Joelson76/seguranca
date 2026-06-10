-- ============================================================
-- SafeTrack — Migration 011: Corrige URLs públicas para paths
-- ============================================================
-- Remove URLs públicas dos campos arquivo_url e substitui por paths

-- Função para extrair o path de uma URL pública do Supabase
-- Entrada: https://projeto.supabase.co/storage/v1/object/public/bucket/path/file.jpg
-- Saída:   path/file.jpg

UPDATE documentos
SET arquivo_url = REGEXP_REPLACE(
  arquivo_url,
  '^https?://[^/]+/storage/v1/object/public/[^/]+/',
  ''
)
WHERE arquivo_url LIKE '%/storage/v1/object/public/%';

-- Log de quantos registros foram atualizados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Atualizados % registros em documentos', updated_count;
END $$;
