import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface EntregaEpi {
  id: string;
  tenant_id: string;
  funcionario_id: string;
  epi_id: string;
  quantidade: number;
  data_entrega: string;
  data_vencimento?: string;
  motivo_devolucao?: string;
  devolvido: boolean;
  data_devolucao?: string;
  assinado_por?: string;
  observacoes?: string;
  criado_por?: string;
  funcionarios?: {
    nome: string;
    matricula: string;
    cargo: string;
    setor: string;
  };
  epis?: {
    nome: string;
    ca: string;
  };
}

export function useEntregas(filters?: {
  funcionarioId?: string;
  epiId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  const queryClient = useQueryClient();

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['entregas', filters],
    queryFn: async () => {
      let query = supabase
        .from('entregas_epi')
        .select(`
          *,
          funcionarios(nome, matricula, cargo, setor),
          epis(nome, ca)
        `)
        .order('data_entrega', { ascending: false });

      if (filters?.funcionarioId) {
        query = query.eq('funcionario_id', filters.funcionarioId);
      }
      if (filters?.epiId) {
        query = query.eq('epi_id', filters.epiId);
      }
      if (filters?.dataInicio) {
        query = query.gte('data_entrega', filters.dataInicio);
      }
      if (filters?.dataFim) {
        query = query.lte('data_entrega', filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EntregaEpi[];
    },
  });

  const registrarEntrega = useMutation({
    mutationFn: async (entrega: Partial<EntregaEpi> & { assinaturaBlob?: Blob }) => {
      const { assinaturaBlob, ...entregaData } = entrega;

      let assinaturaUrl: string | undefined;

      if (assinaturaBlob) {
        const fileName = `assinatura-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assinaturas')
          .upload(fileName, assinaturaBlob, {
            contentType: 'image/png',
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('assinaturas')
          .getPublicUrl(uploadData.path);

        assinaturaUrl = urlData.publicUrl;
      }

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('entregas_epi')
        .insert([{
          ...entregaData,
          assinado_por: assinaturaUrl,
          criado_por: user.user?.id,
        }])
        .select(`
          *,
          funcionarios(nome, matricula, cargo, setor),
          epis(nome, ca)
        `)
        .single();

      if (error) throw error;

      const { error: movError } = await supabase
        .from('estoque_movimentos')
        .insert([{
          epi_id: entregaData.epi_id,
          tipo: 'saida',
          quantidade: entregaData.quantidade,
          motivo: 'Entrega ao funcionário',
          criado_por: user.user?.id,
        }]);

      if (movError) throw movError;

      const { data: epiAtual, error: epiError } = await supabase
        .from('epis')
        .select('estoque_atual')
        .eq('id', entregaData.epi_id)
        .single();

      if (epiError) throw epiError;

      const { error: updateError } = await supabase
        .from('epis')
        .update({
          estoque_atual: epiAtual.estoque_atual - entregaData.quantidade!,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', entregaData.epi_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-movimentos'] });
      toast.success('Entrega registrada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar entrega: ${error.message}`);
    },
  });

  const registrarDevolucao = useMutation({
    mutationFn: async ({
      id,
      motivo_devolucao,
      quantidade_devolvida
    }: {
      id: string;
      motivo_devolucao: string;
      quantidade_devolvida?: number;
    }) => {
      const { data: entrega, error: entregaError } = await supabase
        .from('entregas_epi')
        .select('*, epis(estoque_atual)')
        .eq('id', id)
        .single();

      if (entregaError) throw entregaError;

      const quantidadeDevolver = quantidade_devolvida || entrega.quantidade;

      const { data, error } = await supabase
        .from('entregas_epi')
        .update({
          devolvido: true,
          data_devolucao: new Date().toISOString(),
          motivo_devolucao,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { data: user } = await supabase.auth.getUser();

      const { error: movError } = await supabase
        .from('estoque_movimentos')
        .insert([{
          epi_id: entrega.epi_id,
          tipo: 'devolucao',
          quantidade: quantidadeDevolver,
          motivo: motivo_devolucao,
          criado_por: user.user?.id,
        }]);

      if (movError) throw movError;

      const { error: updateError } = await supabase
        .from('epis')
        .update({
          estoque_atual: entrega.epis.estoque_atual + quantidadeDevolver,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', entrega.epi_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-movimentos'] });
      toast.success('Devolução registrada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar devolução: ${error.message}`);
    },
  });

  return {
    entregas,
    isLoading,
    registrarEntrega,
    registrarDevolucao,
  };
}
