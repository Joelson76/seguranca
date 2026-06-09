-- ============================================================
-- DESABILITAR RLS EM USUARIOS (Para Permitir Registro)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Remover todas as políticas
DROP POLICY IF EXISTS usuarios_select ON usuarios;
DROP POLICY IF EXISTS usuarios_insert ON usuarios;
DROP POLICY IF EXISTS usuarios_update ON usuarios;
DROP POLICY IF EXISTS usuarios_all ON usuarios;

-- DESABILITAR Row Level Security
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PRONTO!
-- ============================================================
