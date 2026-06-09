import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Usuario } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  perfil: Usuario | null
  carregando: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setPerfil: (perfil: Usuario | null) => void
  setCarregando: (v: boolean) => void
  limpar: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  perfil: null,
  carregando: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setPerfil: (perfil) => set({ perfil }),
  setCarregando: (carregando) => set({ carregando }),
  limpar: () => set({ user: null, session: null, perfil: null }),
}))
