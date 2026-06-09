import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  titulo: string
  valor: string | number
  icon: LucideIcon
  descricao?: string
  tendencia?: { valor: number; positivo: boolean }
  cor?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'orange'
  className?: string
}

const cores = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950',   icon: 'text-blue-600 dark:text-blue-400' },
  green:  { bg: 'bg-green-50 dark:bg-green-950',  icon: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950', icon: 'text-purple-600 dark:text-purple-400' },
  red:    { bg: 'bg-red-50 dark:bg-red-950',      icon: 'text-red-600 dark:text-red-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950', icon: 'text-yellow-600 dark:text-yellow-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950', icon: 'text-orange-600 dark:text-orange-400' },
}

export function StatCard({ titulo, valor, icon: Icon, descricao, cor = 'blue', className }: Props) {
  const { bg, icon } = cores[cor]
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={cn('rounded-xl p-3 shrink-0', bg)}>
          <Icon className={cn('h-6 w-6', icon)} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{valor}</p>
          <p className="text-sm font-medium text-foreground/80 truncate">{titulo}</p>
          {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
