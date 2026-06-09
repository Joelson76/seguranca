import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils'

interface Funcionario {
  nome: string
  matricula: string
  cargo: string
  setor: string
  cpf: string
  assinatura_url?: string
}

interface EntregaEpi {
  epis: { nome: string; ca: string } | null
  quantidade: number
  data_entrega: string
  data_vencimento?: string
  devolvido: boolean
  observacoes?: string
}

export function gerarFichaEpi(funcionario: Funcionario, entregas: EntregaEpi[], nomeEmpresa = 'SafeTrack') {
  const doc = new jsPDF()

  // Cabeçalho
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FICHA DE CONTROLE DE EPI', 105, 15, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nomeEmpresa, 105, 25, { align: 'center' })

  // Dados do funcionário
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO FUNCIONÁRIO', 14, 46)

  doc.setFillColor(248, 250, 252)
  doc.rect(14, 49, 182, 28, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const col1x = 18
  const col2x = 110
  doc.setFont('helvetica', 'bold')
  doc.text('Nome:', col1x, 57)
  doc.text('Matrícula:', col2x, 57)
  doc.setFont('helvetica', 'normal')
  doc.text(funcionario.nome, col1x + 12, 57)
  doc.text(funcionario.matricula, col2x + 18, 57)

  doc.setFont('helvetica', 'bold')
  doc.text('CPF:', col1x, 64)
  doc.text('Cargo:', col2x, 64)
  doc.setFont('helvetica', 'normal')
  doc.text(funcionario.cpf, col1x + 10, 64)
  doc.text(funcionario.cargo, col2x + 14, 64)

  doc.setFont('helvetica', 'bold')
  doc.text('Setor:', col1x, 71)
  doc.setFont('helvetica', 'normal')
  doc.text(funcionario.setor, col1x + 12, 71)

  // Tabela de entregas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('HISTÓRICO DE ENTREGAS', 14, 88)

  autoTable(doc, {
    startY: 91,
    head: [['EPI', 'CA', 'Qtd', 'Data Entrega', 'Vencimento', 'Devolvido']],
    body: entregas.map((e) => [
      (e.epis as { nome: string } | null)?.nome ?? '-',
      (e.epis as { ca: string } | null)?.ca ?? '-',
      String(e.quantidade),
      formatDate(e.data_entrega),
      e.data_vencimento ? formatDate(e.data_vencimento) : '-',
      e.devolvido ? 'Sim' : 'Não',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Área de assinatura
  doc.setFontSize(9)
  doc.text('Declaro ter recebido os EPIs listados acima em perfeito estado de conservação, comprometendo-me a utilizá-los', 14, finalY)
  doc.text('adequadamente e devolvê-los quando solicitado.', 14, finalY + 5)

  const assinaturaY = finalY + 20

  // Linha de assinatura
  doc.line(14, assinaturaY + 15, 100, assinaturaY + 15)
  doc.setFontSize(8)
  doc.text('Assinatura do Funcionário', 14, assinaturaY + 20)
  doc.text(funcionario.nome, 14, assinaturaY + 25)

  doc.line(120, assinaturaY + 15, 196, assinaturaY + 15)
  doc.text('Data', 120, assinaturaY + 20)
  doc.text(`___/___/______`, 120, assinaturaY + 25)

  // Rodapé
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(`Documento gerado em ${formatDate(new Date())} — SafeTrack SST`, 105, 285, { align: 'center' })

  doc.save(`ficha-epi-${funcionario.matricula}.pdf`)
}
