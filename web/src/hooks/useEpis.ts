import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface EPI {
  id: string
  tenant_id: string
  nome: string
  ca: string
  validade_ca: string
  estoque_minimo: number
  quantidade_atual: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export function useEpis(busca?: string) {
  return useQuery({
    queryKey: ['epis', busca],
    queryFn: async () => {
      let query = supabase.from('epis').select('*').eq('ativo', true).order('nome')
      if (busca) query = query.ilike('nome', `%${busca}%`)
      const { data, error } = await query
      if (error) throw error
      return data as EPI[]
    },
  })
}

export function useCriarEPI() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<EPI, 'id' | 'tenant_id' | 'criado_em' | 'atualizado_em'>) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }

      const { data, error } = await supabase.from('epis').insert({
        ...dados,
        tenant_id: perfil.tenant_id
      }).select().single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epis'] })
      toast.success('EPI cadastrado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cadastrar EPI')
    },
  })
}

export function useAtualizarEPI() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<EPI> & { id: string }) => {
      const { data, error } = await supabase
        .from('epis')
        .update({ ...dados, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epis'] })
      toast.success('EPI atualizado')
    },
    onError: () => toast.error('Erro ao atualizar EPI'),
  })
}

export function useMovimentarEstoque() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: {
      epi_id: string
      tipo: 'entrada' | 'saida' | 'ajuste' | 'devolucao' | 'descarte'
      quantidade: number
      motivo?: string
    }) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }

      const { error: movError } = await supabase.from('movimentacoes_estoque').insert({
        ...dados,
        tenant_id: perfil.tenant_id
      })
      if (movError) throw movError

      const { data: epi } = await supabase
        .from('epis')
        .select('quantidade_atual')
        .eq('id', dados.epi_id)
        .single()

      if (epi) {
        const delta = ['entrada', 'devolucao'].includes(dados.tipo) ? dados.quantidade : -dados.quantidade
        await supabase
          .from('epis')
          .update({ quantidade_atual: Math.max(0, epi.quantidade_atual + delta) })
          .eq('id', dados.epi_id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epis'] })
      toast.success('Movimentação registrada')
    },
    onError: () => toast.error('Erro ao registrar movimentação'),
  })
}
