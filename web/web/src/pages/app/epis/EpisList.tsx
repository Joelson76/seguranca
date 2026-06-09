import React, { useState } from 'react';
import { useEpis } from '@/hooks/useEpis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EpisList() {
  const { epis, isLoading } = useEpis();
  const [filtro, setFiltro] = useState('');

  const episFiltrados = epis?.filter(epi =>
    epi.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    epi.categoria.toLowerCase().includes(filtro.toLowerCase()) ||
    epi.ca.toLowerCase().includes(filtro.toLowerCase())
  ) || [];

  const getStatusEstoque = (epi: any) => {
    if (epi.estoque_atual <= epi.estoque_minimo) {
      return { cor: 'destructive', texto: 'Crítico' };
    } else if (epi.estoque_atual <= epi.estoque_minimo * 1.5) {
      return { cor: 'warning', texto: 'Baixo' };
    }
    return { cor: 'success', texto: 'Normal' };
  };

  if (isLoading) {
    return <div className="p-8">Carregando EPIs...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">EPIs</h1>
          <p className="text-muted-foreground">Gerenciar equipamentos de proteção individual</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo EPI
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, categoria ou CA..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {episFiltrados.map((epi) => {
          const status = getStatusEstoque(epi);
          return (
            <Card key={epi.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{epi.nome}</CardTitle>
                  <Badge variant={status.cor as any}>{status.texto}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">CA</p>
                    <p className="font-medium">{epi.ca}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Categoria</p>
                    <p className="font-medium">{epi.categoria}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estoque Atual</p>
                    <p className="font-bold text-lg">{epi.estoque_atual}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estoque Mínimo</p>
                    <p className="font-medium">{epi.estoque_minimo}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Validade CA</p>
                    <p className="font-medium">
                      {format(new Date(epi.ca_validade), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {epi.estoque_atual <= epi.estoque_minimo && (
                  <div className="flex items-center gap-2 text-destructive text-sm mt-3 p-2 bg-destructive/10 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>Estoque abaixo do mínimo!</span>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    Movimentar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {episFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum EPI encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
