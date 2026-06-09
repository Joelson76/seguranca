import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2, CheckCircle } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  confirma: z.string(),
}).refine(d => d.senha === d.confirma, { message: 'As senhas não conferem', path: ['confirma'] })
type FormData = z.infer<typeof schema>

export default function NovaSenha() {
  const navigate = useNavigate()
  const [pronto, setPronto] = useState(false)

  // Supabase injeta a sessão automaticamente via hash na URL
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPronto(true)
    })
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit({ senha }: FormData) {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) { toast.error('Erro ao redefinir senha'); return }
    toast.success('Senha redefinida com sucesso!')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary rounded-xl p-2.5"><Shield className="h-7 w-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SafeTrack</h1>
            <p className="text-xs text-muted-foreground">Gestão de Segurança do Trabalho</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nova senha</CardTitle>
            <CardDescription>Digite a sua nova senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            {!pronto ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <Input type="password" placeholder="••••••••" {...register('senha')} />
                  {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Confirmar nova senha</Label>
                  <Input type="password" placeholder="••••••••" {...register('confirma')} />
                  {errors.confirma && <p className="text-xs text-destructive">{errors.confirma.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Salvar nova senha
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
