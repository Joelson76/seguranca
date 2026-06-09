// Traduz mensagens de erro do Supabase/PostgreSQL para pt-BR
export function traduzirErro(erro: unknown): string {
  if (!erro) return 'Erro desconhecido'

  const msg = erro instanceof Error ? erro.message : String(erro)

  const mapa: Record<string, string> = {
    'duplicate key': 'Registro duplicado — verifique matrícula ou CPF',
    'violates unique constraint': 'Já existe um registro com esses dados',
    'violates foreign key constraint': 'Referência inválida — verifique os dados relacionados',
    'invalid input syntax': 'Formato de dados inválido',
    'not-null constraint': 'Campo obrigatório não preenchido',
    'permission denied': 'Sem permissão para esta ação',
    'JWT expired': 'Sessão expirada — faça login novamente',
    'Invalid login credentials': 'E-mail ou senha incorretos',
    'Email not confirmed': 'Confirme seu e-mail antes de continuar',
    'User not found': 'Usuário não encontrado',
    'new row violates row-level security': 'Sem permissão para criar este registro',
    'Network request failed': 'Sem conexão — verifique sua internet',
    'Failed to fetch': 'Sem conexão com o servidor',
    'timeout': 'Tempo de resposta esgotado — tente novamente',
    'storage/object-not-found': 'Arquivo não encontrado',
    'Payload too large': 'Arquivo muito grande',
  }

  for (const [chave, traduzido] of Object.entries(mapa)) {
    if (msg.toLowerCase().includes(chave.toLowerCase())) return traduzido
  }

  return msg
}
