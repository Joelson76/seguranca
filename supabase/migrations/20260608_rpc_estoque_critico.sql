-- RPC: Função para buscar EPIs com estoque crítico
-- Estoque crítico = quantidade atual <= estoque_minimo

CREATE OR REPLACE FUNCTION epis_estoque_critico()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  nome TEXT,
  ca TEXT,
  quantidade_atual INTEGER,
  estoque_minimo INTEGER,
  diferenca INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.tenant_id,
    e.nome,
    e.ca,
    e.quantidade_atual,
    e.estoque_minimo,
    (e.estoque_minimo - e.quantidade_atual) as diferenca
  FROM epis e
  WHERE e.quantidade_atual <= e.estoque_minimo
    AND e.tenant_id IN (
      SELECT tenant_id
      FROM usuarios
      WHERE user_id = auth.uid()
    )
  ORDER BY (e.estoque_minimo - e.quantidade_atual) DESC;
END;
$$;

COMMENT ON FUNCTION epis_estoque_critico() IS 'Retorna EPIs com estoque igual ou abaixo do mínimo para o tenant do usuário';
