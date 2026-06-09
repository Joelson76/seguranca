import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DadosFuncionario {
  nome: string;
  matricula: string;
  cargo: string;
  setor: string;
}

interface ItemEpi {
  epi: string;
  ca: string;
  quantidade: number;
  dataEntrega: string;
  vencimento?: string;
  devolvido: boolean;
}

export async function gerarFichaEpi(
  funcionario: DadosFuncionario,
  itens: ItemEpi[],
  assinaturaUrl?: string,
  logoUrl?: string
) {
  const doc = new jsPDF();
  let yPos = 20;

  if (logoUrl) {
    try {
      doc.addImage(logoUrl, 'PNG', 15, yPos, 30, 30);
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
    }
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE CONTROLE DE EPI', logoUrl ? 50 : 15, yPos + 10);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('SafeTrack - Gestão de Segurança do Trabalho', logoUrl ? 50 : 15, yPos + 18);

  yPos += logoUrl ? 40 : 30;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Funcionário', 15, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${funcionario.nome}`, 15, yPos);
  yPos += 6;
  doc.text(`Matrícula: ${funcionario.matricula}`, 15, yPos);
  doc.text(`Cargo: ${funcionario.cargo}`, 105, yPos);
  yPos += 6;
  doc.text(`Setor: ${funcionario.setor}`, 15, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Histórico de EPIs', 15, yPos);
  yPos += 5;

  const tableData = itens.map(item => [
    item.epi,
    item.ca,
    item.quantidade.toString(),
    format(new Date(item.dataEntrega), 'dd/MM/yyyy', { locale: ptBR }),
    item.vencimento ? format(new Date(item.vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-',
    item.devolvido ? 'Sim' : 'Não'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['EPI', 'CA', 'Qtd', 'Data Entrega', 'Vencimento', 'Devolvido']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

  if (assinaturaUrl) {
    try {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Assinatura do Funcionário:', 15, finalY + 15);
      doc.addImage(assinaturaUrl, 'PNG', 15, finalY + 20, 60, 30);
    } catch (error) {
      console.warn('Erro ao carregar assinatura:', error);
    }
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    15,
    280
  );

  doc.save(`ficha-epi-${funcionario.matricula}.pdf`);
}
