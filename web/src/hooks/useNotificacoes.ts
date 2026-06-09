import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface Notificacao {
  id: string
  tenant_id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'alerta' | 'critico' | 'sucesso'
  lida: boolean
  criado_em: string
}

export function useNotificacoes() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Notificacao[]
    },
    enabled: !!user,
    refetchInterval: 60000, // Revalida a cada 60 segundos
  })

  const notificacoes = query.data ?? []
  const naoLidas = notificacoes.filter(n => !n.lida).length

  // Realtime — escuta inserções na tabela notificacoes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const nova = payload.new as Notificacao

          // Toast com tipo apropriado
          const tipoToast = {
            info: toast.info,
            alerta: toast.warning,
            critico: toast.error,
            sucesso: toast.success,
          }[nova.tipo] || toast.info

          tipoToast(nova.titulo, {
            description: nova.mensagem,
            duration: 5000
          })

          qc.invalidateQueries({ queryKey: ['notificacoes'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, qc])

  async function marcarLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
  }

  async function marcarTodasLidas() {
    if (!user) return
    const { error } = await supabase.rpc('marcar_todas_notificacoes_lidas')
    if (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao atualizar notificações')
      return
    }
    toast.success('Todas as notificações foram marcadas como lidas')
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
  }

  return { ...query, notificacoes, naoLidas, marcarLida, marcarTodasLidas }
}
