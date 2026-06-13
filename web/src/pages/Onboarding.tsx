import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Building2, CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  nome_empresa: z.string().min(2, 'Nome da empresa obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  nome_usuario: z.string().min(2, 'Seu nome é obrigatório'),
})
type FormData = z.infer<typeof schema>

const passos = [
  { numero: 1, titulo: 'Dados da empresa' },
  { numero: 2, titulo: 'Conclusão' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, setPerfil } = useAuthStore()
  const [passo, setPasso] = useState(1)
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    if (!user) return
    setSalvando(true)
    try {
      // Criar tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({ nome: data.nome_empresa, cnpj: data.cnpj, plano: 'basico' })
        .select()
        .single()
      if (tenantError) throw tenantError

      // Criar perfil do usuário como admin
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .insert({
          id: user.id,
          user_id: user.id,
          tenant_id: tenant.id,
          nome: data.nome_usuario,
          email: user.email || '',
          perfil: 'admin',
          ativo: true
        })
        .select()
        .single()
      if (perfilError) throw perfilError

      // Criar assinatura trial
      await supabase.from('assinaturas').insert({
        tenant_id: tenant.id,
        plano: 'basico',
        valor_mensal: 149,
        data_inicio: new Date().toISOString().split('T')[0],
        data_proximo_pag: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'trial',
      })

      setPerfil(perfil)
      setPasso(2)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao configurar empresa'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary rounded-xl p-2.5">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SafeTrack</h1>
            <p className="text-xs text-muted-foreground">Gestão de Segurança do Trabalho</p>
          </div>
        </div>

        {/* Indicador de passos */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {passos.map((p, i) => (
            <div key={p.numero} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  passo > p.numero ? 'bg-green-500 text-white' :
                  passo === p.numero ? 'bg-primary text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {passo > p.numero ? <CheckCircle className="h-4 w-4" /> : p.numero}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${passo === p.numero ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {p.titulo}
                </span>
              </div>
              {i < passos.length - 1 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {/* Passo 1 */}
        {passo === 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Configure sua empresa</h2>
                  <p className="text-sm text-muted-foreground">Essas informações aparecem nos relatórios e documentos</p>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da empresa</Label>
                  <Input {...register('nome_empresa')} placeholder="Metalúrgica Alfa Ltda" />
                  {errors.nome_empresa && <p className="text-xs text-destructive">{errors.nome_empresa.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input {...register('cnpj')} placeholder="00.000.000/0001-00" />
                  {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Seu nome completo</Label>
                  <Input {...register('nome_usuario')} placeholder="João da Silva" />
                  {errors.nome_usuario && <p className="text-xs text-destructive">{errors.nome_usuario.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={salvando}>
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {salvando ? 'Configurando...' : 'Continuar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Passo 2 — Conclusão */}
        {passo === 2 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Tudo pronto!</h2>
              <p className="text-muted-foreground mb-2">
                Sua empresa foi configurada com sucesso.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Você está no período de <strong>30 dias grátis</strong> do plano Básico.
              </p>
              <div className="bg-muted/40 rounded-lg p-4 mb-6 text-left space-y-2">
                <p className="text-sm font-medium">Próximos passos sugeridos:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Cadastre os funcionários da empresa</li>
                  <li>Adicione os EPIs ao catálogo</li>
                  <li>Registre os treinamentos realizados</li>
                  <li>Faça o upload dos documentos SST</li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => navigate('/app/dashboard')}>
                Acessar o dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
