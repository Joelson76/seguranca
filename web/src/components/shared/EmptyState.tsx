import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  titulo: string
  descricao?: string
  acao?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, titulo, descricao, acao, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-4 text-center', className)}>
      <div className="bg-muted rounded-full p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{titulo}</p>
        {descricao && <p className="text-sm text-muted-foreground mt-1">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}
