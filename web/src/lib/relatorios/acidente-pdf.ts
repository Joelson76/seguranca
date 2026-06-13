import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Acidente, Testemunha, AcaoCorretiva, Checklist } from '@/hooks/useAcidentes'

const TIPOS_ACIDENTE: Record<string, string> = {
  acidente_com_afastamento: 'Acidente com afastamento',
  acidente_sem_afastamento: 'Acidente sem afastamento',
  acidente_de_trajeto: 'Acidente de trajeto',
  quase_acidente: 'Quase-acidente',
  incidente: 'Incidente',
  doenca_ocupacional: 'Doença ocupacional',
}

const STATUS_CAT: Record<string, string> = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  aceita: 'Aceita',
  rejeitada: 'Rejeitada',
}

const STATUS_ACAO: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export async function gerarRelatorioAcidentePDF(
  acidente: Acidente,
  testemunhas: Testemunha[],
  acoes: AcaoCorretiva[],
  checklist?: Checklist | null,
  tenantNome?: string
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Cabeçalho
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE INVESTIGAÇÃO DE ACIDENTE', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  if (tenantNome) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(tenantNome, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10
  }

  doc.setFontSize(9)
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // 1. DADOS DO ACIDENTE
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('1. DADOS DO ACIDENTE', 15, yPos)
  yPos += 7

  const dadosAcidente = [
    ['Funcionário', (acidente.funcionarios as any)?.nome ?? 'N/A'],
    ['Cargo', (acidente.funcionarios as any)?.cargo ?? 'N/A'],
    ['Setor', (acidente.funcionarios as any)?.setor ?? 'N/A'],
    ['Tipo de ocorrência', TIPOS_ACIDENTE[acidente.tipo] ?? acidente.tipo],
    ['Data da ocorrência', format(new Date(acidente.data_ocorrencia), 'dd/MM/yyyy', { locale: ptBR })],
    ['Hora da ocorrência', acidente.hora_ocorrencia ?? 'N/A'],
    ['Local da ocorrência', acidente.local_ocorrencia],
    ['Parte do corpo atingida', acidente.parte_corpo_atingida ?? 'N/A'],
    ['Gravidade (1-5)', acidente.gravidade?.toString() ?? 'N/A'],
    ['Dias de afastamento', acidente.dias_afastamento?.toString() ?? '0'],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: dadosAcidente,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // 2. DESCRIÇÃO
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('2. DESCRIÇÃO DO ACIDENTE', 15, yPos)
  yPos += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const descricaoLines = doc.splitTextToSize(acidente.descricao, pageWidth - 30)
  doc.text(descricaoLines, 15, yPos)
  yPos += descricaoLines.length * 5 + 10

  // 3. CAT
  if (acidente.cat) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('3. COMUNICAÇÃO DE ACIDENTE DE TRABALHO (CAT)', 15, yPos)
    yPos += 7

    const dadosCAT = [
      ['Número CAT', acidente.numero_cat ?? 'Não informado'],
      ['Status', STATUS_CAT[acidente.status_cat ?? 'pendente']],
      ['Data de emissão', acidente.data_emissao_cat ? format(new Date(acidente.data_emissao_cat), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'],
      ['Prazo', acidente.prazo_cat ? format(new Date(acidente.prazo_cat), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'],
    ]

    autoTable(doc, {
      startY: yPos,
      body: dadosCAT,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // 4. ANÁLISE DE CAUSAS
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('4. ANÁLISE DE CAUSAS', 15, yPos)
  yPos += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('Múltiplos métodos de análise podem ter sido utilizados', 15, yPos)
  yPos += 7

  // Causas básicas
  const dadosCausas = [
    ['Método principal', acidente.metodo_analise ?? 'Não definido'],
    ['Causa imediata', acidente.causa_imediata ?? 'Não informada'],
    ['Causa básica', acidente.causa_basica ?? 'Não informada'],
    ['Causa raiz', acidente.causa_raiz ?? 'Não informada'],
  ]

  autoTable(doc, {
    startY: yPos,
    body: dadosCausas,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // 4.1 ANÁLISE DETALHADA - 5 PORQUÊS
  const analiseDetalhada = acidente.analise_detalhada as any
  if (analiseDetalhada?.porques && analiseDetalhada.porques.some((p: string) => p)) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('4.1. Análise - 5 Porquês', 15, yPos)
    yPos += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Técnica de perguntas sucessivas para identificar a causa raiz', 15, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 7

    const porquesData = analiseDetalhada.porques
      .map((p: string, i: number) => [`Por quê ${i + 1}?`, p || 'Não informado'])
      .filter((_: any, i: number) => analiseDetalhada.porques[i]) // Só mostrar preenchidos

    autoTable(doc, {
      startY: yPos,
      body: porquesData,
      theme: 'striped',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30, fillColor: [59, 130, 246] }, // Azul
        1: { cellWidth: 'auto' },
      },
      headStyles: { fillColor: [59, 130, 246] },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // 4.2 ANÁLISE DETALHADA - ISHIKAWA (6M)
  if (analiseDetalhada?.ishikawa && Object.values(analiseDetalhada.ishikawa).some((v: any) => v)) {
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('4.2. Análise - Diagrama de Ishikawa (6M)', 15, yPos)
    yPos += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Análise por categorias: Método, Máquina, Material, Mão de obra, Meio ambiente e Medida', 15, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 7

    const ishikawaLabels: Record<string, string> = {
      metodo: 'Metodo',
      maquina: 'Maquina',
      material: 'Material',
      mao_de_obra: 'Mao de obra',
      meio_ambiente: 'Meio ambiente',
      medida: 'Medida',
    }

    const ishikawaData = Object.entries(analiseDetalhada.ishikawa)
      .filter(([_, v]: any) => v) // Só mostrar preenchidos
      .map(([k, v]: any) => [ishikawaLabels[k] || k, v])

    autoTable(doc, {
      startY: yPos,
      body: ishikawaData,
      theme: 'striped',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, fillColor: [139, 92, 246] }, // Roxo
        1: { cellWidth: 'auto' },
      },
      headStyles: { fillColor: [139, 92, 246] },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // 4.3 ANÁLISE DETALHADA - ÁRVORE DE CAUSAS
  if (analiseDetalhada?.arvore && Object.values(analiseDetalhada.arvore).some((v: any) => v)) {
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('4.3. Análise - Árvore de Causas', 15, yPos)
    yPos += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Análise hierárquica em 3 níveis: evento, causas diretas e causas estruturais', 15, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 7

    const arvoreData = [
      ['Nível 1 - Evento/Acidente', analiseDetalhada.arvore.nivel1 || 'Não informado'],
      ['Nível 2 - Causas Diretas', analiseDetalhada.arvore.nivel2 || 'Não informado'],
      ['Nível 3 - Causas Raízes', analiseDetalhada.arvore.nivel3 || 'Não informado'],
    ].filter(([_, v]) => v !== 'Não informado') // Só mostrar preenchidos

    autoTable(doc, {
      startY: yPos,
      body: arvoreData,
      theme: 'striped',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: [16, 185, 129] }, // Verde
        1: { cellWidth: 'auto' },
      },
      headStyles: { fillColor: [16, 185, 129] },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // 5. TESTEMUNHAS
  if (testemunhas.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`5. TESTEMUNHAS (${testemunhas.length})`, 15, yPos)
    yPos += 7

    const testemunhasData = testemunhas.map(t => [
      t.nome_testemunha,
      (t.funcionarios as any)?.cargo ?? 'Não funcionário',
      t.depoimento ?? 'Sem depoimento',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Cargo', 'Depoimento']],
      body: testemunhasData,
      theme: 'grid',
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // 6. AÇÕES CORRETIVAS
  if (acoes.length > 0) {
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`6. AÇÕES CORRETIVAS E PREVENTIVAS (${acoes.length})`, 15, yPos)
    yPos += 7

    const acoesData = acoes.map(a => [
      a.descricao,
      a.tipo_acao ?? 'N/A',
      a.responsavel_nome ?? (a.funcionarios as any)?.nome ?? 'N/A',
      format(new Date(a.prazo), 'dd/MM/yyyy', { locale: ptBR }),
      STATUS_ACAO[a.status],
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Tipo', 'Responsável', 'Prazo', 'Status']],
      body: acoesData,
      theme: 'grid',
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // 7. CHECKLIST DE INVESTIGAÇÃO
  if (checklist) {
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('7. CHECKLIST DE INVESTIGAÇÃO (NR-1)', 15, yPos)
    yPos += 7

    const checklistData = [
      ['Local preservado', checklist.local_preservado ? 'Sim' : 'Não'],
      ['Fotos realizadas', checklist.fotos_realizadas ? 'Sim' : 'Não'],
      ['Testemunhas ouvidas', checklist.testemunhas_ouvidas ? 'Sim' : 'Não'],
      ['EPI analisado', checklist.epi_analisado ? 'Sim' : 'Não'],
      ['Condições ambientais verificadas', checklist.condicoes_ambiente_verificadas ? 'Sim' : 'Não'],
      ['Procedimentos revisados', checklist.procedimentos_revisados ? 'Sim' : 'Não'],
      ['Treinamento verificado', checklist.treinamento_verificado ? 'Sim' : 'Não'],
      ['Equipamentos inspecionados', checklist.equipamentos_inspecionados ? 'Sim' : 'Não'],
      ['Relatório elaborado', checklist.relatorio_elaborado ? 'Sim' : 'Não'],
      ['Ações imediatas tomadas', checklist.acoes_imediatas_tomadas ? 'Sim' : 'Não'],
    ]

    autoTable(doc, {
      startY: yPos,
      body: checklistData,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { cellWidth: 'auto', halign: 'center' },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10

    if (checklist.observacoes) {
      if (yPos > 260) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Observações:', 15, yPos)
      yPos += 5

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const obsLines = doc.splitTextToSize(checklist.observacoes, pageWidth - 30)
      doc.text(obsLines, 15, yPos)
      yPos += obsLines.length * 5
    }
  }

  // 8. ASSINATURAS
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  yPos += 20
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('8. ASSINATURAS', 15, yPos)
  yPos += 20

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Responsável investigação
  doc.line(15, yPos, 95, yPos)
  doc.text('Responsável pela investigação', 15, yPos + 5)

  doc.line(105, yPos, 185, yPos)
  doc.text('SESMT / Técnico de Segurança', 105, yPos + 5)

  yPos += 20

  doc.line(15, yPos, 95, yPos)
  doc.text('Data: ___/___/______', 15, yPos + 5)

  doc.line(105, yPos, 185, yPos)
  doc.text('Data: ___/___/______', 105, yPos + 5)

  // Salvar PDF
  const fileName = `Acidente_${acidente.funcionarios?.nome?.replace(/\s+/g, '_') ?? 'Desconhecido'}_${format(new Date(acidente.data_ocorrencia), 'ddMMyyyy')}.pdf`
  doc.save(fileName)
}
