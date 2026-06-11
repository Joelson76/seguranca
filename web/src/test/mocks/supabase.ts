import { vi } from 'vitest'

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
}

export function createMockFuncionarios() {
  return [
    {
      id: '1',
      nome: 'João Silva',
      cpf: '12345678900',
      email: 'joao@example.com',
      cargo: 'Operador',
      setor: 'Produção',
      data_admissao: '2024-01-15',
      status: 'ativo',
      tenant_id: 'tenant-1',
      criado_em: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      nome: 'Maria Santos',
      cpf: '98765432100',
      email: 'maria@example.com',
      cargo: 'Engenheira',
      setor: 'Engenharia',
      data_admissao: '2024-02-01',
      status: 'ativo',
      tenant_id: 'tenant-1',
      criado_em: '2024-02-01T00:00:00Z',
    },
  ]
}

export function createMockEpis() {
  return [
    {
      id: '1',
      nome: 'Capacete de Segurança',
      ca: '12345',
      tipo: 'Proteção da cabeça',
      quantidade_estoque: 50,
      quantidade_minima: 10,
      tenant_id: 'tenant-1',
    },
    {
      id: '2',
      nome: 'Luvas de Proteção',
      ca: '67890',
      tipo: 'Proteção das mãos',
      quantidade_estoque: 5,
      quantidade_minima: 20,
      tenant_id: 'tenant-1',
    },
  ]
}
