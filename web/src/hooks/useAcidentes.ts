import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/erros'
import { useAuthStore } from '@/store/authStore'

export type StatusAcidente = 'aberto' | 'em_investigacao' | 'concluido' | 'arquivado'
export type TipoAcidente =
  | 'acidente_com_afastamento' | 'acidente_sem_afastamento'
  | 'acidente_de_trajeto' | 'quase_acidente' | 'incidente' | 'doenca_ocupacional'

export interface Acidente {
  id: string
  tenant_id: string
  funcionario_id?: string
  tipo: TipoAcidente
  data_ocorrencia: string
  hora_ocorrencia?: string
  local_ocorrencia: string
  local_acidente?: string
  descricao: string
  causa_imediata?: string
  causas?: string
  medidas_corretivas?: string
  acoes_corretivas?: string
  dias_afastamento?: number
  cat?: boolean
  status: StatusAcidente
  criado_em: string
  atualizado_em?: string
  funcionarios?: { nome: string; cargo: string; setor: string } | null
}

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

export function useRegistrarAcidente() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<Acidente, 'id' | 'criado_em' | 'funcionarios'>) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }
      const { error } = await supabase.from('acidentes').insert({
        ...dados,
        tenant_id: perfil.tenant_id,
        status: 'aberto'
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acidentes'] }); toast.success('Ocorrência registrada') },
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
