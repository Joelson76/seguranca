import React, { useState } from 'react';
import { useEntregas } from '@/hooks/useEntregas';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useEpis } from '@/hooks/useEpis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AssinaturaCanvas } from '@/components/shared/AssinaturaCanvas';
import { gerarComprovante } from '@/utils/gerarComprovante';
import { toast } from 'sonner';

export default function NovaEntrega() {
  const { registrarEntrega } = useEntregas();
  const { funcionarios } = useFuncionarios();
  const { epis } = useEpis();

  const [funcionarioId, setFuncionarioId] = useState('');
  const [epiId, setEpiId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [assinaturaBlob, setAssinaturaBlob] = useState<Blob | null>(null);
  const [observacoes, setObservacoes] = useState('');

  const handleSalvarAssinatura = (blob: Blob) => {
    setAssinaturaBlob(blob);
    toast.success('Assinatura capturada!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!funcionarioId || !epiId || quantidade <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!assinaturaBlob) {
      toast.error('É necessário coletar a assinatura do funcionário');
      return;
    }

    const epiSelecionado = epis?.find(e => e.id === epiId);
    if (epiSelecionado && quantidade > epiSelecionado.estoque_atual) {
      toast.error('Quantidade solicitada maior que estoque disponível');
      return;
    }

    try {
      const dataVencimento = epiSelecionado?.vida_util_dias
        ? new Date(Date.now() + epiSelecionado.vida_util_dias * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      await registrarEntrega.mutateAsync({
        funcionario_id: funcionarioId,
        epi_id: epiId,
        quantidade,
        observacoes,
        data_vencimento: dataVencimento,
        assinaturaBlob,
      });

      const funcionario = funcionarios?.find(f => f.id === funcionarioId);
      const epi = epis?.find(e => e.id === epiId);

      if (funcionario && epi) {
        await gerarComprovante({
          funcionario: {
            nome: funcionario.nome,
            matricula: funcionario.matricula,
            cargo: funcionario.cargo,
            setor: funcionario.setor,
          },
          epi: {
            nome: epi.nome,
            ca: epi.ca,
          },
          quantidade,
          dataEntrega: new Date().toISOString(),
          assinaturaUrl: URL.createObjectURL(assinaturaBlob),
        });
      }

      setFuncionarioId('');
      setEpiId('');
      setQuantidade(1);
      setObservacoes('');
      setAssinaturaBlob(null);
    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nova Entrega de EPI</h1>
        <p className="text-muted-foreground">Registrar entrega com assinatura digital</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="funcionario">Funcionário *</Label>
              <select
                id="funcionario"
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                className="w-full mt-2 p-2 border rounded-md"
                required
              >
                <option value="">Selecione um funcionário</option>
                {funcionarios?.map(func => (
                  <option key={func.id} value={func.id}>
                    {func.matricula} - {func.nome} ({func.cargo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="epi">EPI *</Label>
              <select
                id="epi"
                value={epiId}
                onChange={(e) => setEpiId(e.target.value)}
                className="w-full mt-2 p-2 border rounded-md"
                required
              >
                <option value="">Selecione um EPI</option>
                {epis?.map(epi => (
                  <option key={epi.id} value={epi.id}>
                    {epi.nome} - CA: {epi.ca} (Estoque: {epi.estoque_atual})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full mt-2 p-2 border rounded-md"
                rows={3}
              />
            </div>

            <div>
              <Label>Assinatura do Funcionário *</Label>
              <div className="mt-2">
                <AssinaturaCanvas onSalvar={handleSalvarAssinatura} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={!assinaturaBlob}>
                Confirmar e Gerar Comprovante
              </Button>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
