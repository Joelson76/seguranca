import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  titulo: string
  descricao?: string
  textoBotao?: string
  variante?: 'destructive' | 'default'
  onConfirmar: () => void
  onCancelar: () => void
  carregando?: boolean
}

export function ConfirmDialog({
  open, titulo, descricao, textoBotao = 'Confirmar',
  variante = 'destructive', onConfirmar, onCancelar, carregando,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancelar()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variante === 'destructive' && (
              <div className="bg-red-100 dark:bg-red-950 rounded-full p-2 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            )}
            <DialogTitle>{titulo}</DialogTitle>
          </div>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} disabled={carregando}>Cancelar</Button>
          <Button
            variant={variante}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {textoBotao}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
