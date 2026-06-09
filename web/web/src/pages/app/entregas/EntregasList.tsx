import React, { useState } from 'react';
import { useEntregas } from '@/hooks/useEntregas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileDown, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EntregasList() {
  const { entregas, isLoading } = useEntregas();
  const [filtro, setFiltro] = useState('');

  const entregasFiltradas = entregas?.filter(entrega =>
    entrega.funcionarios?.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    entrega.funcionarios?.matricula.toLowerCase().includes(filtro.toLowerCase()) ||
    entrega.epis?.nome.toLowerCase().includes(filtro.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="p-8">Carregando entregas...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Entregas de EPI</h1>
          <p className="text-muted-foreground">Registrar e acompanhar entregas de equipamentos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrega
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário, matrícula ou EPI..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-3">
        {entregasFiltradas.map((entrega) => (
          <Card key={entrega.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {entrega.funcionarios?.nome} ({entrega.funcionarios?.matricula})
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {entrega.funcionarios?.cargo} - {entrega.funcionarios?.setor}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">EPI: </span>
                        <span className="font-medium">{entrega.epis?.nome}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CA: </span>
                        <span className="font-medium">{entrega.epis?.ca}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantidade: </span>
                        <span className="font-medium">{entrega.quantidade}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data: </span>
                        <span className="font-medium">
                          {format(new Date(entrega.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {entrega.devolvido ? (
                    <Badge variant="secondary">Devolvido</Badge>
                  ) : (
                    <Badge variant="success">Em uso</Badge>
                  )}
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    Comprovante
                  </Button>
                  {!entrega.devolvido && (
                    <Button variant="outline" size="sm">
                      Registrar Devolução
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {entregasFiltradas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma entrega encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
