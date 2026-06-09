import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Users, Loader2, ShieldOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export default function SuperAdmin() {
  const qc = useQueryClient()

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [{ count: totalTenants }, { count: totalUsuarios }, { count: totalFuncionarios }] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('funcionarios').select('*', { count: 'exact', head: true }),
      ])
      return { totalTenants, totalUsuarios, totalFuncionarios }
    },
  })

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('tenants').update({ ativo: !ativo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      toast.success('Status atualizado')
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const PLANO_COR: Record<string, 'default' | 'secondary' | 'success'> = {
    basico: 'secondary',
    profissional: 'default',
    enterprise: 'success',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Super Admin</h1>
        <p className="text-muted-foreground">Visão global da plataforma SafeTrack</p>
      </div>

      {/* Métricas globais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Empresas ativas', valor: stats?.totalTenants ?? 0, icon: Building2, cor: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Usuários totais', valor: stats?.totalUsuarios ?? 0, icon: Users, cor: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Funcionários cadastrados', valor: stats?.totalFuncionarios ?? 0, icon: Users, cor: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, valor, icon: Icon, cor, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`${bg} rounded-xl p-3`}>
                <Icon className={`h-6 w-6 ${cor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{valor}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Carregando...' : `${tenants.length} empresa(s) na plataforma`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Empresa', 'CNPJ', 'Plano', 'Criado em', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left py-3 px-2 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t: { id: string; nome: string; cnpj: string; plano: string; ativo: boolean; criado_em: string }) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-2 font-medium">{t.nome}</td>
                      <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{t.cnpj}</td>
                      <td className="py-3 px-2">
                        <Badge variant={PLANO_COR[t.plano] ?? 'secondary'} className="capitalize">
                          {t.plano}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(t.criado_em)}</td>
                      <td className="py-3 px-2">
                        <Badge variant={t.ativo ? 'success' : 'danger'}>
                          {t.ativo ? 'Ativa' : 'Suspensa'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo.mutate({ id: t.id, ativo: t.ativo })}
                          disabled={toggleAtivo.isPending}
                          className={t.ativo ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                        >
                          {t.ativo ? (
                            <><ShieldOff className="h-3.5 w-3.5 mr-1" />Suspender</>
                          ) : (
                            <><ShieldCheck className="h-3.5 w-3.5 mr-1" />Reativar</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
