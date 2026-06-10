-- ============================================================
-- SafeTrack — Migration 012: Bucket dedicado para acidentes
-- ============================================================

-- Criar bucket acidentes (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'acidentes',
  'acidentes',
  false,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para bucket acidentes
CREATE POLICY "storage_acidentes_tenant" ON storage.objects
  FOR ALL USING (
    bucket_id = 'acidentes' AND
    auth.uid() IS NOT NULL
  );

-- Comentário explicativo
COMMENT ON POLICY "storage_acidentes_tenant" ON storage.objects IS
'Permite acesso ao bucket acidentes para usuários autenticados. RLS por tenant é feito na tabela documentos.';
