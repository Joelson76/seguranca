import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'alertas@safetrack.com.br'

async function enviarEmail(para: string, assunto: string, html: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [para], subject: assunto, html }),
  })
}

function htmlAlerta(itens: string[], titulo: string) {
  const lista = itens.map(i => `<li style="margin:4px 0">${i}</li>`).join('')
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1d4ed8;color:#fff;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">🛡️ SafeTrack — Alerta SST</h2>
      </div>
      <div style="padding:20px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
        <h3 style="color:#374151">${titulo}</h3>
        <ul style="color:#6b7280;padding-left:20px">${lista}</ul>
        <hr style="border:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#9ca3af;font-size:12px">
          Acesse o SafeTrack para mais detalhes:
          <a href="${Deno.env.get('APP_URL') ?? 'https://app.safetrack.com.br'}">app.safetrack.com.br</a>
        </p>
      </div>
    </div>
  `
}

Deno.serve(async () => {
  const hoje = new Date()
  const em30dias = new Date(hoje)
  em30dias.setDate(hoje.getDate() + 30)

  // 1. EPIs com estoque crítico
  const { data: todosEpis } = await supabase.from('epis').select('id, nome, estoque_atual, estoque_minimo, tenant_id').eq('ativo', true)
  const episCriticos = (todosEpis ?? []).filter(
    (e: any) => e.estoque_atual <= e.estoque_minimo
  )

  // 2. Treinamentos vencendo em 30 dias
  const { data: treinamentosVencendo } = await supabase
    .from('funcionario_treinamentos')
    .select('id, data_vencimento, funcionarios(nome, tenant_id), treinamentos(nome)')
    .lte('data_vencimento', em30dias.toISOString().split('T')[0])
    .gte('data_vencimento', hoje.toISOString().split('T')[0])
    .eq('status', 'valido')

  // 3. Documentos vencendo em 30 dias
  const { data: documentosVencendo } = await supabase
    .from('documentos')
    .select('id, nome, validade, tenant_id')
    .lte('validade', em30dias.toISOString().split('T')[0])
    .gte('validade', hoje.toISOString().split('T')[0])

  // Admins de cada tenant
  const { data: admins } = await supabase
    .from('usuarios')
    .select('id, tenant_id, nome')
    .in('perfil', ['admin', 'tecnico_sst'])
    .eq('ativo', true)

  // Emails dos admins via auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const emailPorId: Record<string, string> = {}
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailPorId[u.id] = u.email
  }

  const notificacoes: any[] = []
  // Agrupar por tenant para enviar um email consolidado por admin
  const alertasPorTenant: Record<string, { epis: string[]; treinamentos: string[]; documentos: string[] }> = {}

  for (const epi of episCriticos as any[]) {
    if (!alertasPorTenant[epi.tenant_id]) alertasPorTenant[epi.tenant_id] = { epis: [], treinamentos: [], documentos: [] }
    alertasPorTenant[epi.tenant_id].epis.push(`${epi.nome}: ${epi.estoque_atual} un. (mín: ${epi.estoque_minimo})`)
  }

  for (const t of treinamentosVencendo ?? [] as any[]) {
    const func = t.funcionarios as any
    if (!func?.tenant_id) continue
    if (!alertasPorTenant[func.tenant_id]) alertasPorTenant[func.tenant_id] = { epis: [], treinamentos: [], documentos: [] }
    alertasPorTenant[func.tenant_id].treinamentos.push(
      `${func.nome} — ${(t.treinamentos as any)?.nome} (vence ${t.data_vencimento})`
    )
  }

  for (const doc of documentosVencendo ?? [] as any[]) {
    if (!alertasPorTenant[doc.tenant_id]) alertasPorTenant[doc.tenant_id] = { epis: [], treinamentos: [], documentos: [] }
    alertasPorTenant[doc.tenant_id].documentos.push(`${doc.nome} (vence ${doc.validade})`)
  }

  // Criar notificações e enviar emails
  for (const [tenantId, alertas] of Object.entries(alertasPorTenant)) {
    const adminsDoTenant = (admins ?? []).filter((a: any) => a.tenant_id === tenantId)

    for (const admin of adminsDoTenant as any[]) {
      // Criar notificações in-app
      if (alertas.epis.length > 0) {
        notificacoes.push({ tenant_id: tenantId, usuario_id: admin.id, titulo: 'EPIs com estoque crítico', mensagem: alertas.epis.join('; '), tipo: 'estoque' })
      }
      if (alertas.treinamentos.length > 0) {
        notificacoes.push({ tenant_id: tenantId, usuario_id: admin.id, titulo: 'Treinamentos vencendo', mensagem: alertas.treinamentos.join('; '), tipo: 'treinamento' })
      }
      if (alertas.documentos.length > 0) {
        notificacoes.push({ tenant_id: tenantId, usuario_id: admin.id, titulo: 'Documentos vencendo', mensagem: alertas.documentos.join('; '), tipo: 'documento' })
      }

      // Enviar email consolidado
      const email = emailPorId[admin.id]
      if (email) {
        const itensEmail: string[] = [
          ...alertas.epis.map(i => `🔴 <strong>Estoque crítico:</strong> ${i}`),
          ...alertas.treinamentos.map(i => `🟡 <strong>Treinamento:</strong> ${i}`),
          ...alertas.documentos.map(i => `🟠 <strong>Documento:</strong> ${i}`),
        ]
        if (itensEmail.length > 0) {
          await enviarEmail(
            email,
            `SafeTrack — ${itensEmail.length} alerta(s) SST para sua atenção`,
            htmlAlerta(itensEmail, `Olá, ${admin.nome}! Há itens que precisam de atenção:`)
          )
        }
      }
    }
  }

  if (notificacoes.length > 0) {
    await supabase.from('notificacoes').insert(notificacoes)
  }

  // Atualizar treinamentos vencidos
  await supabase
    .from('funcionario_treinamentos')
    .update({ status: 'vencido' })
    .lt('data_vencimento', hoje.toISOString().split('T')[0])
    .eq('status', 'valido')

  return new Response(
    JSON.stringify({
      ok: true,
      alertas: {
        epis_criticos: episCriticos.length,
        treinamentos_vencendo: (treinamentosVencendo ?? []).length,
        documentos_vencendo: (documentosVencendo ?? []).length,
        notificacoes_criadas: notificacoes.length,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
