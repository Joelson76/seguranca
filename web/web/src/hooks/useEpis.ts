import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Epi {
  id: string;
  tenant_id: string;
  nome: string;
  descricao?: string;
  ca: string;
  ca_validade: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  vida_util_dias?: number;
  fornecedor?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface EstoqueMovimento {
  id: string;
  tenant_id: string;
  epi_id: string;
  tipo: 'entrada' | 'saida' | 'ajuste' | 'devolucao' | 'descarte';
  quantidade: number;
  motivo?: string;
  documento?: string;
  criado_em: string;
  criado_por?: string;
}

export function useEpis() {
  const queryClient = useQueryClient();

  const { data: epis, isLoading, error } = useQuery({
    queryKey: ['epis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epis')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Epi[];
    },
  });

  const criarEpi = useMutation({
    mutationFn: async (epi: Partial<Epi>) => {
      const { data, error } = await supabase
        .from('epis')
        .insert([epi])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast.success('EPI cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao cadastrar EPI: ${error.message}`);
    },
  });

  const atualizarEpi = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Epi> & { id: string }) => {
      const { data, error } = await supabase
        .from('epis')
        .update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast.success('EPI atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar EPI: ${error.message}`);
    },
  });

  const desativarEpi = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('epis')
        .update({ ativo: false, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast.success('EPI desativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao desativar EPI: ${error.message}`);
    },
  });

  const registrarMovimento = useMutation({
    mutationFn: async (movimento: Partial<EstoqueMovimento>) => {
      const { data: epiAtual, error: epiError } = await supabase
        .from('epis')
        .select('estoque_atual')
        .eq('id', movimento.epi_id)
        .single();

      if (epiError) throw epiError;

      let novoEstoque = epiAtual.estoque_atual;

      if (movimento.tipo === 'entrada') {
        novoEstoque += movimento.quantidade!;
      } else if (['saida', 'descarte'].includes(movimento.tipo!)) {
        novoEstoque -= movimento.quantidade!;
      } else if (movimento.tipo === 'ajuste') {
        novoEstoque = movimento.quantidade!;
      } else if (movimento.tipo === 'devolucao') {
        novoEstoque += movimento.quantidade!;
      }

      if (novoEstoque < 0) {
        throw new Error('Estoque não pode ficar negativo');
      }

      const { data: user } = await supabase.auth.getUser();

      const { error: movError } = await supabase
        .from('estoque_movimentos')
        .insert([{ ...movimento, criado_por: user.user?.id }]);

      if (movError) throw movError;

      const { error: updateError } = await supabase
        .from('epis')
        .update({
          estoque_atual: novoEstoque,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', movimento.epi_id);

      if (updateError) throw updateError;

      return { novoEstoque };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-movimentos'] });
      toast.success('Movimento de estoque registrado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar movimento: ${error.message}`);
    },
  });

  return {
    epis,
    isLoading,
    error,
    criarEpi,
    atualizarEpi,
    desativarEpi,
    registrarMovimento,
  };
}

export function useEstoqueMovimentos(epiId?: string) {
  const { data: movimentos, isLoading } = useQuery({
    queryKey: ['estoque-movimentos', epiId],
    queryFn: async () => {
      let query = supabase
        .from('estoque_movimentos')
        .select('*, epis(nome)')
        .order('criado_em', { ascending: false });

      if (epiId) {
        query = query.eq('epi_id', epiId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data;
    },
    enabled: epiId !== undefined || epiId === undefined,
  });

  return { movimentos, isLoading };
}
