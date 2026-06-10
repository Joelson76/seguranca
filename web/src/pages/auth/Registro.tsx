import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  nome_empresa: z.string().min(2, 'Nome da empresa obrigatório'),
  cnpj: z.string().min(11, 'CNPJ deve ter pelo menos 11 caracteres'),
  nome_usuario: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function Registro() {
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    setSalvando(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: window.location.origin,
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Usuário não foi criado')

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          nome: data.nome_empresa,
          cnpj: data.cnpj,
          plano: 'profissional',
          ativo: true
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      const { error: perfilError } = await supabase
        .from('usuarios')
        .insert({
          user_id: authData.user.id,
          tenant_id: tenant.id,
          nome: data.nome_usuario,
          email: data.email,
          perfil: 'admin',
          ativo: true
        })

      if (perfilError) throw perfilError

      const { error: assinaturaError } = await supabase
        .from('assinaturas')
        .insert({
          tenant_id: tenant.id,
          plano: 'profissional',
          valor_mensal: 349,
          data_inicio: new Date().toISOString().split('T')[0],
          data_proximo_pag: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'trial',
        })

      if (assinaturaError) {
        console.error('Erro ao criar assinatura:', assinaturaError)
      }

      toast.success('Conta criada com sucesso! Redirecionando...')

      setTimeout(() => {
        navigate('/app/dashboard')
      }, 1000)

    } catch (err: any) {
      const msg = err.message || 'Erro ao criar conta'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary rounded-xl p-2.5">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SafeTrack</h1>
              <p className="text-xs text-muted-foreground">Gestão SST</p>
            </div>
          </div>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Comece seu teste grátis de 30 dias agora
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome da Empresa */}
            <div className="space-y-2">
              <Label htmlFor="nome_empresa">Nome da Empresa</Label>
              <Input
                id="nome_empresa"
                placeholder="Empresa Exemplo Ltda"
                {...register('nome_empresa')}
              />
              {errors.nome_empresa && (
                <p className="text-xs text-red-500">{errors.nome_empresa.message}</p>
              )}
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="12.345.678/0001-00"
                {...register('cnpj')}
              />
              {errors.cnpj && (
                <p className="text-xs text-red-500">{errors.cnpj.message}</p>
              )}
            </div>

            {/* Nome do Usuário */}
            <div className="space-y-2">
              <Label htmlFor="nome_usuario">Seu Nome Completo</Label>
              <Input
                id="nome_usuario"
                placeholder="João da Silva"
                {...register('nome_usuario')}
              />
              {errors.nome_usuario && (
                <p className="text-xs text-red-500">{errors.nome_usuario.message}</p>
              )}
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">Seu E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...register('senha')}
              />
              {errors.senha && (
                <p className="text-xs text-red-500">{errors.senha.message}</p>
              )}
            </div>

            {/* Botão */}
            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta Grátis'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <a href="/login" className="text-primary hover:underline">
                Fazer login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
