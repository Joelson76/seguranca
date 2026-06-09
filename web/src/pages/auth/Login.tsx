import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [carregando, setCarregando] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setCarregando(true)
    try {
      await login(data.email, data.senha)
      navigate('/app/dashboard')
    } catch {
      toast.error('E-mail ou senha incorretos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary rounded-xl p-2.5">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SafeTrack</h1>
            <p className="text-xs text-muted-foreground">Gestão de Segurança do Trabalho</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na plataforma</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar a segurança da sua equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  {...register('senha')}
                />
                {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
                {carregando ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <a href="/recuperar-senha" className="text-muted-foreground hover:text-primary hover:underline">
                Esqueci minha senha
              </a>
              <a href="/" className="text-muted-foreground hover:text-primary hover:underline">
                Voltar ao site
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
