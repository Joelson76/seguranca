-- ============================================================
-- Corrigir colunas faltando nas tabelas de treinamentos
-- ============================================================

-- 1. Adicionar coluna norma_regulamentadora na tabela treinamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'treinamentos'
    AND column_name = 'norma_regulamentadora'
  ) THEN
    ALTER TABLE treinamentos ADD COLUMN norma_regulamentadora TEXT;
    RAISE NOTICE '✅ Coluna norma_regulamentadora adicionada em treinamentos!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna norma_regulamentadora já existe em treinamentos.';
  END IF;
END $$;

-- 2. Adicionar coluna instrutor na tabela funcionario_treinamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'funcionario_treinamentos'
    AND column_name = 'instrutor'
  ) THEN
    ALTER TABLE funcionario_treinamentos ADD COLUMN instrutor TEXT;
    RAISE NOTICE '✅ Coluna instrutor adicionada em funcionario_treinamentos!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna instrutor já existe em funcionario_treinamentos.';
  END IF;
END $$;

-- 3. Adicionar coluna local_realizacao na tabela funcionario_treinamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'funcionario_treinamentos'
    AND column_name = 'local_realizacao'
  ) THEN
    ALTER TABLE funcionario_treinamentos ADD COLUMN local_realizacao TEXT;
    RAISE NOTICE '✅ Coluna local_realizacao adicionada em funcionario_treinamentos!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna local_realizacao já existe em funcionario_treinamentos.';
  END IF;
END $$;

-- 4. Verificar estrutura final das tabelas
SELECT '=== ESTRUTURA DA TABELA treinamentos ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'treinamentos'
ORDER BY ordinal_position;

SELECT '=== ESTRUTURA DA TABELA funcionario_treinamentos ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'funcionario_treinamentos'
ORDER BY ordinal_position;
