-- ============================================================
-- SafeTrack — Migration 012: Políticas UPDATE para Fase 3
-- ============================================================

-- Adicionar policies de UPDATE para treinamentos
CREATE POLICY "treinamentos_update" ON treinamentos
  FOR UPDATE USING (tenant_id = auth.tenant_id());

-- Adicionar policies de UPDATE e DELETE para funcionario_treinamentos
CREATE POLICY "func_treinamentos_update" ON funcionario_treinamentos
  FOR UPDATE USING (
    funcionario_id IN (SELECT id FROM funcionarios WHERE tenant_id = auth.tenant_id())
  );

CREATE POLICY "func_treinamentos_delete" ON funcionario_treinamentos
  FOR DELETE USING (
    funcionario_id IN (SELECT id FROM funcionarios WHERE tenant_id = auth.tenant_id())
  );
