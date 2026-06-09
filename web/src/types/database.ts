// Tipos do banco de dados Supabase

export type Plano = 'basico' | 'profissional' | 'enterprise'
export type PerfilUsuario = 'super_admin' | 'admin' | 'tecnico_sst' | 'operador' | 'visualizador'
export type TipoMovimento = 'entrada' | 'saida' | 'ajuste' | 'devolucao' | 'descarte'
export type StatusTreinamento = 'valido' | 'vencendo' | 'vencido' | 'pendente'
export type TipoAcidente =
  | 'acidente_com_afastamento'
  | 'acidente_sem_afastamento'
  | 'acidente_de_trajeto'
  | 'quase_acidente'
  | 'incidente'
  | 'doenca_ocupacional'
export type StatusAcidente = 'aberto' | 'em_investigacao' | 'concluido' | 'arquivado'
export type StatusAssinatura = 'trial' | 'ativa' | 'inadimplente' | 'cancelada' | 'suspensa'

export interface Tenant {
  id: string
  nome: string
  cnpj: string
  plano: Plano
  ativo: boolean
  logo_url?: string
  criado_em: string
  atualizado_em: string
}

export interface Usuario {
  id: string
  tenant_id: string
  nome: string
  perfil: PerfilUsuario
  ativo: boolean
  ultimo_acesso?: string
  criado_em: string
}

export interface Funcionario {
  id: string
  tenant_id: string
  matricula: string
  nome: string
  cpf: string
  cargo: string
  setor: string
  data_admissao: string
  ativo: boolean
  foto_url?: string
  assinatura_url?: string
  criado_em: string
  atualizado_em: string
}

export interface CategoriaEpi {
  id: string
  tenant_id: string
  nome: string
  descricao?: string
  ca_obrigatorio: boolean
}

export interface Epi {
  id: string
  tenant_id: string
  categoria_id: string
  nome: string
  ca?: string
  descricao?: string
  validade_ca?: string
  estoque_minimo: number
  criado_em: string
}

export interface MovimentoEstoque {
  id: string
  tenant_id: string
  epi_id: string
  tipo: TipoMovimento
  quantidade: number
  motivo?: string
  usuario_id: string
  data: string
}

export interface EntregaEpi {
  id: string
  tenant_id: string
  funcionario_id: string
  epi_id: string
  quantidade: number
  data_entrega: string
  data_validade?: string
  assinatura_url?: string
  observacoes?: string
  usuario_id: string
}

export interface Treinamento {
  id: string
  tenant_id: string
  nome: string
  descricao?: string
  carga_horaria: number
  validade_meses?: number
  obrigatorio: boolean
  criado_em: string
}

export interface ParticipacaoTreinamento {
  id: string
  tenant_id: string
  treinamento_id: string
  funcionario_id: string
  data_realizacao: string
  data_validade?: string
  certificado_url?: string
  instrutor?: string
  observacoes?: string
  usuario_id: string
}

export interface Acidente {
  id: string
  tenant_id: string
  funcionario_id?: string
  tipo: TipoAcidente
  data_ocorrencia: string
  local: string
  descricao: string
  causas?: string
  acoes_corretivas?: string
  status: StatusAcidente
  dias_afastamento?: number
  comunicado_inss: boolean
  usuario_id: string
  criado_em: string
  atualizado_em: string
}

export interface Documento {
  id: string
  tenant_id: string
  titulo: string
  descricao?: string
  categoria: string
  arquivo_url: string
  data_upload: string
  data_validade?: string
  usuario_id: string
}

export interface Assinatura {
  id: string
  tenant_id: string
  status: StatusAssinatura
  plano: Plano
  valor_mensal: number
  data_inicio: string
  data_fim?: string
  stripe_subscription_id?: string
  ultimo_pagamento?: string
  proximo_vencimento?: string
}

export interface Notificacao {
  id: string
  tenant_id: string
  usuario_id?: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  data: string
}
