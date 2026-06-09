import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DadosComprovante {
  funcionario: {
    nome: string;
    matricula: string;
    cargo: string;
    setor: string;
  };
  epi: {
    nome: string;
    ca: string;
  };
  quantidade: number;
  dataEntrega: string;
  assinaturaUrl?: string;
  logoUrl?: string;
}

export async function gerarComprovante(dados: DadosComprovante) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPos = 20;

  if (dados.logoUrl) {
    try {
      doc.addImage(dados.logoUrl, 'PNG', 15, yPos, 25, 25);
      yPos += 5;
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
    }
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROVANTE DE ENTREGA DE EPI', dados.logoUrl ? 45 : 15, yPos + 10);
  
  yPos += 20;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, 180, 90);

  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionário:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.funcionario.nome, 50, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.funcionario.matricula, 50, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cargo:', 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.funcionario.cargo, 130, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Setor:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.funcionario.setor, 50, yPos);
  yPos += 12;

  doc.setLineWidth(0.3);
  doc.line(20, yPos, 190, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('EPI Entregue:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.epi.nome, 50, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('CA (Certificado de Aprovação):', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.epi.ca, 85, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Quantidade:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.quantidade.toString(), 50, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Data da Entrega:', 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    format(new Date(dados.dataEntrega), 'dd/MM/yyyy', { locale: ptBR }),
    150,
    yPos
  );
  yPos += 12;

  doc.setLineWidth(0.3);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Assinatura do Funcionário:', 20, yPos);
  yPos += 5;

  if (dados.assinaturaUrl) {
    try {
      doc.addImage(dados.assinaturaUrl, 'PNG', 20, yPos, 50, 25);
    } catch (error) {
      console.warn('Erro ao carregar assinatura:', error);
      doc.setDrawColor(150);
      doc.rect(20, yPos, 50, 25);
    }
  } else {
    doc.setDrawColor(150);
    doc.rect(20, yPos, 50, 25);
  }

  yPos += 35;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Declaro ter recebido o(s) equipamento(s) de proteção individual acima relacionado(s),',
    20,
    yPos
  );
  yPos += 5;
  doc.text(
    'comprometendo-me a usá-lo(s) durante o trabalho e conservá-lo(s) adequadamente.',
    20,
    yPos
  );

  yPos += 15;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - SafeTrack`,
    15,
    280
  );

  doc.save(`comprovante-epi-${dados.funcionario.matricula}-${Date.now()}.pdf`);
}
