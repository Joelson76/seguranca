// Edge Function: Alertas de Acidentes
// Roda diariamente via cron para gerar notificações sobre CAT vencida, investigações atrasadas, ações vencidas

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Busca alertas usando a função SQL
    const { data: alertas, error: alertasError } = await supabase.rpc('gerar_alertas_acidentes')

    if (alertasError) throw alertasError

    if (!alertas || alertas.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum alerta para processar' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Agrupa alertas por tenant
    const alertasPorTenant = alertas.reduce((acc: any, alerta: any) => {
      // Busca o acidente para pegar o tenant_id
      if (!acc[alerta.acidente_id]) {
        acc[alerta.acidente_id] = []
      }
      acc[alerta.acidente_id].push(alerta)
      return acc
    }, {})

    // Para cada acidente com alerta, busca os usuários do tenant
    const notificacoesCriadas = []

    for (const acidenteId of Object.keys(alertasPorTenant)) {
      const alertasAcidente = alertasPorTenant[acidenteId]

      // Busca o acidente para pegar tenant_id
      const { data: acidente } = await supabase
        .from('acidentes')
        .select('tenant_id, funcionarios(nome)')
        .eq('id', acidenteId)
        .single()

      if (!acidente) continue

      // Busca usuários do tenant (apenas gestores e admins)
      const { data: perfis } = await supabase
        .from('perfis')
        .select('user_id')
        .eq('tenant_id', acidente.tenant_id)
        .in('tipo', ['admin', 'gestor'])

      if (!perfis || perfis.length === 0) continue

      // Cria notificação para cada alerta
      for (const alerta of alertasAcidente) {
        const titulo = alerta.tipo_alerta === 'cat_vencida'
          ? '⚠️ CAT Vencida'
          : alerta.tipo_alerta === 'investigacao_atrasada'
          ? '⏰ Investigação Atrasada'
          : '📋 Ação Corretiva Vencida'

        const mensagem = `${alerta.mensagem} - Acidente: ${(acidente.funcionarios as any)?.nome ?? 'Funcionário'}`

        for (const perfil of perfis) {
          const notificacao = {
            tenant_id: acidente.tenant_id,
            usuario_id: perfil.user_id,
            tipo: 'acidente_alerta',
            titulo,
            mensagem,
            link: `/app/acidentes/${acidenteId}`,
            lida: false,
            criado_em: new Date().toISOString(),
          }

          const { error: notifError } = await supabase.from('notificacoes').insert(notificacao)

          if (!notifError) {
            notificacoesCriadas.push(notificacao)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertas_processados: alertas.length,
        notificacoes_criadas: notificacoesCriadas.length,
        detalhes: alertas,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro ao processar alertas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
