import { useState } from 'react'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDocumentos } from '@/hooks/useDocumentos'
import { differenceInDays } from 'date-fns'
import DocumentoUpload from './DocumentoUpload'
import DocumentosList from './DocumentosList'

export default function DocumentosHub() {
  const [modalUpload, setModalUpload] = useState(false)
  const [mostrarLista, setMostrarLista] = useState(false)

  const { data: documentos = [] } = useDocumentos()

  const hoje = new Date()
  const vencendoEm60 = documentos.filter((doc) => {
    if (!doc.validade) return false
    const diff = differenceInDays(new Date(doc.validade), hoje)
    return diff > 0 && diff <= 60
  }).length

  const vencidos = documentos.filter((doc) => {
    if (!doc.validade) return false
    const diff = differenceInDays(new Date(doc.validade), hoje)
    return diff < 0
  }).length

  const porTipo = documentos.reduce((acc, doc) => {
    acc[doc.tipo] = (acc[doc.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (mostrarLista) {
    return <DocumentosList />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos SST</h1>
          <p className="text-muted-foreground">
            Repositório de documentos de segurança do trabalho
          </p>
        </div>
        <Button onClick={() => setModalUpload(true)}>
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Documentos
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documentos armazenados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vencendo em 60 dias
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vencendoEm60}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vencidos
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {vencidos > 0 ? 'Atualização necessária' : 'Tudo em dia'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(porTipo).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum documento cadastrado
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(porTipo).map(([tipo, count]) => (
                <div
                  key={tipo}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <span className="text-sm font-medium">{tipo}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setMostrarLista(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Todos os Documentos
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setModalUpload(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Novo Documento
          </Button>
        </CardContent>
      </Card>

      <DocumentoUpload
        aberto={modalUpload}
        onFechar={() => setModalUpload(false)}
      />
    </div>
  )
}
