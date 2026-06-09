import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useUploadDocumento } from '@/hooks/useDocumentos'

const TIPOS_DOCUMENTO = ['PCMSO', 'PGR', 'PPRA', 'LTCAT', 'NR', 'APR', 'Procedimento', 'Certificado', 'Outro']

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  descricao: z.string().optional(),
  validade: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  aberto: boolean
  onFechar: () => void
}

export default function DocumentoUpload({ aberto, onFechar }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null)

  const upload = useUploadDocumento()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    if (!arquivo) return

    await upload.mutateAsync({
      arquivo,
      ...data,
    })

    onFechar()
    reset()
    setArquivo(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho máximo (50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 50MB.')
        return
      }
      setArquivo(file)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload de Documento SST</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Documento *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: PCMSO 2024"
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Documento *</Label>
            <select
              id="tipo"
              {...register('tipo')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Selecione...</option>
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="text-xs text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validade">Data de Validade (opcional)</Label>
            <Input id="validade" type="date" {...register('validade')} />
            <p className="text-xs text-muted-foreground">
              Deixe em branco se o documento não tiver validade
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Observações sobre o documento"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo *</Label>
            <div className="border-2 border-dashed border-input rounded-lg p-6">
              {!arquivo ? (
                <label
                  htmlFor="arquivo"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, Excel ou imagem — máx. 50 MB
                  </p>
                  <input
                    type="file"
                    id="arquivo"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2">
                      <File className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{arquivo.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(arquivo.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setArquivo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!arquivo || upload.isPending}>
              {upload.isPending ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
