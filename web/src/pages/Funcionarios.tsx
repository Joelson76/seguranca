import { useState } from 'react'
import { Plus, Search, UserX, Pencil, Loader2, Eye, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  useFuncionarios, useCriarFuncionario, useAtualizarFuncionario,
  useDesativarFuncionario, type Funcionario,
} from '@/hooks/useFuncionarios'
import { UploadFoto } from '@/components/shared/UploadFoto'
import { ImportarCSV } from '@/components/shared/ImportarCSV'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SkeletonTabela } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { maskCPF, stripMask } from '@/lib/masks'
import { useDebounce } from '@/hooks/useDebounce'

const schema = z.object({
  matricula: z.string().min(1, 'Matrícula obrigatória'),
  nome: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  cargo: z.string().min(1, 'Cargo obrigatório'),
  setor: z.string().min(1, 'Setor obrigatório'),
  data_admissao: z.string().min(1, 'Data de admissão obrigatória'),
  ativo: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function Funcionarios() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebounce(busca)
  const [setorFiltro, setSetorFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalCSV, setModalCSV] = useState(false)
  const [confirmDesativar, setConfirmDesativar] = useState<Funcionario | null>(null)
  const [editando, setEditando] = useState<Funcionario | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string>('')

  const { data: funcionarios = [], isLoading } = useFuncionarios({ busca: buscaDebounced, setor: setorFiltro || undefined })

  const setores = [...new Set(funcionarios.map(f => f.setor))].sort()
  const criar = useCriarFuncionario()
  const atualizar = useAtualizarFuncionario()
  const desativar = useDesativarFuncionario()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  function abrirModal(func?: Funcionario) {
    if (func) {
      setEditando(func)
      setFotoUrl(func.foto_url ?? '')
      reset({
        matricula: func.matricula,
        nome: func.nome,
        cpf: func.cpf,
        cargo: func.cargo,
        setor: func.setor,
        data_admissao: func.data_admissao,
        ativo: func.ativo,
      })
    } else {
      setEditando(null)
      setFotoUrl('')
      reset({ ativo: true })
    }
    setModalAberto(true)
  }

  async function onSubmit(data: FormData) {
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, ...data, foto_url: fotoUrl || undefined })
      } else {
        await criar.mutateAsync({ ...data, foto_url: fotoUrl || undefined })
      }
      setModalAberto(false)
      reset()
    } catch {
      // Erros tratados nos hooks
    }
  }

  async function handleDesativar() {
    if (!confirmDesativar) return
    await desativar.mutateAsync(confirmDesativar.id)
    setConfirmDesativar(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie os funcionários da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalCSV(true)}>
            Importar CSV
          </Button>
          <Button onClick={() => abrirModal()}>
            <Plus className="h-4 w-4" /> Novo Funcionário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou matrícula..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={setorFiltro}
              onChange={e => setSetorFiltro(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm min-w-[140px]"
            >
              <option value="">Todos os setores</option>
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Carregando...' : `${funcionarios.length} funcionário(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTabela linhas={6} />
          ) : (
            <TabelaResponsiva
              colunas={[
                {
                  header: 'Matrícula', hideMobile: true,
                  cell: (f) => <span className="font-mono text-xs">{f.matricula}</span>,
                },
                {
                  header: 'Nome',
                  cell: (f) => (
                    <div className="flex items-center gap-2">
                      {f.foto_url
                        ? <img src={f.foto_url} alt={f.nome} className="h-7 w-7 rounded-full object-cover shrink-0" />
                        : <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{f.nome[0]}</span></div>
                      }
                      <span className="font-medium">{f.nome}</span>
                    </div>
                  ),
                },
                { header: 'Cargo', hideMobile: true, cell: (f) => <span className="text-muted-foreground">{f.cargo}</span> },
                { header: 'Setor', cell: (f) => <span className="text-muted-foreground">{f.setor}</span> },
                { header: 'Admissão', hideMobile: true, cell: (f) => <span className="text-muted-foreground">{formatDate(f.data_admissao)}</span> },
                { header: 'Status', cell: (f) => <Badge variant={f.ativo ? 'success' : 'secondary'}>{f.ativo ? 'Ativo' : 'Inativo'}</Badge> },
              ]}
              dados={funcionarios}
              keyExtractor={f => f.id}
              acoes={(f) => (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/app/funcionarios/${f.id}`)} title="Ver ficha"><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => abrirModal(f)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                  {f.ativo && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setConfirmDesativar(f)} title="Desativar">
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
              vazio={<EmptyState icon={Users} titulo="Nenhum funcionário encontrado" descricao="Cadastre funcionários ou ajuste os filtros" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-center">
              <UploadFoto
                urlAtual={fotoUrl}
                bucket="fotos-funcionario"
                pasta="funcionarios/"
                onChange={setFotoUrl}
                tamanho="lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matrícula</Label>
                <Input {...register('matricula')} placeholder="001" />
                {errors.matricula && <p className="text-xs text-destructive">{errors.matricula.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  {...register('cpf')}
                  onChange={e => {
                    const masked = maskCPF(e.target.value)
                    e.target.value = masked
                    register('cpf').onChange(e)
                  }}
                  onBlur={e => {
                    e.target.value = stripMask(e.target.value)
                    register('cpf').onBlur(e)
                  }}
                />
                {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input {...register('nome')} placeholder="João da Silva" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input {...register('cargo')} placeholder="Operador" />
                {errors.cargo && <p className="text-xs text-destructive">{errors.cargo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input {...register('setor')} placeholder="Produção" />
                {errors.setor && <p className="text-xs text-destructive">{errors.setor.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Admissão</Label>
              <Input type="date" {...register('data_admissao')} />
              {errors.data_admissao && <p className="text-xs text-destructive">{errors.data_admissao.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending || atualizar.isPending}>
                {(criar.isPending || atualizar.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editando ? 'Salvar alterações' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImportarCSV open={modalCSV} onClose={() => setModalCSV(false)} />

      <ConfirmDialog
        open={!!confirmDesativar}
        titulo={`Desativar "${confirmDesativar?.nome}"?`}
        descricao="O funcionário não poderá mais acessar o sistema. Esta ação pode ser revertida."
        textoBotao="Desativar"
        onConfirmar={handleDesativar}
        onCancelar={() => setConfirmDesativar(null)}
        carregando={desativar.isPending}
      />
    </div>
  )
}
