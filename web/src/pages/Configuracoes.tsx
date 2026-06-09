import { Loader2, Save, Plus, X, Building2, Users, Lock, CreditCard, Mail } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UploadFoto } from '@/components/shared/UploadFoto'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatCurrency } from '@/lib/utils'

type Aba = 'empresa' | 'usuarios' | 'seguranca' | 'assinatura'

const PLANOS = {
  basico: { nome: 'Básico', preco: 149, cor: 'secondary' as const },
  profissional: { nome: 'Profissional', preco: 349, cor: 'default' as const },
  enterprise: { nome: 'Enterprise', preco: 749, cor: 'success' as const },
}

export default function Configuracoes() {
  const { perfil, setPerfil } = useAuthStore()
  const qc = useQueryClient()
  const [aba, setAba] = useState<Aba>('empresa')
  const [modalConvite, setModalConvite] = useState(false)
  const [convite, setConvite] = useState({ email: '', nome: '', perfil: 'operador' })
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [novoSetor, setNovoSetor] = useState('')
  const [novoCargo, setNovoCargo] = useState('')

  const podeAdmin = perfil?.perfil === 'admin' || perfil?.perfil === 'super_admin'

  async function enviarConvite() {
    if (!convite.email || !convite.nome) { toast.error('Preencha e-mail e nome'); return }
    setEnviandoConvite(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await supabase.functions.invoke('convidar-usuario', {
        body: convite,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (resp.error) throw resp.error
      toast.success(`Convite enviado para ${convite.email}`)
      setModalConvite(false)
      setConvite({ email: '', nome: '', perfil: 'operador' })
      qc.invalidateQueries({ queryKey: ['usuarios-config'] })
    } catch {
      toast.error('Erro ao enviar convite')
    } finally {
      setEnviandoConvite(false)
    }
  }

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      if (!perfil?.tenant_id) return null
      const { data } = await supabase.from('tenants').select('*').eq('id', perfil.tenant_id).single()
      if (data?.logo_url) setLogoUrl(data.logo_url)
      return data
    },
    enabled: !!perfil,
  })

  const { data: assinatura } = useQuery({
    queryKey: ['assinatura'],
    queryFn: async () => {
      if (!perfil?.tenant_id) return null
      const { data } = await supabase.from('assinaturas').select('*').eq('tenant_id', perfil.tenant_id).single()
      return data
    },
    enabled: !!perfil,
  })

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-config'],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('*').order('nome')
      return data ?? []
    },
  })

  // Setores e cargos cadastrados dinamicamente a partir dos funcionários
  const { data: setores = [] } = useQuery({
    queryKey: ['setores'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('setor').eq('ativo', true)
      return [...new Set((data ?? []).map((f: any) => f.setor))].sort() as string[]
    },
  })

  const { data: cargos = [] } = useQuery({
    queryKey: ['cargos'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('cargo').eq('ativo', true)
      return [...new Set((data ?? []).map((f: any) => f.cargo))].sort() as string[]
    },
  })

  const { register: regEmpresa, handleSubmit: submitEmpresa } = useForm({
    values: { nome: tenant?.nome ?? '', cnpj: tenant?.cnpj ?? '' },
  })

  const salvarEmpresa = useMutation({
    mutationFn: async (dados: { nome: string; cnpj: string }) => {
      if (!perfil?.tenant_id) return
      const { error } = await supabase.from('tenants').update({ ...dados, logo_url: logoUrl || undefined }).eq('id', perfil.tenant_id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant'] }); toast.success('Dados atualizados') },
    onError: () => toast.error('Erro ao salvar'),
  })

  const alterarPerfil = useMutation({
    mutationFn: async ({ id, novoPerfil }: { id: string; novoPerfil: string }) => {
      const { error } = await supabase.from('usuarios').update({ perfil: novoPerfil }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios-config'] }); toast.success('Perfil atualizado') },
    onError: () => toast.error('Erro ao atualizar perfil'),
  })

  const desativarUsuario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('usuarios').update({ ativo: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios-config'] }); toast.success('Usuário desativado') },
    onError: () => toast.error('Erro'),
  })

  async function alterarSenha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const nova = (form.elements.namedItem('novaSenha') as HTMLInputElement).value
    const confirma = (form.elements.namedItem('confirmaSenha') as HTMLInputElement).value
    if (nova.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return }
    if (nova !== confirma) { toast.error('As senhas não conferem'); return }
    const { error } = await supabase.auth.updateUser({ password: nova })
    if (error) toast.error('Erro ao alterar senha')
    else { toast.success('Senha alterada'); form.reset() }
  }

  const abas: { id: Aba; label: string; icon: React.ElementType }[] = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'seguranca', label: 'Segurança', icon: Lock },
    { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta e empresa</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b">
        {abas.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              aba === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Empresa */}
      {aba === 'empresa' && podeAdmin && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Identidade visual</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-6">
              <UploadFoto urlAtual={logoUrl} bucket="logos" pasta="logos/" onChange={setLogoUrl} tamanho="lg" />
              <div>
                <p className="text-sm font-medium">Logo da empresa</p>
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG — máx. 5 MB</p>
                <p className="text-xs text-muted-foreground mt-1">Aparece nos relatórios e documentos PDF</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dados cadastrais</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitEmpresa(d => salvarEmpresa.mutate(d))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da empresa</Label>
                  <Input {...regEmpresa('nome')} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input {...regEmpresa('cnpj')} placeholder="00.000.000/0001-00" />
                </div>
                <Button type="submit" disabled={salvarEmpresa.isPending}>
                  {salvarEmpresa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Setores e Cargos</CardTitle>
              <CardDescription>Derivados dos funcionários cadastrados. Adicione novos abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Setores ({setores.length})</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {setores.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                  {setores.length === 0 && <p className="text-xs text-muted-foreground">Nenhum setor cadastrado ainda</p>}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Novo setor..." value={novoSetor} onChange={e => setNovoSetor(e.target.value)} className="max-w-xs" />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (novoSetor.trim()) { toast.info('Setor será criado ao cadastrar o próximo funcionário nele'); setNovoSetor('') }
                  }}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Cargos ({cargos.length})</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cargos.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                  {cargos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum cargo cadastrado ainda</p>}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Novo cargo..." value={novoCargo} onChange={e => setNovoCargo(e.target.value)} className="max-w-xs" />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (novoCargo.trim()) { toast.info('Cargo será criado ao cadastrar o próximo funcionário nele'); setNovoCargo('') }
                  }}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usuários */}
      {aba === 'usuarios' && podeAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Usuários da plataforma</CardTitle>
              <CardDescription>{usuarios.length} usuário(s) neste tenant</CardDescription>
            </div>
            <Button size="sm" onClick={() => setModalConvite(true)}>
              <Mail className="h-3.5 w-3.5" /> Convidar usuário
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Nome', 'Perfil', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left py-3 px-2 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u: any) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{u.nome}</td>
                      <td className="py-3 px-2">
                        {u.id === perfil?.id ? (
                          <Badge variant="secondary" className="capitalize">{u.perfil.replace(/_/g, ' ')}</Badge>
                        ) : (
                          <select
                            value={u.perfil}
                            onChange={e => alterarPerfil.mutate({ id: u.id, novoPerfil: e.target.value })}
                            className="h-7 rounded border border-input bg-transparent px-2 text-xs"
                          >
                            {['admin', 'tecnico_sst', 'operador', 'visualizador'].map(p => (
                              <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={u.ativo ? 'success' : 'secondary'}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {u.id !== perfil?.id && u.ativo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => desativarUsuario.mutate(u.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segurança */}
      {aba === 'seguranca' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterar senha</CardTitle>
            <CardDescription>Mínimo de 6 caracteres</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={alterarSenha} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input name="novaSenha" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <Input name="confirmaSenha" type="password" placeholder="••••••••" />
              </div>
              <Button type="submit">Alterar senha</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assinatura */}
      {aba === 'assinatura' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plano atual</CardTitle>
            </CardHeader>
            <CardContent>
              {assinatura ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{PLANOS[assinatura.plano as keyof typeof PLANOS]?.nome ?? assinatura.plano}</p>
                      <p className="text-muted-foreground text-sm">{formatCurrency(assinatura.valor_mensal)}/mês</p>
                    </div>
                    <Badge variant={assinatura.status === 'ativa' ? 'success' : assinatura.status === 'trial' ? 'warning' : 'danger'}>
                      {assinatura.status === 'trial' ? 'Trial' : assinatura.status === 'ativa' ? 'Ativa' : assinatura.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Início</p>
                      <p className="text-sm font-medium">{formatDate(assinatura.data_inicio)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Próximo pagamento</p>
                      <p className="text-sm font-medium">{formatDate(assinatura.data_proximo_pag)}</p>
                    </div>
                  </div>
                  {assinatura.status === 'trial' && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                        Período de teste — ative sua assinatura para continuar usando após o trial
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma assinatura encontrada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fazer upgrade</CardTitle>
              <CardDescription>Escolha o plano ideal para sua operação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(PLANOS).map(([key, plano]) => (
                  <div
                    key={key}
                    className={`rounded-lg border p-4 text-center ${assinatura?.plano === key ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <p className="font-semibold">{plano.nome}</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(plano.preco)}<span className="text-xs text-muted-foreground">/mês</span></p>
                    {assinatura?.plano === key ? (
                      <Badge className="mt-2" variant="secondary">Plano atual</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => toast.info('Entre em contato: contato@safetrack.com.br')}
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal convite de usuário */}
      <Dialog open={modalConvite} onOpenChange={setModalConvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={convite.nome}
                onChange={e => setConvite(c => ({ ...c, nome: e.target.value }))}
                placeholder="João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={convite.email}
                onChange={e => setConvite(c => ({ ...c, email: e.target.value }))}
                placeholder="joao@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de acesso</Label>
              <select
                value={convite.perfil}
                onChange={e => setConvite(c => ({ ...c, perfil: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="admin">Admin</option>
                <option value="tecnico_sst">Técnico SST</option>
                <option value="operador">Operador</option>
                <option value="visualizador">Visualizador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConvite(false)}>Cancelar</Button>
            <Button onClick={enviarConvite} disabled={enviandoConvite}>
              {enviandoConvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
