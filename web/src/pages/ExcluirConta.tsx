import { useState } from 'react'
import { Trash2, AlertTriangle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function ExcluirConta() {
  const navigate = useNavigate()
  const [confirmacao, setConfirmacao] = useState('')
  const [confirmo1, setConfirmo1] = useState(false)
  const [confirmo2, setConfirmo2] = useState(false)
  const [confirmo3, setConfirmo3] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const podeExcluir = confirmacao === 'EXCLUIR' && confirmo1 && confirmo2 && confirmo3

  async function handleExcluir() {
    if (!podeExcluir) return

    try {
      setExcluindo(true)

      const { data, error } = await supabase.rpc('anonimizar_conta')

      if (error) throw error

      toast.success('Conta anonimizada com sucesso')

      // Fazer logout
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir conta: ' + error.message)
      setExcluindo(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-destructive">Excluir Conta</h1>
        <p className="text-muted-foreground mt-2">
          Direito ao esquecimento garantido pela LGPD (Art. 18).
        </p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="bg-destructive/10 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-destructive">⚠️ Ação Irreversível</CardTitle>
              <CardDescription className="mt-2">
                Esta ação não pode ser desfeita. Seus dados pessoais serão permanentemente anonimizados.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* O que acontece */}
          <div>
            <h3 className="font-semibold mb-3">O que acontecerá:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Seus dados pessoais (nome, email, CPF, telefone) serão anonimizados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Dados de funcionários serão anonimizados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Você será deslogado imediatamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Não será possível recuperar acesso a esta conta</span>
              </li>
            </ul>
          </div>

          {/* O que será mantido */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Registros mantidos para compliance:</p>
                <p className="text-muted-foreground">
                  Entregas de EPI, treinamentos, acidentes e documentos serão mantidos de forma anonimizada
                  para atender obrigações legais trabalhistas e de segurança (NR-6, NR-7, etc).
                </p>
              </div>
            </div>
          </div>

          {/* Confirmações */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold">Confirme que você entende:</h3>

            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm1"
                checked={confirmo1}
                onCheckedChange={(checked) => setConfirmo1(checked === true)}
              />
              <label htmlFor="confirm1" className="text-sm cursor-pointer leading-tight">
                Eu entendo que esta ação é irreversível e não poderei recuperar minha conta
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm2"
                checked={confirmo2}
                onCheckedChange={(checked) => setConfirmo2(checked === true)}
              />
              <label htmlFor="confirm2" className="text-sm cursor-pointer leading-tight">
                Eu exportei meus dados (se necessário) antes de prosseguir
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm3"
                checked={confirmo3}
                onCheckedChange={(checked) => setConfirmo3(checked === true)}
              />
              <label htmlFor="confirm3" className="text-sm cursor-pointer leading-tight">
                Eu confirmo que quero excluir permanentemente esta conta
              </label>
            </div>
          </div>

          {/* Input de confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmacao">
              Digite <span className="font-mono font-bold">EXCLUIR</span> para confirmar
            </Label>
            <Input
              id="confirmacao"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="font-mono"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/app/configuracoes')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluir}
              disabled={!podeExcluir || excluindo}
              className="flex-1"
            >
              {excluindo ? (
                <>Excluindo...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Conta
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
