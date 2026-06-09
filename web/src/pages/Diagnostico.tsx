import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface DiagnosticoItem {
  nome: string
  status: 'ok' | 'erro' | 'verificando' | 'aviso'
  mensagem: string
}

export default function Diagnostico() {
  const { user, perfil } = useAuthStore()
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([])
  const [verificando, setVerificando] = useState(false)

  async function verificarSistema() {
    setVerificando(true)
    const resultados: DiagnosticoItem[] = []

    // 1. Verificar autenticação
    if (user) {
      resultados.push({
        nome: 'Autenticação',
        status: 'ok',
        mensagem: `Usuário logado: ${user.email}`
      })
    } else {
      resultados.push({
        nome: 'Autenticação',
        status: 'erro',
        mensagem: 'Usuário não está logado'
      })
    }

    // 2. Verificar perfil
    if (perfil) {
      resultados.push({
        nome: 'Perfil do Usuário',
        status: 'ok',
        mensagem: `Perfil: ${perfil.perfil} | Tenant ID: ${perfil.tenant_id}`
      })
    } else {
      resultados.push({
        nome: 'Perfil do Usuário',
        status: 'erro',
        mensagem: 'Perfil não encontrado na tabela usuarios'
      })
    }

    // 3. Verificar tabela tenants
    try {
      const { data: tenants, error } = await supabase.from('tenants').select('id, nome').limit(1)
      if (error) throw error
      resultados.push({
        nome: 'Tabela tenants',
        status: 'ok',
        mensagem: tenants && tenants.length > 0 ? `Empresa: ${tenants[0].nome}` : 'Tabela existe mas está vazia'
      })
    } catch (err: any) {
      resultados.push({
        nome: 'Tabela tenants',
        status: 'erro',
        mensagem: err.message || 'Tabela não existe ou RLS bloqueando'
      })
    }

    // 4. Verificar tabela usuarios
    try {
      const { data: usuarios, error } = await supabase.from('usuarios').select('id, nome').limit(1)
      if (error) throw error
      resultados.push({
        nome: 'Tabela usuarios',
        status: 'ok',
        mensagem: `${usuarios?.length || 0} usuário(s) encontrado(s)`
      })
    } catch (err: any) {
      resultados.push({
        nome: 'Tabela usuarios',
        status: 'erro',
        mensagem: err.message || 'Tabela não existe ou RLS bloqueando'
      })
    }

    // 5. Verificar tabela funcionarios
    try {
      const { data: funcionarios, error } = await supabase.from('funcionarios').select('id, nome').limit(1)
      if (error) throw error
      resultados.push({
        nome: 'Tabela funcionarios',
        status: 'ok',
        mensagem: `${funcionarios?.length || 0} funcionário(s) encontrado(s)`
      })
    } catch (err: any) {
      resultados.push({
        nome: 'Tabela funcionarios',
        status: 'erro',
        mensagem: err.message || 'Tabela não existe ou RLS bloqueando'
      })
    }

    // 6. Verificar tabela epis
    try {
      const { data: epis, error } = await supabase.from('epis').select('id, nome').limit(1)
      if (error) throw error
      resultados.push({
        nome: 'Tabela epis',
        status: 'ok',
        mensagem: `${epis?.length || 0} EPI(s) encontrado(s)`
      })
    } catch (err: any) {
      resultados.push({
        nome: 'Tabela epis',
        status: 'erro',
        mensagem: err.message || 'Tabela não existe ou RLS bloqueando'
      })
    }

    // 7. Verificar função get_my_tenant_id
    try {
      const { data, error } = await supabase.rpc('get_my_tenant_id')
      if (error) throw error
      if (data) {
        resultados.push({
          nome: 'Função get_my_tenant_id',
          status: 'ok',
          mensagem: `Retorna: ${data}`
        })
      } else {
        resultados.push({
          nome: 'Função get_my_tenant_id',
          status: 'aviso',
          mensagem: 'Função existe mas retorna null (usuário sem tenant)'
        })
      }
    } catch (err: any) {
      resultados.push({
        nome: 'Função get_my_tenant_id',
        status: 'erro',
        mensagem: err.message || 'Função não existe'
      })
    }

    setDiagnosticos(resultados)
    setVerificando(false)
  }

  useEffect(() => {
    verificarSistema()
  }, [])

  const icone = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'erro': return <XCircle className="h-5 w-5 text-red-500" />
      case 'aviso': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default: return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  const temErros = diagnosticos.some(d => d.status === 'erro')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Diagnóstico do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verificando a configuração do banco de dados e autenticação...
            </p>

            <div className="space-y-3">
              {diagnosticos.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="shrink-0 mt-0.5">{icone(item.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.nome}</p>
                    <p className="text-xs text-muted-foreground break-words">{item.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>

            {temErros && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  ❌ Problemas encontrados
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Você precisa executar o script SQL no Supabase Dashboard:
                </p>
                <ol className="text-sm text-red-700 dark:text-red-300 space-y-1 list-decimal list-inside">
                  <li>Abra: <a href="https://supabase.com/dashboard/project/fzgaercwkkxzkxendawm/sql/new" target="_blank" rel="noopener noreferrer" className="underline">SQL Editor</a></li>
                  <li>Cole o conteúdo de: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">SETUP_COMPLETO_DEFINITIVO.sql</code></li>
                  <li>Clique em RUN</li>
                  <li>Recarregue esta página</li>
                </ol>
              </div>
            )}

            {!temErros && diagnosticos.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ Tudo configurado corretamente!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  O sistema está pronto para uso. Você pode voltar para o dashboard.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={verificarSistema} disabled={verificando} className="flex-1">
                {verificando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verificar Novamente
              </Button>
              {!temErros && (
                <Button variant="outline" onClick={() => window.location.href = '/app/dashboard'}>
                  Ir para Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
