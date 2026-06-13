import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/erros'
import { useAuthStore } from '@/store/authStore'

export type StatusAcidente = 'aberto' | 'em_investigacao' | 'concluido' | 'arquivado'
export type TipoAcidente =
  | 'acidente_com_afastamento' | 'acidente_sem_afastamento'
  | 'acidente_de_trajeto' | 'quase_acidente' | 'incidente' | 'doenca_ocupacional'

export type StatusCAT = 'pendente' | 'enviada' | 'aceita' | 'rejeitada'
export type MetodoAnalise = '5_porques' | 'ishikawa' | 'arvore_causas' | 'outro'
export type CategoriaEvidencia = 'fotos_local' | 'laudos_medicos' | 'depoimentos' | 'analise_tecnica' | 'outros'
export type StatusAcaoCorretiva = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

export interface Acidente {
  id: string
  tenant_id: string
  funcionario_id?: string
  tipo: TipoAcidente
  data_ocorrencia: string
  hora_ocorrencia?: string
  local_ocorrencia: string
  descricao: string

  // Causas e análise
  causa_imediata?: string
  causa_basica?: string
  causa_raiz?: string
  metodo_analise?: MetodoAnalise
  analise_detalhada?: any // JSON para 5 porquês, ishikawa etc

  // Medidas e ações
  medidas_corretivas?: string
  dias_afastamento?: number
  parte_corpo_atingida?: string
  gravidade?: number // 1-5
  houve_afastamento?: boolean
  data_retorno?: string

  // CAT
  cat?: boolean
  numero_cat?: string
  data_emissao_cat?: string
  prazo_cat?: string
  status_cat?: StatusCAT
  observacoes_cat?: string

  // Investigação
  responsavel_investigacao?: string
  data_inicio_investigacao?: string
  data_conclusao_investigacao?: string
  prazo_conclusao_investigacao?: string

  // Status e audit
  status: StatusAcidente
  criado_por?: string
  criado_em: string
  atualizado_em?: string

  // Relations
  funcionarios?: { nome: string; cargo: string; setor: string } | null
}

export interface Testemunha {
  id: string
  acidente_id: string
  tenant_id: string
  funcionario_id?: string
  nome_testemunha: string
  depoimento?: string
  data_depoimento: string
  criado_em: string
  funcionarios?: { nome: string; cargo: string } | null
}

export interface AcaoCorretiva {
  id: string
  acidente_id: string
  tenant_id: string
  descricao: string
  tipo_acao?: string
  responsavel_id?: string
  responsavel_nome?: string
  prazo: string
  status: StatusAcaoCorretiva
  data_conclusao?: string
  evidencia_conclusao?: string
  observacoes?: string
  criado_em: string
  atualizado_em?: string
  funcionarios?: { nome: string } | null
}

export interface Checklist {
  id: string
  acidente_id: string
  tenant_id: string
  local_preservado: boolean
  fotos_realizadas: boolean
  testemunhas_ouvidas: boolean
  epi_analisado: boolean
  condicoes_ambiente_verificadas: boolean
  procedimentos_revisados: boolean
  treinamento_verificado: boolean
  equipamentos_inspecionados: boolean
  relatorio_elaborado: boolean
  acoes_imediatas_tomadas: boolean
  observacoes?: string
  preenchido_em: string
}

export interface IndicadorSESMT {
  mes: string
  total_acidentes: number
  acidentes_com_afastamento: number
  total_dias_perdidos: number
  total_funcionarios: number
  horas_homem_trabalhadas: number
  taxa_frequencia: number
  taxa_gravidade: number
  coeficiente_acidente_incapacitante: number
}

export interface Alerta {
  acidente_id: string
  tipo_alerta: string
  mensagem: string
  criticidade: string
}

// ========== ACIDENTES ==========
export function useAcidentes(pagina = 0, porPagina = 20) {
  return useQuery({
    queryKey: ['acidentes', pagina],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acidentes')
        .select('*, funcionarios(nome, cargo, setor)')
        .order('data_ocorrencia', { ascending: false })
        .range(pagina * porPagina, (pagina + 1) * porPagina - 1)
      if (error) throw error
      return data as Acidente[]
    },
  })
}

