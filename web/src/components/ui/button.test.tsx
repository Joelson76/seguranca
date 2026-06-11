import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('deve renderizar com texto correto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('deve chamar onClick quando clicado', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique</Button>)

    await user.click(screen.getByText('Clique'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('deve aplicar variante corretamente', () => {
    const { container } = render(<Button variant="destructive">Deletar</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('destructive')
  })

  it('deve estar desabilitado quando disabled=true', () => {
    render(<Button disabled>Desabilitado</Button>)
    expect(screen.getByText('Desabilitado')).toBeDisabled()
  })

  it('deve renderizar com tamanho sm', () => {
    const { container } = render(<Button size="sm">Pequeno</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('h-8')
  })

  it('deve renderizar como child quando asChild=true', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    )
    expect(screen.getByRole('link')).toBeInTheDocument()
  })
})
