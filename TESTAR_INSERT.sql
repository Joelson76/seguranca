-- ============================================================
-- TESTE: Inserir funcionário direto no banco
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Pegar o tenant_id do usuário
SELECT id, nome FROM tenants;

-- 2. SUBSTITUA 'SEU_TENANT_ID_AQUI' pelo ID que apareceu acima
-- Depois execute este INSERT:

INSERT INTO funcionarios (
  tenant_id,
  matricula,
  nome,
  cpf,
  cargo,
  setor,
  data_admissao,
  ativo
) VALUES (
  'SEU_TENANT_ID_AQUI',  -- ⚠️ SUBSTITUA PELO ID DO TENANT
  '001',
  'João Silva Teste',
  '12345678900',
  'Operador',
  'Produção',
  '2024-01-15',
  true
);

-- 3. Verificar se inseriu
SELECT * FROM funcionarios;
