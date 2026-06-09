import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useRegistrarParticipacao, useTreinamentos } from '@/hooks/useTreinamentos'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const schema = z.object({
  funcionario_id: z.string().min(1, 'Selecione um funcionário'),
  treinamento_id: z.string().min(1, 'Selecione um treinamento'),
  data_realizacao: z.string().min(1, 'Data de realização é obrigatória'),
  instrutor: z.string().optional(),
  local_realizacao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  aberto: boolean
  onFechar: () => void
}

export default function ParticipacaoForm({ aberto, onFechar }: Props) {
  const [certificado, setCertificado] = useState<File | null>(null)
  const [uploadando, setUploadando] = useState(false)

  const registrar = useRegistrarParticipacao()
  const { data: treinamentos = [] } = useTreinamentos()

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('funcionarios')
        .select('id, nome, matricula')
        .eq('ativo', true)
        .order('nome')
      return data ?? []
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  const treinamentoSelecionado = watch('treinamento_id')
  const treinamento = treinamentos.find((t) => t.id === treinamentoSelecionado)

  async function onSubmit(data: FormData) {
    if (!treinamento) return

    let certificado_url: string | undefined

    // Upload do certificado (corrigido para evitar caminho duplicado)
    if (certificado) {
      setUploadando(true)
      try {
        const path = `${Date.now()}_${certificado.name}`
        const { data: upload } = await supabase.storage
          .from('certificados')
          .upload(path, certificado)

        if (upload) {
          const { data: urlData } = supabase.storage
            .from('certificados')
            .getPublicUrl(upload.path)
          certificado_url = urlData.publicUrl
        }
      } catch (error) {
        toast.error('Erro ao fazer upload do certificado')
        setUploadando(false)
        return
      }
      setUploadando(false)
    }

    await registrar.mutateAsync({
      ...data,
      validade_meses: treinamento.validade_meses,
      certificado_url,
    })

    onFechar()
    reset()
    setCertificado(null)
  }

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Participação em Treinamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="funcionario">Funcionário *</Label>
            <select
              id="funcionario"
              {...register('funcionario_id')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Selecione um funcionário...</option>
              {funcionarios.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.nome} — {f.matricula}
                </option>
              ))}
            </select>
            {errors.funcionario_id && (
              <p className="text-xs text-destructive">
                {errors.funcionario_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="treinamento">Treinamento *</Label>
            <select
              id="treinamento"
              {...register('treinamento_id')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Selecione um treinamento...</option>
              {treinamentos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.norma_regulamentadora && `(${t.norma_regulamentadora})`}
                </option>
              ))}
            </select>
            {errors.treinamento_id && (
              <p className="text-xs text-destructive">
                {errors.treinamento_id.message}
              </p>
            )}
            {treinamento && (
              <p className="text-xs text-muted-foreground">
                Carga horária: {treinamento.carga_horaria}h • Validade: {treinamento.validade_meses} meses
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data de Realização *</Label>
            <Input id="data" type="date" {...register('data_realizacao')} />
            {errors.data_realizacao && (
              <p className="text-xs text-destructive">
                {errors.data_realizacao.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrutor">Instrutor</Label>
              <Input
                id="instrutor"
                {...register('instrutor')}
                placeholder="Nome do instrutor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                {...register('local_realizacao')}
                placeholder="Local do treinamento"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificado">Certificado (PDF ou imagem)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="certificado"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCertificado(e.target.files?.[0] ?? null)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
              {certificado && (
                <Upload className="h-4 w-4 text-green-500 shrink-0" />
              )}
            </div>
            {certificado && (
              <p className="text-xs text-muted-foreground">
                {certificado.name} ({(certificado.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registrar.isPending || uploadando}
            >
              {uploadando
                ? 'Enviando certificado...'
                : registrar.isPending
                ? 'Registrando...'
                : 'Registrar Participação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
