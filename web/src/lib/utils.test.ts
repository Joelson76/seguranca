import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatDateTime, formatCurrency, formatCPF, formatCNPJ } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('deve mesclar classes do Tailwind corretamente', () => {
      const result = cn('px-4 py-2', 'px-6')
      expect(result).toBe('py-2 px-6')
    })

    it('deve lidar com classes condicionais', () => {
      const result = cn('base-class', false && 'hidden-class', 'visible-class')
      expect(result).toBe('base-class visible-class')
    })
  })

  describe('formatDate', () => {
    it('deve formatar data no formato dd/MM/yyyy', () => {
      const date = new Date(2024, 2, 15)
      const result = formatDate(date)
      expect(result).toBe('15/03/2024')
    })

    it('deve aceitar string ISO', () => {
      const date = new Date(2024, 11, 25)
      const result = formatDate(date)
      expect(result).toBe('25/12/2024')
    })
  })

  describe('formatDateTime', () => {
    it('deve formatar data e hora no formato pt-BR', () => {
      const result = formatDateTime('2024-03-15T14:30:00')
      expect(result).toContain('15/03/2024')
      expect(result).toContain('14:30')
    })
  })

  describe('formatCurrency', () => {
    it('deve formatar valores monetários em BRL', () => {
      expect(formatCurrency(100)).toBe('R$\xa0100,00')
      expect(formatCurrency(1234.56)).toBe('R$\xa01.234,56')
      expect(formatCurrency(0)).toBe('R$\xa00,00')
    })

    it('deve lidar com valores negativos', () => {
      expect(formatCurrency(-50.5)).toBe('-R$\xa050,50')
    })
  })

  describe('formatCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00')
      expect(formatCPF('00000000000')).toBe('000.000.000-00')
    })

    it('não deve alterar CPF já formatado', () => {
      const cpfSemFormatacao = '98765432100'
      expect(formatCPF(cpfSemFormatacao)).toBe('987.654.321-00')
    })
  })

  describe('formatCNPJ', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90')
      expect(formatCNPJ('00000000000000')).toBe('00.000.000/0000-00')
    })
  })
})
