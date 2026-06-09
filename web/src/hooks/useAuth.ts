import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, session, perfil, carregando, setUser, setSession, setPerfil, setCarregando, limpar } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await carregarPerfil(session.user.id)
      }
      setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await carregarPerfil(session.user.id)
      } else {
        limpar()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function carregarPerfil(userId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        setPerfil(data)
      } else {
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
