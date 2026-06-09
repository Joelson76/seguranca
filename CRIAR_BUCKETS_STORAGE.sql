-- ============================================================
-- Criar Buckets no Supabase Storage
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- Criar bucket documentos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket assinaturas (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assinaturas',
  'assinaturas',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket fotos-funcionario (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-funcionario',
  'fotos-funcionario',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

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

-- Criar bucket logos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Políticas de acesso (RLS) para os buckets
-- ============================================================

-- BUCKET: documentos
CREATE POLICY "documentos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "documentos_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "documentos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos'
    AND auth.role() = 'authenticated'
  );

-- BUCKET: assinaturas
CREATE POLICY "assinaturas_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assinaturas'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "assinaturas_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assinaturas'
    AND auth.role() = 'authenticated'
  );

-- BUCKET: fotos-funcionario
CREATE POLICY "fotos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-funcionario'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "fotos_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'fotos-funcionario'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "fotos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fotos-funcionario'
    AND auth.role() = 'authenticated'
  );

-- BUCKET: certificados
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

-- BUCKET: logos (público)
CREATE POLICY "logos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "logos_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Verificar buckets criados
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;