export function useAcidente(id: string) {
  return useQuery({
    queryKey: ['acidente', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acidentes')
        .select('*, funcionarios(nome, cargo, setor, cpf, matricula)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Acidente
    },
    enabled: !!id,
  })
}

export function useRegistrarAcidente() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<Acidente, 'id' | 'criado_em' | 'funcionarios'>) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }
      const { data, error } = await supabase.from('acidentes').insert({
        ...dados,
        tenant_id: perfil.tenant_id,
        status: 'aberto',
        data_inicio_investigacao: new Date().toISOString(),
      }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acidentes'] }); toast.success('Ocorrência registrada') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useAtualizarAcidente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<Acidente> }) => {
      const { error } = await supabase.from('acidentes').update(dados).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['acidentes'] })
      qc.invalidateQueries({ queryKey: ['acidente', vars.id] })
      toast.success('Acidente atualizado')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useAvancarStatus() {
  const qc = useQueryClient()
  const PROXIMO: Partial<Record<StatusAcidente, StatusAcidente>> = {
    aberto: 'em_investigacao',
    em_investigacao: 'concluido',
    concluido: 'arquivado',
  }
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAcidente }) => {
      const proximo = PROXIMO[status]
      if (!proximo) return
      const { error } = await supabase.from('acidentes').update({ status: proximo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acidentes'] }); toast.success('Status atualizado') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

// ========== TESTEMUNHAS ==========
export function useTestemunhas(acidenteId: string) {
  return useQuery({
    queryKey: ['testemunhas', acidenteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acidente_testemunhas')
        .select('*, funcionarios(nome, cargo)')
        .eq('acidente_id', acidenteId)
        .order('criado_em')
      if (error) throw error
      return data as Testemunha[]
    },
    enabled: !!acidenteId,
  })
}

export function useAdicionarTestemunha() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<Testemunha, 'id' | 'criado_em' | 'funcionarios'>) => {
      if (!perfil?.tenant_id) throw new Error('Tenant não encontrado')
      const { error } = await supabase.from('acidente_testemunhas').insert({ ...dados, tenant_id: perfil.tenant_id })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['testemunhas', vars.acidente_id] })
      toast.success('Testemunha adicionada')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useRemoverTestemunha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, acidenteId }: { id: string; acidenteId: string }) => {
      const { error } = await supabase.from('acidente_testemunhas').delete().eq('id', id)
      if (error) throw error
      return acidenteId
    },
    onSuccess: (acidenteId) => {
      qc.invalidateQueries({ queryKey: ['testemunhas', acidenteId] })
      toast.success('Testemunha removida')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

// ========== AÇÕES CORRETIVAS ==========
export function useAcoesCorretivas(acidenteId: string) {
  return useQuery({
    queryKey: ['acoes-corretivas', acidenteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acidente_acoes_corretivas')
        .select('*, funcionarios(nome)')
        .eq('acidente_id', acidenteId)
        .order('prazo')
      if (error) throw error
      return data as AcaoCorretiva[]
    },
    enabled: !!acidenteId,
  })
}

export function useAdicionarAcaoCorretiva() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<AcaoCorretiva, 'id' | 'criado_em' | 'atualizado_em' | 'funcionarios'>) => {
      if (!perfil?.tenant_id) throw new Error('Tenant não encontrado')
      const { error } = await supabase.from('acidente_acoes_corretivas').insert({ ...dados, tenant_id: perfil.tenant_id })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['acoes-corretivas', vars.acidente_id] })
      toast.success('Ação corretiva adicionada')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useAtualizarAcaoCorretiva() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, acidenteId, dados }: { id: string; acidenteId: string; dados: Partial<AcaoCorretiva> }) => {
      const { error } = await supabase.from('acidente_acoes_corretivas').update(dados).eq('id', id)
      if (error) throw error
      return acidenteId
    },
    onSuccess: (acidenteId) => {
      qc.invalidateQueries({ queryKey: ['acoes-corretivas', acidenteId] })
      toast.success('Ação atualizada')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useRemoverAcaoCorretiva() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, acidenteId }: { id: string; acidenteId: string }) => {
      const { error } = await supabase.from('acidente_acoes_corretivas').delete().eq('id', id)
      if (error) throw error
      return acidenteId
    },
    onSuccess: (acidenteId) => {
      qc.invalidateQueries({ queryKey: ['acoes-corretivas', acidenteId] })
      toast.success('Ação removida')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

// ========== CHECKLIST ==========
export function useChecklist(acidenteId: string) {
  return useQuery({
    queryKey: ['checklist', acidenteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acidente_checklist')
        .select('*')
        .eq('acidente_id', acidenteId)
        .maybeSingle()
      if (error) throw error
      return data as Checklist | null
    },
    enabled: !!acidenteId,
  })
}

export function useSalvarChecklist() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async ({ acidenteId, dados }: { acidenteId: string; dados: Partial<Checklist> }) => {
      if (!perfil?.tenant_id) throw new Error('Tenant não encontrado')

      // Verifica se já existe
      const { data: existe } = await supabase
        .from('acidente_checklist')
        .select('id')
        .eq('acidente_id', acidenteId)
        .maybeSingle()

      if (existe) {
        // Update
        const { error } = await supabase
          .from('acidente_checklist')
          .update(dados)
          .eq('acidente_id', acidenteId)
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('acidente_checklist')
          .insert({ ...dados, acidente_id: acidenteId, tenant_id: perfil.tenant_id })
        if (error) throw error
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['checklist', vars.acidenteId] })
      toast.success('Checklist salvo')
    },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

// ========== INDICADORES SESMT ==========
export function useIndicadoresSESMT(meses = 12) {
  return useQuery({
    queryKey: ['indicadores-sesmt', meses],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_indicadores_sesmt')
        .select('*')
        .order('mes', { ascending: false })
        .limit(meses)
      if (error) throw error
      return (data ?? []) as IndicadorSESMT[]
    },
  })
}

// ========== ALERTAS ==========
export function useAlertasAcidentes() {
  return useQuery({
    queryKey: ['alertas-acidentes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('gerar_alertas_acidentes')
      if (error) throw error
      return (data ?? []) as Alerta[]
    },
    refetchInterval: 300_000, // 5 minutos
  })
}

// ========== RECORRÊNCIA ==========
export function useRecorrenciaAcidentes() {
  return useQuery({
    queryKey: ['recorrencia-acidentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_acidentes_recorrencia')
        .select('*')
        .limit(20)
      if (error) throw error
      return data ?? []
    },
  })
}
