import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCriarTreinamento, useAtualizarTreinamento, type Treinamento } from '@/hooks/useTreinamentos'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  carga_horaria: z.coerce.number().min(1, 'Carga horária deve ser maior que zero'),
  validade_meses: z.coerce.number().min(1, 'Validade deve ser maior que zero'),
  norma_regulamentadora: z.string().optional(),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface Props {
  aberto: boolean
  onFechar: () => void
  treinamento?: Treinamento | null
}

export default function TreinamentoForm({ aberto, onFechar, treinamento }: Props) {
  const criar = useCriarTreinamento()
  const atualizar = useAtualizarTreinamento()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    if (treinamento) {
      reset({
        nome: treinamento.nome,
        descricao: treinamento.descricao || '',
        carga_horaria: treinamento.carga_horaria,
        validade_meses: treinamento.validade_meses,
        norma_regulamentadora: treinamento.norma_regulamentadora || '',
        ativo: treinamento.ativo,
      })
    } else {
      reset({
        nome: '',
        descricao: '',
        carga_horaria: 8,
        validade_meses: 12,
        norma_regulamentadora: '',
        ativo: true,
      })
    }
  }, [treinamento, reset])

  async function onSubmit(data: FormData) {
    if (treinamento) {
      await atualizar.mutateAsync({ id: treinamento.id, ...data })
    } else {
      await criar.mutateAsync(data)
    }
    onFechar()
    reset()
  }

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {treinamento ? 'Editar Treinamento' : 'Novo Treinamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Treinamento *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: NR-35 Trabalho em Altura"
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              {...register('descricao')}
              placeholder="Breve descrição do treinamento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nr">Norma Regulamentadora</Label>
              <Input
                id="nr"
                {...register('norma_regulamentadora')}
                placeholder="Ex: NR-35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carga">Carga Horária (horas) *</Label>
              <Input
                id="carga"
                type="number"
                min={1}
                {...register('carga_horaria')}
              />
              {errors.carga_horaria && (
                <p className="text-xs text-destructive">
                  {errors.carga_horaria.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validade">Validade (meses) *</Label>
            <Input
              id="validade"
              type="number"
              min={1}
              {...register('validade_meses')}
            />
            {errors.validade_meses && (
              <p className="text-xs text-destructive">
                {errors.validade_meses.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Período de validade do certificado após a conclusão
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              {...register('ativo')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="ativo" className="font-normal cursor-pointer">
              Treinamento ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criar.isPending || atualizar.isPending}
            >
              {criar.isPending || atualizar.isPending
                ? 'Salvando...'
                : treinamento
                ? 'Atualizar'
                : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
