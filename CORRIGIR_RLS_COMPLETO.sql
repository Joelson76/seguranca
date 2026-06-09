-- ============================================================
-- CORRIGIR RLS PARA PERMITIR REGISTRO
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. TENANTS - Desabilitar RLS
-- ============================================================

DROP POLICY IF EXISTS tenants_select ON tenants;
DROP POLICY IF EXISTS tenants_insert ON tenants;
DROP POLICY IF EXISTS tenants_update ON tenants;
DROP POLICY IF EXISTS tenants_all ON tenants;

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. USUARIOS - Política Permissiva
-- ============================================================

DROP POLICY IF EXISTS usuarios_select ON usuarios;
DROP POLICY IF EXISTS usuarios_insert ON usuarios;
DROP POLICY IF EXISTS usuarios_update ON usuarios;
DROP POLICY IF EXISTS usuarios_all ON usuarios;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT para usuário logado
CREATE POLICY usuarios_select ON usuarios
  FOR SELECT
  USING (user_id = auth.uid());

-- Permitir INSERT para QUALQUER usuário autenticado (para registro)
CREATE POLICY usuarios_insert ON usuarios
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir UPDATE apenas do próprio registro
CREATE POLICY usuarios_update ON usuarios
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- 3. ASSINATURAS - Desabilitar RLS (criada no registro)
-- ============================================================

DROP POLICY IF EXISTS assinaturas_select ON assinaturas;
DROP POLICY IF EXISTS assinaturas_insert ON assinaturas;
DROP POLICY IF EXISTS assinaturas_update ON assinaturas;
DROP POLICY IF EXISTS assinaturas_all ON assinaturas;

ALTER TABLE assinaturas DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PRONTO! Agora o registro vai funcionar!
-- ============================================================
