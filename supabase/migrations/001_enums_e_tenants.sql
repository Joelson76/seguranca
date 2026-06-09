-- ============================================================
-- SafeTrack — Migration 001: Enums e Tabela de Tenants
-- Rodar no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE TYPE plano AS ENUM ('basico', 'profissional', 'enterprise');
CREATE TYPE perfil_usuario AS ENUM ('super_admin', 'admin', 'tecnico_sst', 'operador', 'visualizador');
CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste', 'devolucao', 'descarte');
CREATE TYPE status_treinamento AS ENUM ('valido', 'vencendo', 'vencido', 'pendente');
CREATE TYPE tipo_acidente AS ENUM (
  'acidente_com_afastamento', 'acidente_sem_afastamento',
  'acidente_de_trajeto', 'quase_acidente', 'incidente', 'doenca_ocupacional'
);
CREATE TYPE status_acidente AS ENUM ('aberto', 'em_investigacao', 'concluido', 'arquivado');
CREATE TYPE status_assinatura AS ENUM ('trial', 'ativa', 'inadimplente', 'cancelada', 'suspensa');

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  cnpj          TEXT UNIQUE NOT NULL,
  plano         plano DEFAULT 'basico',
  ativo         BOOLEAN DEFAULT true,
  logo_url      TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
