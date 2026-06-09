import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

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

export interface FiltrosFuncionario {
  busca?: string
  setor?: string
  ativo?: boolean
}

export function useFuncionarios(filtros?: FiltrosFuncionario) {
  return useQuery({
    queryKey: ['funcionarios', filtros],
    queryFn: async () => {
      let query = supabase
        .from('funcionarios')
        .select('*')
        .order('nome')

      if (filtros?.ativo !== undefined) query = query.eq('ativo', filtros.ativo)
      else query = query.eq('ativo', true)

      if (filtros?.setor) query = query.eq('setor', filtros.setor)
      if (filtros?.busca) {
        query = query.or(
          `nome.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%,matricula.ilike.%${filtros.busca}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data as Funcionario[]
    },
  })
}

export function useFuncionario(id: string) {
  return useQuery({
    queryKey: ['funcionario', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Funcionario
    },
    enabled: !!id,
  })
}

export function useCriarFuncionario() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async (dados: Omit<Funcionario, 'id' | 'tenant_id' | 'criado_em' | 'atualizado_em'>) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }

      const dadosCompletos = {
        ...dados,
        tenant_id: perfil.tenant_id
      }

      const { data, error } = await supabase.from('funcionarios').insert(dadosCompletos).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário cadastrado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cadastrar funcionário')
    },
  })
}

export function useAtualizarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<Funcionario> & { id: string }) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .update({ ...dados, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['funcionarios'] })
      qc.invalidateQueries({ queryKey: ['funcionario', vars.id] })
      toast.success('Funcionário atualizado')
    },
    onError: () => toast.error('Erro ao atualizar funcionário'),
  })
}

export function useDesativarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios')
        .update({ ativo: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário desativado')
    },
    onError: () => toast.error('Erro ao desativar funcionário'),
  })
}
