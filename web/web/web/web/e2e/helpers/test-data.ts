export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'teste.e2e@safetrack.com',
  password: process.env.TEST_USER_PASSWORD || 'Teste@123456',
  nome: 'Usuário Teste E2E',
  empresa: 'SafeTrack Testes',
}

export function generateRandomEmail() {
  const timestamp = Date.now()
  return `teste-${timestamp}@safetrack.test`
}

export function generateRandomCPF() {
  // Gera CPF fake para testes (não válido)
  return String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')
}

export const TEST_FUNCIONARIO = {
  nome: 'João da Silva Teste',
  cpf: '12345678900',
  cargo: 'Operador de Máquinas',
  setor: 'Produção',
  matricula: 'FUNC-001',
}

export const TEST_EPI = {
  nome: 'Capacete de Segurança Teste',
  ca: '12345',
  tipo: 'Proteção da cabeça',
  validade_ca: '2025-12-31',
  quantidade_estoque: 100,
  quantidade_minima: 10,
}
