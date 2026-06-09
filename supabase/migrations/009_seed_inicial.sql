-- ============================================================
-- SafeTrack — Seed Inicial (OPCIONAL)
-- Execute APÓS criar o primeiro usuário no Supabase Auth Dashboard
-- Substitua os valores entre <> com os dados reais
-- ============================================================

-- 1. Criar o tenant (empresa)
INSERT INTO tenants (id, nome, cnpj, plano)
VALUES (
  gen_random_uuid(),
  'Minha Empresa Ltda',
  '00.000.000/0001-00',
  'profissional'
) RETURNING id;

-- 2. Após anotar o ID retornado acima, criar o usuário administrador
-- Substitua <USER_ID> pelo UUID do usuário criado no Supabase Auth
-- Substitua <TENANT_ID> pelo UUID retornado no passo 1
INSERT INTO usuarios (id, tenant_id, nome, perfil)
VALUES (
  '<USER_ID>',
  '<TENANT_ID>',
  'Administrador',
  'admin'
);

-- 3. Criar assinatura trial (30 dias)
INSERT INTO assinaturas (tenant_id, plano, valor_mensal, data_inicio, data_proximo_pag, status)
VALUES (
  '<TENANT_ID>',
  'profissional',
  349.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'trial'
);

-- ============================================================
-- Criar Buckets de Storage (executar no SQL Editor ou via dashboard)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documentos',          'documentos',          false, 52428800, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('assinaturas',         'assinaturas',         false, 5242880,  ARRAY['image/png','image/jpeg']),
  ('fotos-funcionario',   'fotos-funcionario',   false, 5242880,  ARRAY['image/png','image/jpeg','image/webp']),
  ('certificados',        'certificados',        false, 52428800, ARRAY['application/pdf','image/jpeg','image/png']),
  ('logos',               'logos',               true,  5242880,  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage (acesso por tenant via RLS)
CREATE POLICY "storage_documentos_tenant" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documentos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_assinaturas_tenant" ON storage.objects
  FOR ALL USING (
    bucket_id = 'assinaturas' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_fotos_tenant" ON storage.objects
  FOR ALL USING (
    bucket_id = 'fotos-funcionario' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_certificados_tenant" ON storage.objects
  FOR ALL USING (
    bucket_id = 'certificados' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_logos_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "storage_logos_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);
