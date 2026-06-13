-- ============================================================
-- SafeTrack — Migration 020: Melhorias Módulo Acidentes
-- Versão SIMPLIFICADA - usa apenas tabela usuarios
-- ============================================================

-- ========== CRIAR FUNÇÃO TENANT_ID ==========
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== ENUMS ==========
DO $$ BEGIN
  CREATE TYPE status_cat AS ENUM ('pendente', 'enviada', 'aceita', 'rejeitada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE metodo_analise AS ENUM ('5_porques', 'ishikawa', 'arvore_causas', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE categoria_evidencia AS ENUM ('fotos_local', 'laudos_medicos', 'depoimentos', 'analise_tecnica', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_acao_corretiva AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== ALTERAÇÕES NA TABELA ACIDENTES ==========

-- Campos CAT completos
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS data_emissao_cat DATE;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS prazo_cat DATE;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS status_cat status_cat DEFAULT 'pendente';
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS observacoes_cat TEXT;

-- Investigação e análise
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS responsavel_investigacao UUID REFERENCES auth.users(id);
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS data_inicio_investigacao TIMESTAMPTZ;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS data_conclusao_investigacao TIMESTAMPTZ;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS prazo_conclusao_investigacao DATE;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS metodo_analise metodo_analise;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS causa_raiz TEXT;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS analise_detalhada JSONB;

-- Dados adicionais
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS parte_corpo_atingida TEXT;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS gravidade INTEGER;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS houve_afastamento BOOLEAN DEFAULT false;
ALTER TABLE acidentes ADD COLUMN IF NOT EXISTS data_retorno DATE;

-- Adicionar constraint de gravidade se ainda não existe
DO $$ BEGIN
  ALTER TABLE acidentes ADD CONSTRAINT acidentes_gravidade_check CHECK (gravidade BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== TABELA DE TESTEMUNHAS ==========
CREATE TABLE IF NOT EXISTS acidente_testemunhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acidente_id UUID NOT NULL REFERENCES acidentes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  funcionario_id UUID REFERENCES funcionarios(id),
  nome_testemunha TEXT NOT NULL,
  depoimento TEXT,
  data_depoimento TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acidente_testemunhas_acidente ON acidente_testemunhas(acidente_id);

ALTER TABLE acidente_testemunhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testemunhas_tenant" ON acidente_testemunhas;
CREATE POLICY "testemunhas_tenant" ON acidente_testemunhas
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "testemunhas_insert" ON acidente_testemunhas;
CREATE POLICY "testemunhas_insert" ON acidente_testemunhas
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "testemunhas_update" ON acidente_testemunhas;
CREATE POLICY "testemunhas_update" ON acidente_testemunhas
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "testemunhas_delete" ON acidente_testemunhas;
CREATE POLICY "testemunhas_delete" ON acidente_testemunhas
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ========== TABELA DE AÇÕES CORRETIVAS ==========
CREATE TABLE IF NOT EXISTS acidente_acoes_corretivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acidente_id UUID NOT NULL REFERENCES acidentes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  descricao TEXT NOT NULL,
  tipo_acao TEXT,
  responsavel_id UUID REFERENCES funcionarios(id),
  responsavel_nome TEXT,
  prazo DATE NOT NULL,
  status status_acao_corretiva DEFAULT 'pendente',
  data_conclusao DATE,
  evidencia_conclusao TEXT,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_acidente ON acidente_acoes_corretivas(acidente_id);
CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_status ON acidente_acoes_corretivas(status);
CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_prazo ON acidente_acoes_corretivas(prazo);

ALTER TABLE acidente_acoes_corretivas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acoes_tenant" ON acidente_acoes_corretivas;
CREATE POLICY "acoes_tenant" ON acidente_acoes_corretivas
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "acoes_insert" ON acidente_acoes_corretivas;
CREATE POLICY "acoes_insert" ON acidente_acoes_corretivas
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "acoes_update" ON acidente_acoes_corretivas;
CREATE POLICY "acoes_update" ON acidente_acoes_corretivas
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "acoes_delete" ON acidente_acoes_corretivas;
CREATE POLICY "acoes_delete" ON acidente_acoes_corretivas
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ========== MELHORIAS EM DOCUMENTOS (EVIDÊNCIAS) ==========
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS categoria_evidencia categoria_evidencia DEFAULT 'outros';
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS criado_por_nome TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS tamanho_bytes BIGINT;

-- ========== CHECKLIST DE INVESTIGAÇÃO ==========
CREATE TABLE IF NOT EXISTS acidente_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acidente_id UUID NOT NULL REFERENCES acidentes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Itens do checklist conforme NR-1
  local_preservado BOOLEAN DEFAULT false,
  fotos_realizadas BOOLEAN DEFAULT false,
  testemunhas_ouvidas BOOLEAN DEFAULT false,
  epi_analisado BOOLEAN DEFAULT false,
  condicoes_ambiente_verificadas BOOLEAN DEFAULT false,
  procedimentos_revisados BOOLEAN DEFAULT false,
  treinamento_verificado BOOLEAN DEFAULT false,
  equipamentos_inspecionados BOOLEAN DEFAULT false,
  relatorio_elaborado BOOLEAN DEFAULT false,
  acoes_imediatas_tomadas BOOLEAN DEFAULT false,

  observacoes TEXT,
  preenchido_por UUID REFERENCES auth.users(id),
  preenchido_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_acidente ON acidente_checklist(acidente_id);

ALTER TABLE acidente_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_tenant" ON acidente_checklist;
CREATE POLICY "checklist_tenant" ON acidente_checklist
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "checklist_insert" ON acidente_checklist;
CREATE POLICY "checklist_insert" ON acidente_checklist
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "checklist_update" ON acidente_checklist;
CREATE POLICY "checklist_update" ON acidente_checklist
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ========== VIEW DE INDICADORES SESMT ==========
CREATE OR REPLACE VIEW vw_indicadores_sesmt AS
WITH dados_acidentes AS (
  SELECT
    tenant_id,
    DATE_TRUNC('month', data_ocorrencia) as mes,
    COUNT(*) as total_acidentes,
    COUNT(*) FILTER (WHERE tipo = 'acidente_com_afastamento') as acidentes_com_afastamento,
    SUM(COALESCE(dias_afastamento, 0)) as total_dias_perdidos,
    COUNT(DISTINCT funcionario_id) as funcionarios_acidentados
  FROM acidentes
  WHERE data_ocorrencia >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY tenant_id, DATE_TRUNC('month', data_ocorrencia)
),
dados_funcionarios AS (
  SELECT
    tenant_id,
    COUNT(*) FILTER (WHERE ativo = true) as total_funcionarios,
    COUNT(*) FILTER (WHERE ativo = true) * 220 as horas_homem_trabalhadas
  FROM funcionarios
  GROUP BY tenant_id
)
SELECT
  a.tenant_id,
  a.mes,
  a.total_acidentes,
  a.acidentes_com_afastamento,
  a.total_dias_perdidos,
  f.total_funcionarios,
  f.horas_homem_trabalhadas,

  -- TF = Taxa de Frequência
  CASE
    WHEN f.horas_homem_trabalhadas > 0
    THEN ROUND((a.acidentes_com_afastamento::numeric / f.horas_homem_trabalhadas * 1000000), 2)
    ELSE 0
  END as taxa_frequencia,

  -- TG = Taxa de Gravidade
  CASE
    WHEN f.horas_homem_trabalhadas > 0
    THEN ROUND((a.total_dias_perdidos::numeric / f.horas_homem_trabalhadas * 1000000), 2)
    ELSE 0
  END as taxa_gravidade,

  -- CAI = Coeficiente de Acidente Incapacitante
  CASE
    WHEN f.horas_homem_trabalhadas > 0
    THEN ROUND(
      ((a.acidentes_com_afastamento::numeric / f.horas_homem_trabalhadas * 1000000) *
       (a.total_dias_perdidos::numeric / f.horas_homem_trabalhadas * 1000000) / 1000), 2)
    ELSE 0
  END as coeficiente_acidente_incapacitante

FROM dados_acidentes a
LEFT JOIN dados_funcionarios f ON a.tenant_id = f.tenant_id
ORDER BY a.mes DESC;

-- ========== VIEW DE ANÁLISE DE RECORRÊNCIA ==========
CREATE OR REPLACE VIEW vw_acidentes_recorrencia AS
SELECT
  tenant_id,
  tipo,
  local_ocorrencia,
  causa_imediata,
  causa_raiz,
  COUNT(*) as ocorrencias,
  MAX(data_ocorrencia) as ultima_ocorrencia,
  MIN(data_ocorrencia) as primeira_ocorrencia,
  ARRAY_AGG(id ORDER BY data_ocorrencia DESC) as ids_acidentes
FROM acidentes
WHERE data_ocorrencia >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY tenant_id, tipo, local_ocorrencia, causa_imediata, causa_raiz
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ========== TRIGGERS PARA ALERTAS ==========

-- Função para calcular prazo CAT (24h após acidente com afastamento)
CREATE OR REPLACE FUNCTION calcular_prazo_cat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'acidente_com_afastamento' AND NEW.cat = true THEN
    NEW.prazo_cat := NEW.data_ocorrencia + INTERVAL '1 day';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prazo_cat ON acidentes;
CREATE TRIGGER trigger_prazo_cat
BEFORE INSERT OR UPDATE ON acidentes
FOR EACH ROW
EXECUTE FUNCTION calcular_prazo_cat();

-- Função para definir prazo de conclusão da investigação (15 dias úteis)
CREATE OR REPLACE FUNCTION calcular_prazo_investigacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_inicio_investigacao IS NOT NULL AND NEW.prazo_conclusao_investigacao IS NULL THEN
    NEW.prazo_conclusao_investigacao := NEW.data_inicio_investigacao::date + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prazo_investigacao ON acidentes;
CREATE TRIGGER trigger_prazo_investigacao
BEFORE INSERT OR UPDATE ON acidentes
FOR EACH ROW
EXECUTE FUNCTION calcular_prazo_investigacao();

-- Trigger para atualizar data de conclusão quando status = concluido
CREATE OR REPLACE FUNCTION atualizar_data_conclusao_investigacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    NEW.data_conclusao_investigacao := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_data_conclusao ON acidentes;
CREATE TRIGGER trigger_data_conclusao
BEFORE UPDATE ON acidentes
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_conclusao_investigacao();

-- ========== FUNÇÃO PARA GERAR NOTIFICAÇÕES DE ALERTA ==========
CREATE OR REPLACE FUNCTION gerar_alertas_acidentes()
RETURNS TABLE(
  acidente_id UUID,
  tipo_alerta TEXT,
  mensagem TEXT,
  criticidade TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Alerta: CAT vencida (não enviada em 24h)
  SELECT
    a.id,
    'cat_vencida'::TEXT,
    'CAT não enviada no prazo de 24h após acidente'::TEXT,
    'critico'::TEXT
  FROM acidentes a
  WHERE a.cat = true
    AND a.status_cat = 'pendente'
    AND a.prazo_cat < CURRENT_DATE

  UNION ALL

  -- Alerta: Investigação atrasada
  SELECT
    a.id,
    'investigacao_atrasada'::TEXT,
    'Investigação não concluída no prazo de 15 dias'::TEXT,
    'alto'::TEXT
  FROM acidentes a
  WHERE a.status IN ('aberto', 'em_investigacao')
    AND a.prazo_conclusao_investigacao IS NOT NULL
    AND a.prazo_conclusao_investigacao < CURRENT_DATE

  UNION ALL

  -- Alerta: Ações corretivas vencidas
  SELECT
    ac.acidente_id,
    'acao_vencida'::TEXT,
    'Ação corretiva "' || ac.descricao || '" não concluída no prazo'::TEXT,
    'medio'::TEXT
  FROM acidente_acoes_corretivas ac
  WHERE ac.status IN ('pendente', 'em_andamento')
    AND ac.prazo < CURRENT_DATE;

END;
$$ LANGUAGE plpgsql;

-- ========== COMENTÁRIOS ==========
COMMENT ON TABLE acidente_testemunhas IS 'Testemunhas de acidentes de trabalho';
COMMENT ON TABLE acidente_acoes_corretivas IS 'Ações corretivas e preventivas pós-acidente';
COMMENT ON TABLE acidente_checklist IS 'Checklist de investigação conforme NR-1';
COMMENT ON VIEW vw_indicadores_sesmt IS 'Indicadores SESMT: TF, TG, CAI por mês';
COMMENT ON VIEW vw_acidentes_recorrencia IS 'Análise de padrões e recorrência de acidentes';
COMMENT ON FUNCTION gerar_alertas_acidentes IS 'Retorna alertas de prazos vencidos (CAT, investigação, ações)';

-- ========== SUCESSO ==========
DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration 020 - SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABELAS CRIADAS:';
  RAISE NOTICE '   • acidente_testemunhas';
  RAISE NOTICE '   • acidente_acoes_corretivas';
  RAISE NOTICE '   • acidente_checklist';
  RAISE NOTICE '';
  RAISE NOTICE '📈 VIEWS CRIADAS:';
  RAISE NOTICE '   • vw_indicadores_sesmt (TF, TG, CAI)';
  RAISE NOTICE '   • vw_acidentes_recorrencia';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 TRIGGERS CRIADOS:';
  RAISE NOTICE '   • Prazo CAT automático (24h)';
  RAISE NOTICE '   • Prazo investigação (15 dias)';
  RAISE NOTICE '   • Data conclusão automática';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 TESTE AGORA:';
  RAISE NOTICE '   SELECT * FROM gerar_alertas_acidentes();';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
