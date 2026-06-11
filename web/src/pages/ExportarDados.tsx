import { useState } from 'react'
import { Download, Shield, FileJson, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ExportarDados() {
  const [exportando, setExportando] = useState(false)

  async function handleExportar() {
    try {
      setExportando(true)

      const { data, error } = await supabase.rpc('exportar_dados_usuario')

      if (error) throw error

      // Converter para JSON e baixar
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-safetrack-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Dados exportados com sucesso!')
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar dados: ' + error.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Exportar Meus Dados</h1>
        <p className="text-muted-foreground mt-2">
          De acordo com a LGPD, você tem direito a obter uma cópia de todos os seus dados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Portabilidade de Dados (LGPD Art. 18)</CardTitle>
              <CardDescription className="mt-2">
                Você pode exportar todos os seus dados em formato JSON. Este arquivo incluirá:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <FileJson className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Dados da sua conta (nome, email, perfil)</span>
            </li>
            <li className="flex items-start gap-2">
              <FileJson className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Dados da empresa (nome, CNPJ, endereço)</span>
            </li>
            <li className="flex items-start gap-2">
              <FileJson className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Funcionários cadastrados</span>
            </li>
            <li className="flex items-start gap-2">
              <FileJson className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">EPIs, entregas, treinamentos e acidentes</span>
            </li>
          </ul>

          <div className="bg-muted p-4 rounded-lg flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Importante:</p>
              <p>
                O arquivo exportado contém dados sensíveis. Guarde-o em local seguro e não compartilhe
                com terceiros. Esta ação será registrada em nosso log de auditoria.
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportar}
            disabled={exportando}
            className="w-full sm:w-auto"
          >
            {exportando ? (
              <>Exportando...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Meus Dados
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
