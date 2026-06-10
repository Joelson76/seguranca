import { useState, useRef } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [assinando, setAssinando] = useState(false)
  const [posInicial, setPosInicial] = useState({ x: 0, y: 0 })

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { quantidade: 1 },
  })

  // ── Canvas helpers ──
  function getPonto(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * sx, y: ((e as React.MouseEvent).clientY - rect.top) * sy }
  }

  function iniciarAssinatura(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); setAssinando(true); setPosInicial(getPonto(e, canvasRef.current!))
  }

  function desenhar(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!assinando || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    const { x, y } = getPonto(e, canvasRef.current)
    ctx.beginPath(); ctx.moveTo(posInicial.x, posInicial.y); ctx.lineTo(x, y)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
    setPosInicial({ x, y })
  }

  function limparCanvas() {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  async function onSubmit(data: FormData) {
    let assinatura_url: string | undefined
    const canvas = canvasRef.current
    if (canvas) {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
      if (blob && blob.size > 1000) {
        const file = new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' })
        const { data: up } = await supabase.storage.from('assinaturas').upload(`${Date.now()}_${file.name}`, file)
        if (up) {
          const { data: urlData } = supabase.storage.from('assinaturas').getPublicUrl(up.path)
          assinatura_url = urlData.publicUrl
        }
      }
    }
    await registrar.mutateAsync({ ...data, assinatura_base64: assinatura_url })
    setModalAberto(false)
    reset()
    limparCanvas()
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
    const y = (doc as any).lastAutoTable.finalY + 20
    doc.text('Declaro ter recebido o EPI acima em perfeito estado.', 14, y)
    doc.line(14, y + 15, 100, y + 15)
    doc.text('Assinatura do Funcionário', 14, y + 20)
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
        <Button onClick={() => { setModalAberto(true); reset(); limparCanvas() }}>
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
              <select {...register('funcionario_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
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
            <div className="space-y-2">
              <Label>Assinatura do Funcionário</Label>
              <div className="border rounded-md p-2 bg-muted/20">
                <canvas
                  ref={canvasRef} width={400} height={100}
                  className="w-full cursor-crosshair border rounded bg-white touch-none"
                  onMouseDown={iniciarAssinatura} onMouseMove={desenhar}
                  onMouseUp={() => setAssinando(false)} onMouseLeave={() => setAssinando(false)}
                  onTouchStart={iniciarAssinatura} onTouchMove={desenhar} onTouchEnd={() => setAssinando(false)}
                />
                <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={limparCanvas}>Limpar</Button>
              </div>
            </div>
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
