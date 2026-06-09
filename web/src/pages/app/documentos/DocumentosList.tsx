import { useState } from 'react'
import { Plus, FileText, Download, Trash2, Eye, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDocumentos, useExcluirDocumento, type Documento } from '@/hooks/useDocumentos'
import { formatDate } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import DocumentoUpload from './DocumentoUpload'

const TIPOS_DOCUMENTO = ['Todos', 'PCMSO', 'PGR', 'PPRA', 'LTCAT', 'NR', 'Outros']

export default function DocumentosList() {
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Documento | null>(null)
  const [tipoFiltro, setTipoFiltro] = useState('Todos')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { data: documentos = [], isLoading } = useDocumentos()
  const excluir = useExcluirDocumento()

  const documentosFiltrados = documentos.filter((doc) =>
    tipoFiltro === 'Todos' ? true : doc.tipo === tipoFiltro
  )

  function getBadgeValidade(validade?: string) {
    if (!validade) return null

    const hoje = new Date()
    const dataValidade = new Date(validade)
    const diasRestantes = differenceInDays(dataValidade, hoje)

    if (diasRestantes < 0) {
      return <Badge variant="danger">Vencido há {Math.abs(diasRestantes)} dia(s)</Badge>
    }
    if (diasRestantes <= 60) {
      return <Badge variant="warning">Vence em {diasRestantes} dia(s)</Badge>
    }
    return <Badge variant="success">Válido até {formatDate(validade)}</Badge>
  }

  async function abrirPreview(doc: Documento) {
    if (doc.arquivo_url.toLowerCase().endsWith('.pdf')) {
      // Para PDFs privados, precisamos de URL assinada
      setPreviewUrl(doc.arquivo_url)
    } else {
      window.open(doc.arquivo_url, '_blank')
    }
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
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tipo:</span>
            {TIPOS_DOCUMENTO.map((tipo) => (
              <Button
                key={tipo}
                variant={tipoFiltro === tipo ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoFiltro(tipo)}
              >
                {tipo}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading
              ? 'Carregando...'
              : `${documentosFiltrados.length} documento(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : documentosFiltrados.length === 0 ? (
            <EmptyState
              icon={FileText}
              titulo={
                tipoFiltro === 'Todos'
                  ? 'Nenhum documento cadastrado'
                  : `Nenhum documento do tipo ${tipoFiltro}`
              }
              descricao="Adicione PCMSO, PGR, PPRA e demais documentos SST"
              acao={
                <Button onClick={() => setModalAberto(true)}>
                  <Plus className="h-4 w-4" />
                  Adicionar documento
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentosFiltrados.map((doc) => (
                <Card
                  key={doc.id}
                  className="border shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2 shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.nome}</p>
                        <Badge variant="outline" className="mt-1">
                          {doc.tipo}
                        </Badge>
                        {doc.descricao && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {doc.descricao}
                          </p>
                        )}
                        <div className="flex flex-col gap-1 mt-3">
                          <span className="text-xs text-muted-foreground">
                            Criado em {formatDate(doc.criado_em)}
                          </span>
                          {getBadgeValidade(doc.validade)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => abrirPreview(doc)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(doc.arquivo_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmExcluir(doc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de upload */}
      <DocumentoUpload
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      />

      {/* Preview de PDF */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Preview do Documento</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewUrl(null)}
              >
                Fechar
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={!!confirmExcluir}
        titulo={`Excluir "${confirmExcluir?.nome}"?`}
        descricao="Esta ação não pode ser desfeita. O arquivo será removido permanentemente."
        textoBotao="Excluir"
        onConfirmar={async () => {
          if (!confirmExcluir) return
          await excluir.mutateAsync(confirmExcluir.id)
          setConfirmExcluir(null)
        }}
        onCancelar={() => setConfirmExcluir(null)}
        carregando={excluir.isPending}
      />
    </div>
  )
}
