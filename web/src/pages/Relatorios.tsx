import { FileDown, Loader2, TableProperties } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { gerarFichaEpi } from '@/utils/gerarFichaEpi'
import { toast } from 'sonner'

function useDados() {
  const funcionarios = useQuery({
    queryKey: ['rel-funcionarios'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('*').eq('ativo', true).order('nome')
      return data ?? []
    },
  })
  const epis = useQuery({
    queryKey: ['rel-epis'],
    queryFn: async () => {
      const { data } = await supabase.from('epis').select('*').eq('ativo', true).order('nome')
      return data ?? []
    },
  })
  const treinVencidos = useQuery({
    queryKey: ['rel-trein-vencidos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('funcionario_treinamentos')
        .select('*, funcionarios(nome, cargo, setor), treinamentos(nome)')
        .lte('data_vencimento', new Date().toISOString().split('T')[0])
        .order('data_vencimento')
      return data ?? []
    },
  })
  const acidentes = useQuery({
    queryKey: ['rel-acidentes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('acidentes')
        .select('*, funcionarios(nome, cargo, setor)')
        .order('data_ocorrencia', { ascending: false })
      return data ?? []
    },
  })
  return { funcionarios, epis, treinVencidos, acidentes }
}

export default function Relatorios() {
  const { funcionarios, epis, treinVencidos, acidentes } = useDados()
  const [modalFicha, setModalFicha] = useState(false)
  const [funcSelecionado, setFuncSelecionado] = useState('')
  const [gerandoFicha, setGerandoFicha] = useState(false)
  const [modalEstatisticas, setModalEstatisticas] = useState(false)
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')

  // ─── PDF Helpers ───
  function cabecalhoPDF(doc: jsPDF, titulo: string) {
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, 210, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(titulo, 105, 16, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 32)
  }

  function gerarPDFFuncionarios() {
    const doc = new jsPDF()
    cabecalhoPDF(doc, 'RELATÓRIO DE FUNCIONÁRIOS ATIVOS')
    autoTable(doc, {
      startY: 36,
      head: [['Matrícula', 'Nome', 'CPF', 'Cargo', 'Setor', 'Admissão']],
      body: funcionarios.data?.map((f: { matricula: string; nome: string; cpf: string; cargo: string; setor: string; data_admissao: string }) => [
        f.matricula, f.nome, f.cpf, f.cargo, f.setor, formatDate(f.data_admissao),
      ]) ?? [],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [37, 99, 235] },
    })
    doc.save('relatorio-funcionarios.pdf')
  }

  function gerarPDFEstoque() {
    const doc = new jsPDF()
    cabecalhoPDF(doc, 'RELATÓRIO DE ESTOQUE DE EPIs')
    autoTable(doc, {
      startY: 36,
      head: [['EPI', 'CA', 'Categoria', 'Estoque', 'Mínimo', 'Status']],
      body: epis.data?.map((e: { nome: string; ca: string; categoria: string; quantidade_atual: number; estoque_minimo: number }) => [
        e.nome, e.ca, e.categoria, String(e.quantidade_atual), String(e.estoque_minimo),
        e.quantidade_atual <= e.estoque_minimo ? 'CRÍTICO' : 'OK',
      ]) ?? [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      bodyStyles: {},
      didParseCell: (data) => {
        if (data.column.index === 5 && data.cell.text[0] === 'CRÍTICO') {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    doc.save('relatorio-estoque-epis.pdf')
  }

  function gerarPDFTreinamentos() {
    const doc = new jsPDF()
    cabecalhoPDF(doc, 'RELATÓRIO DE TREINAMENTOS VENCIDOS')
    autoTable(doc, {
      startY: 36,
      head: [['Funcionário', 'Cargo', 'Setor', 'Treinamento', 'Vencimento']],
      body: treinVencidos.data?.map((t: { funcionarios: unknown; treinamentos: unknown; data_vencimento: string }) => [
        (t.funcionarios as { nome: string } | null)?.nome ?? '-',
        (t.funcionarios as { cargo: string } | null)?.cargo ?? '-',
        (t.funcionarios as { setor: string } | null)?.setor ?? '-',
        (t.treinamentos as { nome: string } | null)?.nome ?? '-',
        formatDate(t.data_vencimento),
      ]) ?? [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    })
    doc.save('relatorio-treinamentos-vencidos.pdf')
  }

  function gerarPDFAcidentes() {
    const doc = new jsPDF()
    cabecalhoPDF(doc, 'RELATÓRIO DE ACIDENTES E INCIDENTES')

    // Estatísticas SST
    const totalAcidentes = acidentes.data?.length ?? 0
    const acidentesComAfastamento = acidentes.data?.filter((a: { tipo: string }) => a.tipo === 'acidente_com_afastamento').length ?? 0
    const diasAfastamentoTotal = acidentes.data?.reduce((sum: number, a: { dias_afastamento?: number }) => sum + (a.dias_afastamento ?? 0), 0) ?? 0

    // Supondo 100 funcionários e 1.000.000 de horas trabalhadas (ajuste conforme necessário)
    const numeroFuncionarios = 100
    const horasTrabalhadas = 1000000

    // Taxa de Frequência (TF) = (nº acidentes com afastamento × 1.000.000) / horas trabalhadas
    const taxaFrequencia = horasTrabalhadas > 0 ? (acidentesComAfastamento * 1000000) / horasTrabalhadas : 0

    // Taxa de Gravidade (TG) = (dias perdidos × 1.000.000) / horas trabalhadas
    const taxaGravidade = horasTrabalhadas > 0 ? (diasAfastamentoTotal * 1000000) / horasTrabalhadas : 0

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('ESTATÍSTICAS SST (ABNT)', 14, 40)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Total de Acidentes: ${totalAcidentes}`, 14, 46)
    doc.text(`Acidentes com Afastamento: ${acidentesComAfastamento}`, 14, 51)
    doc.text(`Total de Dias Afastados: ${diasAfastamentoTotal}`, 14, 56)
    doc.text(`Taxa de Frequência: ${taxaFrequencia.toFixed(2)}`, 14, 61)
    doc.text(`Taxa de Gravidade: ${taxaGravidade.toFixed(2)}`, 14, 66)

    autoTable(doc, {
      startY: 72,
      head: [['Funcionário', 'Tipo', 'Data', 'Local', 'Status', 'CAT']],
      body: acidentes.data?.map((a: { funcionarios: unknown; tipo: string; data_ocorrencia: string; local_ocorrencia: string; status: string; cat: boolean }) => [
        (a.funcionarios as { nome: string } | null)?.nome ?? '-',
        a.tipo.replace(/_/g, ' '),
        formatDate(a.data_ocorrencia),
        a.local_ocorrencia,
        a.status.replace(/_/g, ' '),
        a.cat ? 'Sim' : 'Não',
      ]) ?? [],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [37, 99, 235] },
    })
    doc.save('relatorio-acidentes.pdf')
  }

  // ─── Excel Helpers ───
  function exportarExcel(dados: Record<string, unknown>[], nome: string) {
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
    XLSX.writeFile(wb, `${nome}.xlsx`)
  }

  function exportarFuncionariosXLS() {
    exportarExcel(
      funcionarios.data?.map((f: { matricula: string; nome: string; cpf: string; cargo: string; setor: string; data_admissao: string }) => ({
        Matrícula: f.matricula, Nome: f.nome, CPF: f.cpf,
        Cargo: f.cargo, Setor: f.setor, Admissão: formatDate(f.data_admissao),
      })) ?? [],
      'funcionarios'
    )
  }

  function exportarEstoqueXLS() {
    exportarExcel(
      epis.data?.map((e: { nome: string; ca: string; categoria: string; quantidade_atual: number; estoque_minimo: number; fornecedor?: string }) => ({
        EPI: e.nome, CA: e.ca, Categoria: e.categoria,
        Estoque: e.quantidade_atual, Mínimo: e.estoque_minimo,
        Fornecedor: e.fornecedor ?? '-',
        Status: e.quantidade_atual <= e.estoque_minimo ? 'CRÍTICO' : 'OK',
      })) ?? [],
      'estoque-epis'
    )
  }

  function exportarTreinamentosXLS() {
    exportarExcel(
      treinVencidos.data?.map((t: { funcionarios: unknown; treinamentos: unknown; data_vencimento: string }) => ({
        Funcionário: (t.funcionarios as { nome: string } | null)?.nome ?? '-',
        Cargo: (t.funcionarios as { cargo: string } | null)?.cargo ?? '-',
        Setor: (t.funcionarios as { setor: string } | null)?.setor ?? '-',
        Treinamento: (t.treinamentos as { nome: string } | null)?.nome ?? '-',
        Vencimento: formatDate(t.data_vencimento),
      })) ?? [],
      'treinamentos-vencidos'
    )
  }

  function exportarAcidentesXLS() {
    exportarExcel(
      acidentes.data?.map((a: { funcionarios: unknown; tipo: string; data_ocorrencia: string; local_ocorrencia: string; status: string; cat: boolean; dias_afastamento?: number }) => ({
        Funcionário: (a.funcionarios as { nome: string } | null)?.nome ?? '-',
        Tipo: a.tipo.replace(/_/g, ' '),
        Data: formatDate(a.data_ocorrencia),
        Local: a.local_ocorrencia,
        Status: a.status.replace(/_/g, ' '),
        CAT: a.cat ? 'Sim' : 'Não',
        'Dias Afastamento': a.dias_afastamento ?? 0,
      })) ?? [],
      'acidentes'
    )
  }

  // ─── Ficha de EPI por funcionário ───
  async function gerarFicha() {
    if (!funcSelecionado) return
    setGerandoFicha(true)
    try {
      const { data: func } = await supabase.from('funcionarios').select('*').eq('id', funcSelecionado).single()
      const { data: entregas } = await supabase
        .from('entregas_epi')
        .select('*, epis(nome, ca)')
        .eq('funcionario_id', funcSelecionado)
        .order('data_entrega', { ascending: false })

      if (!func || !entregas) { toast.error('Erro ao buscar dados'); return }
      gerarFichaEpi(func, entregas)
      setModalFicha(false)
    } catch {
      toast.error('Erro ao gerar ficha')
    } finally {
      setGerandoFicha(false)
    }
  }

  // ─── Estatísticas SST com período customizável ───
  async function gerarEstatisticasSST() {
    if (!periodoInicio || !periodoFim) {
      toast.error('Selecione o período')
      return
    }

    const { data } = await supabase
      .from('acidentes')
      .select('tipo, dias_afastamento, data_ocorrencia')
      .gte('data_ocorrencia', periodoInicio)
      .lte('data_ocorrencia', periodoFim)

    if (!data) {
      toast.error('Erro ao buscar dados')
      return
    }

    const doc = new jsPDF()
    cabecalhoPDF(doc, 'ESTATÍSTICAS SST — ABNT')

    const totalAcidentes = data.length
    const acidentesComAfastamento = data.filter(a => a.tipo === 'acidente_com_afastamento').length
    const diasAfastamentoTotal = data.reduce((sum, a) => sum + (a.dias_afastamento ?? 0), 0)

    // Fórmulas ABNT
    const numeroFuncionarios = 100 // Ajustar conforme necessário
    const horasTrabalhadas = 1000000

    const taxaFrequencia = horasTrabalhadas > 0 ? (acidentesComAfastamento * 1000000) / horasTrabalhadas : 0
    const taxaGravidade = horasTrabalhadas > 0 ? (diasAfastamentoTotal * 1000000) / horasTrabalhadas : 0

    // Contagem por tipo
    const porTipo = data.reduce((acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`, 14, 36)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('INDICADORES', 14, 46)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    let yPos = 54
    doc.text(`Total de acidentes: ${totalAcidentes}`, 14, yPos)
    yPos += 6
    doc.text(`Acidentes com afastamento: ${acidentesComAfastamento}`, 14, yPos)
    yPos += 6
    doc.text(`Total de dias afastados: ${diasAfastamentoTotal}`, 14, yPos)
    yPos += 6
    doc.text(`Taxa de Frequência (TF): ${taxaFrequencia.toFixed(2)}`, 14, yPos)
    yPos += 6
    doc.text(`Taxa de Gravidade (TG): ${taxaGravidade.toFixed(2)}`, 14, yPos)
    yPos += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ACIDENTES POR TIPO', 14, yPos)
    yPos += 8

    const tiposLabels: Record<string, string> = {
      acidente_com_afastamento: 'Com afastamento',
      acidente_sem_afastamento: 'Sem afastamento',
      acidente_de_trajeto: 'De trajeto',
      quase_acidente: 'Quase-acidente',
      incidente: 'Incidente',
      doenca_ocupacional: 'Doença ocupacional',
    }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    Object.entries(porTipo).forEach(([tipo, qtd]) => {
      doc.text(`${tiposLabels[tipo] || tipo}: ${qtd}`, 14, yPos)
      yPos += 6
    })

    yPos += 8
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Fórmulas utilizadas:', 14, yPos)
    yPos += 5
    doc.text('TF = (nº acidentes com afastamento × 1.000.000) / horas trabalhadas', 14, yPos)
    yPos += 5
    doc.text('TG = (dias perdidos × 1.000.000) / horas trabalhadas', 14, yPos)

    doc.save('relatorio-estatisticas-sst.pdf')
    setModalEstatisticas(false)
    toast.success('Relatório gerado')
  }

  const relatorios = [
    {
      titulo: 'Funcionários Ativos',
      descricao: `${funcionarios.data?.length ?? 0} funcionários`,
      loading: funcionarios.isLoading,
      pdf: gerarPDFFuncionarios,
      xls: exportarFuncionariosXLS,
    },
    {
      titulo: 'Estoque de EPIs',
      descricao: `${epis.data?.length ?? 0} tipos de EPI`,
      loading: epis.isLoading,
      pdf: gerarPDFEstoque,
      xls: exportarEstoqueXLS,
    },
    {
      titulo: 'Treinamentos Vencidos',
      descricao: `${treinVencidos.data?.length ?? 0} vencido(s)`,
      loading: treinVencidos.isLoading,
      pdf: gerarPDFTreinamentos,
      xls: exportarTreinamentosXLS,
    },
    {
      titulo: 'Acidentes e Incidentes',
      descricao: `${acidentes.data?.length ?? 0} ocorrência(s)`,
      loading: acidentes.isLoading,
      pdf: gerarPDFAcidentes,
      xls: exportarAcidentesXLS,
    },
  ]

  const relatoriosCustomizaveis = [
    {
      titulo: 'Estatísticas SST (ABNT)',
      descricao: 'Taxa de frequência, gravidade e acidentes por tipo',
      action: () => setModalEstatisticas(true),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios para auditoria e conformidade</p>
      </div>

      {/* Ficha individual */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Ficha de EPI por Funcionário</CardTitle>
          <CardDescription>Gera o comprovante completo com histórico de entregas e campo de assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setModalFicha(true)}>
            <FileDown className="h-4 w-4" />
            Gerar Ficha Individual
          </Button>
        </CardContent>
      </Card>

      {/* Relatórios customizáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatoriosCustomizaveis.map((r) => (
          <Card key={r.titulo} className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="text-base">{r.titulo}</CardTitle>
              <CardDescription>{r.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={r.action} variant="outline">
                <FileDown className="h-4 w-4" />
                Gerar com Período
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relatórios em lote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatorios.map((r) => (
          <Card key={r.titulo}>
            <CardHeader>
              <CardTitle className="text-base">{r.titulo}</CardTitle>
              <CardDescription>{r.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                onClick={r.pdf}
                disabled={r.loading}
                className="flex-1"
              >
                {r.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                PDF
              </Button>
              {r.xls && (
                <Button
                  variant="outline"
                  onClick={r.xls}
                  disabled={r.loading}
                  className="flex-1"
                >
                  <TableProperties className="h-4 w-4" />
                  Excel
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal ficha individual */}
      <Dialog open={modalFicha} onOpenChange={setModalFicha}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ficha de EPI — Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Selecione o funcionário</Label>
            <select
              value={funcSelecionado}
              onChange={(e) => setFuncSelecionado(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Selecione...</option>
              {funcionarios.data?.map((f: { id: string; nome: string; matricula: string }) => (
                <option key={f.id} value={f.id}>{f.nome} — {f.matricula}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFicha(false)}>Cancelar</Button>
            <Button onClick={gerarFicha} disabled={!funcSelecionado || gerandoFicha}>
              {gerandoFicha && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal estatísticas SST */}
      <Dialog open={modalEstatisticas} onOpenChange={setModalEstatisticas}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Estatísticas SST (ABNT)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEstatisticas(false)}>Cancelar</Button>
            <Button onClick={gerarEstatisticasSST} disabled={!periodoInicio || !periodoFim}>
              <FileDown className="h-4 w-4" />
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
