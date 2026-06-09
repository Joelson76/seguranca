-- ============================================================
-- DESABILITAR RLS EM TENANTS (Solução Temporária)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Remover todas as políticas de tenants
DROP POLICY IF EXISTS tenants_select ON tenants;
DROP POLICY IF EXISTS tenants_insert ON tenants;
DROP POLICY IF EXISTS tenants_update ON tenants;
DROP POLICY IF EXISTS tenants_all ON tenants;

-- DESABILITAR Row Level Security na tabela tenants
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Agora qualquer usuário autenticado pode criar tenants!
-- ============================================================
