-- ============================================================
-- SafeTrack — Migration 011: Log de Auditoria
-- Registra INSERT/UPDATE/DELETE nas tabelas críticas
-- ============================================================

CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id),
  usuario_id   UUID REFERENCES auth.users(id),
  tabela       TEXT NOT NULL,
  operacao     TEXT NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  registro_id  UUID,
  dados_antes  JSONB,
  dados_depois JSONB,
  ip           TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant  ON audit_log(tenant_id, criado_em DESC);
CREATE INDEX idx_audit_tabela  ON audit_log(tabela, operacao);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id, criado_em DESC);

-- RLS: admin vê somente o próprio tenant
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_tenant" ON audit_log
  USING (tenant_id = auth.tenant_id());

-- Função de trigger genérica
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Tenta extrair tenant_id do registro
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_tenant_id := OLD.tenant_id;
    ELSE
      v_tenant_id := NEW.tenant_id;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    v_tenant_id := NULL;
  END;

  INSERT INTO audit_log (tenant_id, usuario_id, tabela, operacao, registro_id, dados_antes, dados_depois)
  VALUES (
    v_tenant_id,
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers nas tabelas críticas
CREATE TRIGGER audit_funcionarios
  AFTER INSERT OR UPDATE OR DELETE ON funcionarios
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER audit_epis
  AFTER INSERT OR UPDATE OR DELETE ON epis
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER audit_entregas_epi
  AFTER INSERT OR UPDATE OR DELETE ON entregas_epi
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER audit_acidentes
  AFTER INSERT OR UPDATE OR DELETE ON acidentes
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
