import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, session, perfil, carregando, setUser, setSession, setPerfil, setCarregando, limpar } = useAuthStore()

  useEffect(() => {
    let mounted = true

    async function inicializar() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Erro ao obter sessão:', error)
          setCarregando(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await carregarPerfil(session.user.id)
        }
      } catch (err) {
        console.error('Erro na inicialização do auth:', err)
      } finally {
        if (mounted) {
          setCarregando(false)
        }
      }
    }

    inicializar()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await carregarPerfil(session.user.id)
      } else {
        limpar()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function carregarPerfil(userId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erro RLS/SQL ao carregar perfil:', error)
        setPerfil(null)
        return
      }

      if (data) {
        setPerfil(data)
      } else {
        console.warn('Usuário autenticado mas sem registro na tabela usuarios')
        setPerfil(null)
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      setPerfil(null)
    }
  }

  async function login(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    limpar()
  }

  return { user, session, perfil, carregando, login, logout }
}
