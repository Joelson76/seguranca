import { useState } from 'react'
import { Plus, FileText, Download, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SkeletonCard } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDocumentos, useUploadDocumento, useExcluirDocumento, type Documento } from '@/hooks/useDocumentos'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const TIPOS_DOC = ['PCMSO', 'PGR', 'PPRA', 'LTCAT', 'APR', 'Procedimento', 'Certificado', 'Outro']

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  tipo: z.string().min(1, 'Tipo obrigatório'),
  descricao: z.string().optional(),
  validade: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function vencimentoBadge(validade?: string) {
  if (!validade) return null
  const diff = Math.ceil((new Date(validade).getTime() - Date.now()) / 86400000)
  if (diff < 0) return <Badge variant="danger">Vencido</Badge>
  if (diff <= 30) return <Badge variant="warning">Vence em {diff}d</Badge>
  return <Badge variant="success">Válido até {formatDate(validade)}</Badge>
}

export default function Documentos() {
  const [modalAberto, setModalAberto] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<Documento | null>(null)

  const { data: documentos = [], isLoading } = useDocumentos()
  const upload = useUploadDocumento()
  const excluir = useExcluirDocumento()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  async function abrirDocumento(path: string) {
    // Gera URL assinada válida por 1 hora (bucket privado)
    const { data, error } = await supabase.storage
      .from('documentos')
      .createSignedUrl(path, 3600)

    if (error || !data) {
      toast.error('Erro ao abrir documento')
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function onSubmit(data: FormData) {
    if (!arquivo) return
    await upload.mutateAsync({ arquivo, ...data })
    setModalAberto(false)
    reset()
    setArquivo(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos SST</h1>
          <p className="text-muted-foreground">Repositório de documentos de segurança</p>
        </div>
        <Button onClick={() => { setModalAberto(true); reset(); setArquivo(null) }}>
          <Plus className="h-4 w-4" /> Novo Documento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Carregando...' : `${documentos.length} documento(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : documentos.length === 0 ? (
            <EmptyState
              icon={FileText}
              titulo="Nenhum documento cadastrado"
              descricao="Adicione PCMSO, PGR, PPRA e demais documentos SST"
              acao={
                <Button onClick={() => setModalAberto(true)}>
                  <Plus className="h-4 w-4" /> Adicionar documento
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentos.map((doc) => (
                <Card key={doc.id} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2 shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                        {doc.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{doc.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{formatDate(doc.criado_em)}</span>
                          {vencimentoBadge(doc.validade)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline" size="sm" className="flex-1"
                        onClick={() => abrirDocumento(doc.arquivo_url)}
                      >
                        <Download className="h-3 w-3 mr-1" /> Baixar
                      </Button>
                      <Button
                        variant="ghost" size="icon"
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

      {/* Modal upload */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do documento</Label>
              <Input {...register('nome')} placeholder="PCMSO 2024" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select {...register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Selecione...</option>
                {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Validade (opcional)</Label>
              <Input type="date" {...register('validade')} />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input {...register('descricao')} placeholder="Observações" />
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                onChange={e => setArquivo(e.target.files?.[0] ?? null)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
              {!arquivo && <p className="text-xs text-muted-foreground">PDF, Word, Excel ou imagem — máx. 50 MB</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={!arquivo || upload.isPending}>
                {upload.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
