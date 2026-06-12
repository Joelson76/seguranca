import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface EntregaEPI {
  id: string
  tenant_id: string
  funcionario_id: string
  epi_id: string
  quantidade: number
  data_entrega: string
  data_vencimento?: string
  devolvido: boolean
  data_devolucao?: string
  assinatura_base64?: string
  assinatura_url?: string
  biometria_hash?: string
  biometria_tipo?: 'webauthn' | 'hardware' | 'assinatura'
  biometria_dispositivo?: string
  biometria_metadata?: any
  observacao?: string
  criado_em: string
  funcionarios?: { nome: string; matricula: string; cargo: string; setor: string } | null
  epis?: { nome: string; ca: string } | null
}

interface Filtros {
  funcionario_id?: string
  data_inicio?: string
  data_fim?: string
  pagina?: number
  por_pagina?: number
}

export function useEntregas(filtros: Filtros = {}) {
  const { funcionario_id, data_inicio, data_fim, pagina = 0, por_pagina = 20 } = filtros
  return useQuery({
    queryKey: ['entregas', filtros],
    queryFn: async () => {
      let q = supabase
        .from('entregas_epi')
        .select('*, funcionarios(nome, matricula, cargo, setor), epis(nome, ca)')
        .order('data_entrega', { ascending: false })
        .range(pagina * por_pagina, (pagina + 1) * por_pagina - 1)
      if (funcionario_id) q = q.eq('funcionario_id', funcionario_id)
      if (data_inicio) q = q.gte('data_entrega', data_inicio)
      if (data_fim) q = q.lte('data_entrega', data_fim + 'T23:59:59')
      const { data, error } = await q
      if (error) throw error
      return data as EntregaEPI[]
    },
  })
}

export function useRegistrarEntrega() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: {
      funcionario_id: string
      epi_id: string
      quantidade: number
      data_vencimento?: string
      observacao?: string
      assinatura_base64?: string
      biometria_hash?: string
      biometria_tipo?: 'webauthn' | 'hardware' | 'assinatura'
      biometria_dispositivo?: string
      biometria_metadata?: any
    }) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }

      const { error } = await supabase.from('entregas_epi').insert({
        funcionario_id: dados.funcionario_id,
        epi_id: dados.epi_id,
        quantidade: dados.quantidade,
        data_vencimento: dados.data_vencimento,
        observacao: dados.observacao,
        assinatura_url: dados.assinatura_base64,
        biometria_hash: dados.biometria_hash,
        biometria_tipo: dados.biometria_tipo,
        biometria_dispositivo: dados.biometria_dispositivo,
        biometria_metadata: dados.biometria_metadata,
        tenant_id: perfil.tenant_id,
        data_entrega: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
      // Debita do estoque
      const { data: epi } = await supabase.from('epis').select('quantidade_atual').eq('id', dados.epi_id).single()
      if (epi) {
        await supabase.from('epis').update({
          quantidade_atual: Math.max(0, epi.quantidade_atual - dados.quantidade),
        }).eq('id', dados.epi_id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entregas'] })
      qc.invalidateQueries({ queryKey: ['epis'] })
      toast.success('Entrega registrada com sucesso')
    },
    onError: () => toast.error('Erro ao registrar entrega'),
  })
}

export function useRegistrarDevolucao() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, epi_id, quantidade }: { id: string; epi_id: string; quantidade: number }) => {
      const { error } = await supabase.from('entregas_epi').update({
        devolvido: true,
        data_devolucao: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error

      // Recoloca no estoque
      const { data: epi } = await supabase.from('epis').select('quantidade_atual').eq('id', epi_id).single()
      if (epi) {
        await supabase.from('epis').update({
          quantidade_atual: epi.quantidade_atual + quantidade
        }).eq('id', epi_id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entregas'] })
      qc.invalidateQueries({ queryKey: ['epis'] })
      toast.success('Devolução registrada')
    },
    onError: () => toast.error('Erro ao registrar devolução'),
  })
}
