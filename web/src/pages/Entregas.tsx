import { useState, useEffect } from 'react'
import { Plus, Loader2, FileDown, RotateCcw, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import { EmptyState } from '@/components/shared/EmptyState'
import { BiometriaSeletor, type BiometriaData } from '@/components/biometria/BiometriaSeletor'
import { useEntregas, useRegistrarEntrega, useRegistrarDevolucao, type EntregaEPI } from '@/hooks/useEntregas'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime } from '@/lib/utils'

const schema = z.object({
  funcionario_id: z.string().min(1, 'Selecione um funcionário'),
  epi_id: z.string().min(1, 'Selecione um EPI'),
  quantidade: z.coerce.number().min(1),
  data_vencimento: z.string().optional(),
  observacao: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function Entregas() {
  const [modalAberto, setModalAberto] = useState(false)
  const [filtroFunc, setFiltroFunc] = useState('')
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  const [pagina, setPagina] = useState(0)
  const [dadosBiometria, setDadosBiometria] = useState<BiometriaData | { tipo: 'assinatura'; base64: string } | null>(null)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<{ id: string; nome: string } | null>(null)

  const { data: entregas = [], isLoading } = useEntregas({
    funcionario_id: filtroFunc || undefined,
    data_inicio: filtroInicio || undefined,
    data_fim: filtroFim || undefined,
    pagina,
    por_pagina: 20,
  })

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios-select'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('id, nome, matricula').eq('ativo', true).order('nome')
      return data ?? []
    },
  })

  const { data: epis = [] } = useQuery({
    queryKey: ['epis-select'],
    queryFn: async () => {
      const { data } = await supabase.from('epis').select('id, nome, ca, quantidade_atual').eq('ativo', true).gt('quantidade_atual', 0).order('nome')
      return data ?? []
    },
  })

  const registrar = useRegistrarEntrega()
  const devolver = useRegistrarDevolucao()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { quantidade: 1 },
  })

  // Observar mudanças no funcionário selecionado
  const funcionarioIdWatch = watch('funcionario_id')

  // Atualizar funcionário selecionado quando mudar no form
  useEffect(() => {
    if (funcionarioIdWatch && funcionarios.length > 0) {
      const func = funcionarios.find((f: any) => f.id === funcionarioIdWatch)
      if (func) {
        setFuncionarioSelecionado({ id: func.id, nome: func.nome })
      }
    }
  }, [funcionarioIdWatch, funcionarios])

  async function onSubmit(data: FormData) {
    if (!dadosBiometria) {
      toast.error('Capture a assinatura ou biometria do funcionário')
      return
    }

    let assinatura_url: string | undefined
    let biometria_hash: string | undefined
    let biometria_tipo: 'webauthn' | 'hardware' | 'assinatura' = 'assinatura'
    let biometria_dispositivo: string | undefined
    let biometria_metadata: any

    // Se for assinatura manual (base64)
    if (dadosBiometria.tipo === 'assinatura') {
      const base64 = (dadosBiometria as any).base64
      const blob = await fetch(base64).then(r => r.blob())

      if (blob && blob.size > 1000) {
        const file = new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' })
        const { data: up } = await supabase.storage.from('assinaturas').upload(`${Date.now()}_${file.name}`, file)
        if (up) {
          const { data: urlData } = supabase.storage.from('assinaturas').getPublicUrl(up.path)
          assinatura_url = urlData.publicUrl
        }
      }
    } else {
      // Se for biometria (webauthn ou hardware)
      const bioData = dadosBiometria as BiometriaData
      biometria_hash = bioData.hash
      biometria_tipo = bioData.tipo
      biometria_dispositivo = bioData.dispositivo
      biometria_metadata = bioData.metadata
    }

    await registrar.mutateAsync({
      ...data,
      assinatura_base64: assinatura_url,
      biometria_hash,
      biometria_tipo,
      biometria_dispositivo,
      biometria_metadata,
    })

    setModalAberto(false)
    reset()
    setDadosBiometria(null)
    setFuncionarioSelecionado(null)
  }

  function handleCapturaBiometria(dados: BiometriaData | { tipo: 'assinatura'; base64: string }) {
    setDadosBiometria(dados)
  }

  function gerarPDF(e: EntregaEPI) {
    const doc = new jsPDF()
    const func = e.funcionarios as any
    const epi = e.epis as any

    doc.setFontSize(14); doc.text('COMPROVANTE DE ENTREGA DE EPI', 105, 20, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Funcionário: ${func?.nome ?? '-'} | Matrícula: ${func?.matricula ?? '-'}`, 14, 35)
    doc.text(`Cargo: ${func?.cargo ?? '-'} | Setor: ${func?.setor ?? '-'}`, 14, 41)

    autoTable(doc, {
      startY: 48,
      head: [['EPI', 'CA', 'Quantidade', 'Data Entrega', 'Vencimento']],
      body: [[epi?.nome ?? '-', epi?.ca ?? '-', e.quantidade, formatDate(e.data_entrega), e.data_vencimento ? formatDate(e.data_vencimento) : '-']],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    })

    let y = (doc as any).lastAutoTable.finalY + 20

    // Adicionar informação do método de autenticação
    if (e.biometria_tipo && e.biometria_tipo !== 'assinatura') {
      doc.setFontSize(8)
      doc.setTextColor(0, 128, 0) // Verde
      const metodo = e.biometria_tipo === 'webauthn'
        ? `Autenticado via ${e.biometria_dispositivo || 'Biometria do Dispositivo'}`
        : `Autenticado via Leitor Biométrico - ${e.biometria_dispositivo || 'Hardware'}`
      doc.text(`✓ ${metodo}`, 14, y)
      doc.text(`Hash: ${e.biometria_hash?.substring(0, 32)}...`, 14, y + 4)
      doc.setTextColor(0, 0, 0) // Volta para preto
      y += 15
    } else {
      doc.text('Declaro ter recebido o EPI acima em perfeito estado.', 14, y)
      doc.line(14, y + 15, 100, y + 15)
      doc.text('Assinatura do Funcionário', 14, y + 20)
    }

    doc.save(`entrega-epi-${func?.matricula ?? 'sem-mat'}.pdf`)
  }

  async function handleDevolver(e: EntregaEPI) {
    if (!confirm(`Registrar devolução do EPI "${(e.epis as any)?.nome}"?`)) return
    await devolver.mutateAsync({ id: e.id, epi_id: e.epi_id, quantidade: e.quantidade })
  }

  const colunas = [
    { header: 'Funcionário', cell: (e: EntregaEPI) => <span className="font-medium">{(e.funcionarios as any)?.nome}</span> },
    { header: 'EPI', cell: (e: EntregaEPI) => (e.epis as any)?.nome },
    { header: 'Qtd', hideMobile: true, cell: (e: EntregaEPI) => e.quantidade },
    { header: 'Data', cell: (e: EntregaEPI) => <span className="text-muted-foreground text-xs">{formatDateTime(e.data_entrega)}</span> },
    { header: 'Vencimento', hideMobile: true, cell: (e: EntregaEPI) => <span className="text-muted-foreground text-xs">{e.data_vencimento ? formatDate(e.data_vencimento) : '—'}</span> },
    {
      header: 'Status',
      cell: (e: EntregaEPI) => (
        <Badge variant={e.devolvido ? 'secondary' : 'success'}>
          {e.devolvido ? 'Devolvido' : 'Em uso'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entregas de EPI</h1>
          <p className="text-muted-foreground">Registre e acompanhe as entregas</p>
        </div>
        <Button onClick={() => { setModalAberto(true); reset(); setDadosBiometria(null); setFuncionarioSelecionado(null) }}>
          <Plus className="h-4 w-4" /> Nova Entrega
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filtroFunc}
              onChange={e => { setFiltroFunc(e.target.value); setPagina(0) }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm flex-1 min-w-[180px]"
            >
              <option value="">Todos os funcionários</option>
              {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <input type="date" value={filtroInicio} onChange={e => { setFiltroInicio(e.target.value); setPagina(0) }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm" />
            <input type="date" value={filtroFim} onChange={e => { setFiltroFim(e.target.value); setPagina(0) }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm" />
            {(filtroFunc || filtroInicio || filtroFim) && (
              <Button variant="ghost" size="sm" onClick={() => { setFiltroFunc(''); setFiltroInicio(''); setFiltroFim(''); setPagina(0) }}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{isLoading ? 'Carregando...' : `${entregas.length} entrega(s)`}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <TabelaResponsiva
                colunas={colunas}
                dados={entregas}
                keyExtractor={e => e.id}
                acoes={(e) => (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => gerarPDF(e)} title="Baixar PDF">
                      <FileDown className="h-3.5 w-3.5" />
                    </Button>
                    {!e.devolvido && (
                      <Button variant="ghost" size="icon" onClick={() => handleDevolver(e)} title="Registrar devolução">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
                vazio={<EmptyState icon={Package} titulo="Nenhuma entrega registrada" descricao="Registre a primeira entrega de EPI" />}
              />
              {entregas.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">Página {pagina + 1}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={entregas.length < 20} onClick={() => setPagina(p => p + 1)}>Próxima</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal nova entrega */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Entrega de EPI</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <select
                {...register('funcionario_id')}
                onChange={(e) => {
                  register('funcionario_id').onChange(e)
                  const func = funcionarios.find((f: any) => f.id === e.target.value)
                  if (func) {
                    setFuncionarioSelecionado({ id: func.id, nome: func.nome })
                  } else {
                    setFuncionarioSelecionado(null)
                  }
                  setDadosBiometria(null)
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Selecione...</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome} — {f.matricula}</option>)}
              </select>
              {errors.funcionario_id && <p className="text-xs text-destructive">{errors.funcionario_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>EPI</Label>
              <select {...register('epi_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Selecione...</option>
                {epis.map((e: any) => <option key={e.id} value={e.id}>{e.nome} (CA {e.ca}) — {e.quantidade_atual} em estoque</option>)}
              </select>
              {errors.epi_id && <p className="text-xs text-destructive">{errors.epi_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} {...register('quantidade')} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento do EPI</Label>
                <Input type="date" {...register('data_vencimento')} />
              </div>
            </div>
            {funcionarioSelecionado && (
              <BiometriaSeletor
                funcionarioId={funcionarioSelecionado.id}
                funcionarioNome={funcionarioSelecionado.nome}
                onCaptura={handleCapturaBiometria}
              />
            )}
            {!funcionarioSelecionado && (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/20">
                Selecione um funcionário para capturar a assinatura/biometria
              </p>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input {...register('observacao')} placeholder="Opcional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={registrar.isPending}>
                {registrar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar Entrega
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
