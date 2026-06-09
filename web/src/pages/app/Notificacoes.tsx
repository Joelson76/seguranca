import { Bell, Check, CheckCheck, Trash2, AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function Notificacoes() {
  const { notificacoes, naoLidas, isLoading, marcarLida, marcarTodasLidas } = useNotificacoes()

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'alerta':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'sucesso':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'bg-red-50 border-red-200'
      case 'alerta':
        return 'bg-yellow-50 border-yellow-200'
      case 'sucesso':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando notificações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificações
          </h1>
          <p className="text-muted-foreground mt-1">
            {naoLidas > 0 ? (
              <>
                Você tem <span className="font-semibold text-primary">{naoLidas}</span>{' '}
                {naoLidas === 1 ? 'notificação não lida' : 'notificações não lidas'}
              </>
            ) : (
              'Todas as notificações foram lidas'
            )}
          </p>
        </div>

        {naoLidas > 0 && (
          <Button onClick={() => marcarTodasLidas()} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      {notificacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma notificação ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Você será notificado sobre alertas importantes do sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'transition-all hover:shadow-md',
                !notif.lida && 'border-l-4 border-l-primary shadow-sm',
                notif.lida && 'opacity-60'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={cn(
                        'p-2 rounded-lg border',
                        getCorTipo(notif.tipo)
                      )}
                    >
                      {getIconeTipo(notif.tipo)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{notif.titulo}</CardTitle>
                        {!notif.lida && (
                          <Badge variant="default" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </div>

                      <CardDescription className="text-sm">
                        {format(new Date(notif.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!notif.lida && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => marcarLida(notif.id)}
                        title="Marcar como lida"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground pl-14">{notif.mensagem}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {notificacoes.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Exibindo {notificacoes.length} {notificacoes.length === 1 ? 'notificação' : 'notificações'}
        </div>
      )}
    </div>
  )
}
