import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // Valida sessão do usuário chamador
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  // Busca perfil do chamador
  const { data: chamador } = await supabase
    .from('usuarios')
    .select('tenant_id, perfil')
    .eq('id', user.id)
    .single()

  if (!chamador || !['admin', 'super_admin'].includes(chamador.perfil)) {
    return new Response('Forbidden', { status: 403 })
  }

  const { email, nome, perfil } = await req.json()
  if (!email || !nome || !perfil) {
    return new Response(JSON.stringify({ erro: 'email, nome e perfil são obrigatórios' }), { status: 400 })
  }

  // Cria o usuário via Admin API (envia e-mail de convite automaticamente)
  const { data: novoUser, error: createError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { nome, perfil, tenant_id: chamador.tenant_id },
    redirectTo: `${Deno.env.get('APP_URL') ?? 'https://app.safetrack.com.br'}/nova-senha`,
  })

  if (createError) {
    return new Response(JSON.stringify({ erro: createError.message }), { status: 400 })
  }

  // Cria o registro na tabela usuarios antecipadamente
  if (novoUser?.user) {
    await supabase.from('usuarios').insert({
      id: novoUser.user.id,
      tenant_id: chamador.tenant_id,
      nome,
      perfil,
      ativo: true,
    })
  }

  return new Response(
    JSON.stringify({ ok: true, mensagem: `Convite enviado para ${email}` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
