import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card', () => {
  it('deve renderizar card completo', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
          <CardDescription>Descrição do card</CardDescription>
        </CardHeader>
        <CardContent>Conteúdo principal</CardContent>
        <CardFooter>Rodapé</CardFooter>
      </Card>
    )

    expect(screen.getByText('Título do Card')).toBeInTheDocument()
    expect(screen.getByText('Descrição do card')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo principal')).toBeInTheDocument()
    expect(screen.getByText('Rodapé')).toBeInTheDocument()
  })

  it('deve aceitar className customizado', () => {
    const { container } = render(<Card className="custom-class">Teste</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('deve renderizar apenas CardContent sem header', () => {
    render(
      <Card>
        <CardContent>Apenas conteúdo</CardContent>
      </Card>
    )

    expect(screen.getByText('Apenas conteúdo')).toBeInTheDocument()
  })
})
