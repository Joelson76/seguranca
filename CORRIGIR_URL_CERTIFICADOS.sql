-- ============================================================
-- Corrigir URLs duplicadas de certificados
-- Remove /certificados/ duplicado do caminho
-- ============================================================

-- Ver certificados com caminho duplicado
SELECT id, certificado_url
FROM funcionario_treinamentos
WHERE certificado_url LIKE '%/certificados/certificados/%';

-- Corrigir URLs duplicadas
UPDATE funcionario_treinamentos
SET certificado_url = REPLACE(certificado_url, '/certificados/certificados/', '/certificados/')
WHERE certificado_url LIKE '%/certificados/certificados/%';

-- Verificar correção
SELECT id, certificado_url
FROM funcionario_treinamentos
WHERE certificado_url IS NOT NULL
ORDER BY criado_em DESC
LIMIT 5;
