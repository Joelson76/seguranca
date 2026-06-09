-- ============================================================
-- Criar bucket certificados no Supabase Storage
-- ============================================================

-- Criar bucket certificados (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificados',
  'certificados',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "certificados_upload" ON storage.objects;
DROP POLICY IF EXISTS "certificados_read" ON storage.objects;
DROP POLICY IF EXISTS "certificados_delete" ON storage.objects;

-- Criar políticas de acesso para o bucket certificados
CREATE POLICY "certificados_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificados'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "certificados_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'certificados'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "certificados_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'certificados'
    AND auth.role() = 'authenticated'
  );

-- Verificar bucket criado
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'certificados';
