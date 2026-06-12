-- ================================================
-- FIX COMPLETO: Substituir auth.tenant_id() por public.get_my_tenant_id()
-- ================================================
-- Execute DEPOIS do FIX_LOGIN_SEM_AUTH.sql
-- ================================================

-- PASSO 1: Garantir que função existe
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon, authenticated, service_role;

-- ================================================
-- PASSO 2: Recriar todas as políticas RLS
-- ================================================

-- FUNCIONÁRIOS
DROP POLICY IF EXISTS "funcionarios_tenant" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_update" ON funcionarios;

CREATE POLICY "funcionarios_tenant" ON funcionarios
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "funcionarios_insert" ON funcionarios
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "funcionarios_update" ON funcionarios
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- EPIS
DROP POLICY IF EXISTS "epis_tenant" ON epis;
DROP POLICY IF EXISTS "epis_insert" ON epis;
DROP POLICY IF EXISTS "epis_update" ON epis;

CREATE POLICY "epis_tenant" ON epis
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "epis_insert" ON epis
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "epis_update" ON epis
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ESTOQUE_MOVIMENTOS
DROP POLICY IF EXISTS "estoque_tenant" ON estoque_movimentos;
DROP POLICY IF EXISTS "estoque_insert" ON estoque_movimentos;

CREATE POLICY "estoque_tenant" ON estoque_movimentos
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "estoque_insert" ON estoque_movimentos
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

-- ENTREGAS_EPI
DROP POLICY IF EXISTS "entregas_tenant" ON entregas_epi;
DROP POLICY IF EXISTS "entregas_insert" ON entregas_epi;
DROP POLICY IF EXISTS "entregas_update" ON entregas_epi;

CREATE POLICY "entregas_tenant" ON entregas_epi
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "entregas_insert" ON entregas_epi
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "entregas_update" ON entregas_epi
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- TREINAMENTOS
DROP POLICY IF EXISTS "treinamentos_tenant" ON treinamentos;
DROP POLICY IF EXISTS "treinamentos_insert" ON treinamentos;
DROP POLICY IF EXISTS "treinamentos_update" ON treinamentos;

CREATE POLICY "treinamentos_tenant" ON treinamentos
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "treinamentos_insert" ON treinamentos
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "treinamentos_update" ON treinamentos
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- PARTICIPANTES_TREINAMENTO
DROP POLICY IF EXISTS "participantes_tenant" ON participantes_treinamento;
DROP POLICY IF EXISTS "participantes_insert" ON participantes_treinamento;

CREATE POLICY "participantes_tenant" ON participantes_treinamento
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "participantes_insert" ON participantes_treinamento
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

-- DOCUMENTOS
DROP POLICY IF EXISTS "documentos_tenant" ON documentos;
DROP POLICY IF EXISTS "documentos_insert" ON documentos;
DROP POLICY IF EXISTS "documentos_update" ON documentos;

CREATE POLICY "documentos_tenant" ON documentos
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "documentos_update" ON documentos
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ACIDENTES
DROP POLICY IF EXISTS "acidentes_tenant" ON acidentes;
DROP POLICY IF EXISTS "acidentes_insert" ON acidentes;
DROP POLICY IF EXISTS "acidentes_update" ON acidentes;

CREATE POLICY "acidentes_tenant" ON acidentes
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "acidentes_insert" ON acidentes
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "acidentes_update" ON acidentes
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- NOTIFICACOES
DROP POLICY IF EXISTS "notificacoes_tenant" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_update" ON notificacoes;

CREATE POLICY "notificacoes_tenant" ON notificacoes
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "notificacoes_insert" ON notificacoes
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "notificacoes_update" ON notificacoes
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- CREDENCIAIS BIOMÉTRICAS
DROP POLICY IF EXISTS "credenciais_tenant" ON funcionarios_credenciais_biometricas;
DROP POLICY IF EXISTS "credenciais_insert" ON funcionarios_credenciais_biometricas;
DROP POLICY IF EXISTS "credenciais_update" ON funcionarios_credenciais_biometricas;

CREATE POLICY "credenciais_tenant" ON funcionarios_credenciais_biometricas
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "credenciais_insert" ON funcionarios_credenciais_biometricas
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "credenciais_update" ON funcionarios_credenciais_biometricas
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ================================================
-- VERIFICAÇÃO FINAL
-- ================================================

SELECT 'RLS atualizado com sucesso!' as status;

-- Testar função
SELECT public.get_my_tenant_id() AS meu_tenant_id;
