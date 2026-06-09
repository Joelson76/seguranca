import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addMonths } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/erros'
import { useAuthStore } from '@/store/authStore'

export interface Treinamento {
  id: string
  nome: string
  descricao?: string
  carga_horaria: number
  validade_meses: number
  norma_regulamentadora?: string
  ativo: boolean
}

export interface Participacao {
  id: string
  funcionario_id: string
  treinamento_id: string
  data_realizacao: string
  data_vencimento: string
  instrutor?: string
  local_realizacao?: string
  status: 'valido' | 'vencendo' | 'vencido' | 'pendente'
  certificado_url?: string
  funcionarios?: { nome: string; matricula: string } | null
  treinamentos?: { nome: string; norma_regulamentadora?: string } | null
}

export function useTreinamentos(apenasAtivos = true) {
  return useQuery({
    queryKey: ['treinamentos', apenasAtivos],
    queryFn: async () => {
      let query = supabase.from('treinamentos').select('*').order('nome')
      if (apenasAtivos) {
        query = query.eq('ativo', true)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Treinamento[]
    },
  })
}

export function useParticipacoes(pagina = 0, porPagina = 20) {
  return useQuery({
    queryKey: ['participacoes', pagina],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionario_treinamentos')
        .select('*, funcionarios(nome, matricula), treinamentos(nome, norma_regulamentadora)')
        .order('data_vencimento')
        .range(pagina * porPagina, (pagina + 1) * porPagina - 1)
      if (error) throw error
      return data as Participacao[]
    },
  })
}

export function useCriarTreinamento() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<Treinamento, 'id' | 'ativo'>) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }
      const { error } = await supabase.from('treinamentos').insert({
        ...dados,
        tenant_id: perfil.tenant_id,
        ativo: true
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treinamentos'] }); toast.success('Treinamento cadastrado') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useAtualizarTreinamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Treinamento) => {
      const { error } = await supabase.from('treinamentos').update(dados).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treinamentos'] }); toast.success('Treinamento atualizado') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useRegistrarParticipacao() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: {
      funcionario_id: string
      treinamento_id: string
      data_realizacao: string
      validade_meses: number
      instrutor?: string
      local_realizacao?: string
      certificado_url?: string
    }) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }
      const { validade_meses, ...rest } = dados
      const dataVenc = addMonths(new Date(dados.data_realizacao), validade_meses)
        .toISOString().split('T')[0]
      const { error } = await supabase.from('funcionario_treinamentos').insert({
        ...rest,
        tenant_id: perfil.tenant_id,
        data_vencimento: dataVenc,
        status: 'valido',
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['participacoes'] }); toast.success('Participação registrada') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useExcluirParticipacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionario_treinamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['participacoes'] }); toast.success('Participação excluída') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}
