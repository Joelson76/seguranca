import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Token de validação configurado no painel Asaas
const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

Deno.serve(async (req) => {
  // Valida token
  const token = req.headers.get('asaas-access-token')
  if (ASAAS_WEBHOOK_TOKEN && token !== ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await req.json()
  const { event, payment } = payload

  // Mapeia eventos Asaas para status da assinatura SafeTrack
  const statusMap: Record<string, string> = {
    'PAYMENT_CONFIRMED':     'ativa',
    'PAYMENT_RECEIVED':      'ativa',
    'PAYMENT_OVERDUE':       'inadimplente',
    'PAYMENT_DELETED':       'cancelada',
    'SUBSCRIPTION_CANCELED': 'cancelada',
  }

  const novoStatus = statusMap[event]
  if (!novoStatus) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // Busca assinatura pelo ID externo do Asaas
  const gatewaySubId = payment?.subscription ?? payment?.id
  if (!gatewaySubId) {
    return new Response(JSON.stringify({ ok: true, sem_sub: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, tenant_id')
    .eq('gateway_sub_id', gatewaySubId)
    .single()

  if (!assinatura) {
    return new Response(JSON.stringify({ ok: false, erro: 'Assinatura não encontrada' }), { status: 404 })
  }

  // Atualiza status
  const updates: Record<string, unknown> = {
    status: novoStatus,
    atualizado_em: new Date().toISOString(),
  }

  if (novoStatus === 'ativa' && payment?.dueDate) {
    // Próximo vencimento = 30 dias após pagamento
    const proximo = new Date(payment.dueDate)
    proximo.setMonth(proximo.getMonth() + 1)
    updates.data_proximo_pag = proximo.toISOString().split('T')[0]
  }

  await supabase.from('assinaturas').update(updates).eq('id', assinatura.id)

  // Cria notificação para o admin do tenant
  const { data: admin } = await supabase
    .from('usuarios')
    .select('id')
    .eq('tenant_id', assinatura.tenant_id)
    .eq('perfil', 'admin')
    .single()

  if (admin) {
    const mensagens: Record<string, string> = {
      ativa:        'Pagamento confirmado. Sua assinatura está ativa.',
      inadimplente: 'Pagamento em atraso. Regularize para não perder o acesso.',
      cancelada:    'Assinatura cancelada. Entre em contato para reativar.',
    }
    await supabase.from('notificacoes').insert({
      tenant_id: assinatura.tenant_id,
      usuario_id: admin.id,
      titulo: 'Atualização de assinatura',
      mensagem: mensagens[novoStatus] ?? `Status atualizado: ${novoStatus}`,
      tipo: 'assinatura',
    })
  }

  return new Response(
    JSON.stringify({ ok: true, status: novoStatus }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
