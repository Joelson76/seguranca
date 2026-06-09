-- ============================================================
-- SafeTrack — Migration 010: Índices para performance
-- ============================================================

-- Funcionários
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant ON funcionarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_ativo ON funcionarios(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_setor ON funcionarios(tenant_id, setor);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios USING gin(to_tsvector('portuguese', nome));

-- EPIs
CREATE INDEX IF NOT EXISTS idx_epis_tenant ON epis(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_epis_estoque ON epis(tenant_id, estoque_atual, estoque_minimo);

-- Entregas
CREATE INDEX IF NOT EXISTS idx_entregas_tenant ON entregas_epi(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entregas_funcionario ON entregas_epi(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_entregas_data ON entregas_epi(data_entrega DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_devolvido ON entregas_epi(tenant_id, devolvido);

-- Movimentos de estoque
CREATE INDEX IF NOT EXISTS idx_mov_epi ON estoque_movimentos(epi_id, criado_em DESC);

-- Treinamentos
CREATE INDEX IF NOT EXISTS idx_func_trein_func ON funcionario_treinamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_func_trein_venc ON funcionario_treinamentos(data_vencimento, status);

-- Acidentes
CREATE INDEX IF NOT EXISTS idx_acidentes_tenant ON acidentes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acidentes_data ON acidentes(data_ocorrencia DESC);

-- Documentos
CREATE INDEX IF NOT EXISTS idx_docs_tenant ON documentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_docs_validade ON documentos(validade);

-- Notificações
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificacoes(usuario_id, lida, criado_em DESC);

-- Assinaturas
CREATE INDEX IF NOT EXISTS idx_assin_gateway ON assinaturas(gateway_sub_id);
