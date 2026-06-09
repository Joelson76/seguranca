import { cn } from '@/lib/utils'

interface Coluna<T> {
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  mobileLabel?: string  // se omitido, usa header
  hideMobile?: boolean  // oculta no mobile
}

interface Props<T> {
  colunas: Coluna<T>[]
  dados: T[]
  keyExtractor: (row: T) => string
  acoes?: (row: T) => React.ReactNode
  vazio?: React.ReactNode
}

export function TabelaResponsiva<T>({ colunas, dados, keyExtractor, acoes, vazio }: Props<T>) {
  if (dados.length === 0 && vazio) return <>{vazio}</>

  return (
    <>
      {/* Desktop — tabela normal */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {colunas.map(col => (
                <th key={col.header} className={cn('text-left py-3 px-2 font-medium text-muted-foreground', col.className)}>
                  {col.header}
                </th>
              ))}
              {acoes && <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {dados.map(row => (
              <tr key={keyExtractor(row)} className="border-b last:border-0 hover:bg-muted/30">
                {colunas.map(col => (
                  <td key={col.header} className={cn('py-3 px-2', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
                {acoes && <td className="py-3 px-2 text-right">{acoes(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — cards empilhados */}
      <div className="md:hidden space-y-3">
        {dados.map(row => (
          <div key={keyExtractor(row)} className="border rounded-lg p-3 space-y-2">
            {colunas.filter(c => !c.hideMobile).map(col => (
              <div key={col.header} className="flex items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground shrink-0 min-w-[80px]">
                  {col.mobileLabel ?? col.header}
                </span>
                <span className="text-sm text-right">{col.cell(row)}</span>
              </div>
            ))}
            {acoes && (
              <div className="flex justify-end gap-1 pt-1 border-t">
                {acoes(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
