import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/erros'
import { useAuthStore } from '@/store/authStore'

export interface Documento {
  id: string
  nome: string
  tipo: string
  descricao?: string
  arquivo_url: string
  validade?: string
  acidente_id?: string
  criado_em: string
}

export function useDocumentos() {
  return useQuery({
    queryKey: ['documentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data as Documento[]
    },
  })
}

export function useUploadDocumento() {
  const qc = useQueryClient()
  const { perfil } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      arquivo, nome, tipo, descricao, validade,
    }: {
      arquivo: File; nome: string; tipo: string; descricao?: string; validade?: string
    }) => {
      if (!perfil?.tenant_id) {
        throw new Error('Tenant não encontrado. Faça login novamente.')
      }

      const path = `documentos/${Date.now()}_${arquivo.name}` // Subpasta para organização
      const { data: uploaded, error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(path, arquivo)
      if (uploadError) throw uploadError

      // Salva apenas o path (bucket privado)
      const { error } = await supabase.from('documentos').insert({
        nome,
        tipo,
        descricao: descricao || undefined,
        validade: validade || undefined,
        arquivo_url: uploaded.path, // Salva o path, não a URL
        tenant_id: perfil.tenant_id,
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documentos'] }); toast.success('Documento enviado') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}

export function useExcluirDocumento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documentos'] }); toast.success('Documento excluído') },
    onError: (err) => toast.error(traduzirErro(err)),
  })
}
