import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

const schema = z.object({ email: z.string().email('E-mail inválido') })
type FormData = z.infer<typeof schema>

export default function RecuperarSenha() {
  const navigate = useNavigate()
  const [enviado, setEnviado] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit({ email }: FormData) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    if (error) { toast.error('Erro ao enviar e-mail'); return }
    setEnviado(true)
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
          {!enviado ? (
            <>
              <CardHeader>
                <CardTitle>Recuperar senha</CardTitle>
                <CardDescription>Enviaremos um link de redefinição para o seu e-mail</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input type="email" placeholder="voce@empresa.com" {...register('email')} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enviar link de recuperação
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                    <ArrowLeft className="h-4 w-4" /> Voltar ao login
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-8 pb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">E-mail enviado!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                <ArrowLeft className="h-4 w-4" /> Voltar ao login
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
