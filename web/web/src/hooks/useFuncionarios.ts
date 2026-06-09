import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Funcionario {
  id: string;
  tenant_id: string;
  matricula: string;
  nome: string;
  cpf: string;
  cargo: string;
  setor: string;
  data_admissao: string;
  ativo: boolean;
  foto_url?: string;
  assinatura_url?: string;
  criado_em: string;
  atualizado_em: string;
}

export function useFuncionarios() {
  const queryClient = useQueryClient();

  const { data: funcionarios, isLoading, error } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Funcionario[];
    },
  });

  const criarFuncionario = useMutation({
    mutationFn: async (funcionario: Partial<Funcionario>) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([funcionario])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast.success('Funcionário cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao cadastrar funcionário: ${error.message}`);
    },
  });

  const atualizarFuncionario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Funcionario> & { id: string }) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast.success('Funcionário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar funcionário: ${error.message}`);
    },
  });

  const desativarFuncionario = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .update({ ativo: false, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast.success('Funcionário desativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao desativar funcionário: ${error.message}`);
    },
  });

  return {
    funcionarios,
    isLoading,
    error,
    criarFuncionario,
    atualizarFuncionario,
    desativarFuncionario,
  };
}
