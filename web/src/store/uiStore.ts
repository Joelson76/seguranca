import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarAberta: boolean
  tema: 'light' | 'dark'
  toggleSidebar: () => void
  setSidebarAberta: (v: boolean) => void
  toggleTema: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarAberta: true,
      tema: 'light',
      toggleSidebar: () => set((s) => ({ sidebarAberta: !s.sidebarAberta })),
      setSidebarAberta: (v) => set({ sidebarAberta: v }),
      toggleTema: () =>
        set((s) => {
          const novoTema = s.tema === 'light' ? 'dark' : 'light'
          document.documentElement.classList.toggle('dark', novoTema === 'dark')
          return { tema: novoTema }
        }),
    }),
    { name: 'safetrack-ui' }
  )
)
