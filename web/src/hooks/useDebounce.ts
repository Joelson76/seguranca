import { useState, useEffect } from 'react'

export function useDebounce<T>(valor: T, delay = 400): T {
  const [debouncado, setDebouncado] = useState<T>(valor)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncado(valor), delay)
    return () => clearTimeout(timer)
  }, [valor, delay])
  return debouncado
}
