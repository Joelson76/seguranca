import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { Users } from 'lucide-react'

describe('EmptyState', () => {
  it('deve renderizar título e descrição', () => {
    render(
      <EmptyState
        icon={Users}
        titulo="Nenhum funcionário encontrado"
        descricao="Comece adicionando seu primeiro funcionário"
      />
    )

    expect(screen.getByText('Nenhum funcionário encontrado')).toBeInTheDocument()
    expect(screen.getByText('Comece adicionando seu primeiro funcionário')).toBeInTheDocument()
  })

  it('deve renderizar apenas título sem descrição', () => {
    render(
      <EmptyState
        icon={Users}
        titulo="Nenhum resultado"
      />
    )

    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument()
  })

  it('deve renderizar o ícone correto', () => {
    const { container } = render(
      <EmptyState
        icon={Users}
        titulo="Teste"
      />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
