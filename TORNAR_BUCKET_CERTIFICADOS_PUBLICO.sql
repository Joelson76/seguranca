-- ============================================================
-- Tornar bucket certificados público
-- ============================================================

-- Atualizar bucket para público
UPDATE storage.buckets
SET public = true
WHERE id = 'certificados';

-- Verificar
SELECT id, name, public
FROM storage.buckets
WHERE id = 'certificados';
