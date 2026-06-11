import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useEffect, lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/shared/AppLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'

// Lazy loading — cada página carrega sob demanda
const Landing        = lazy(() => import('@/pages/Landing'))
const Login          = lazy(() => import('@/pages/auth/Login'))
const Registro       = lazy(() => import('@/pages/auth/Registro'))
const Onboarding      = lazy(() => import('@/pages/Onboarding'))
const RecuperarSenha  = lazy(() => import('@/pages/auth/EsqueciSenha'))
const NovaSenha       = lazy(() => import('@/pages/auth/NovaSenha'))
const Dashboard      = lazy(() => import('@/pages/Dashboard'))
const Funcionarios   = lazy(() => import('@/pages/Funcionarios'))
const FichaFunc      = lazy(() => import('@/pages/FichaFuncionario'))
const Epis           = lazy(() => import('@/pages/Epis'))
const Entregas       = lazy(() => import('@/pages/Entregas'))
const Treinamentos   = lazy(() => import('@/pages/Treinamentos'))
const MatrizTrein    = lazy(() => import('@/pages/MatrizTreinamentos'))
const Acidentes      = lazy(() => import('@/pages/Acidentes'))
const Documentos     = lazy(() => import('@/pages/Documentos'))
const Relatorios     = lazy(() => import('@/pages/Relatorios'))
const Notificacoes   = lazy(() => import('@/pages/app/Notificacoes').then(m => ({ default: m.Notificacoes })))
const Configuracoes  = lazy(() => import('@/pages/Configuracoes'))
const ExportarDados  = lazy(() => import('@/pages/ExportarDados'))
const ExcluirConta   = lazy(() => import('@/pages/ExcluirConta'))
const SuperAdmin     = lazy(() => import('@/pages/SuperAdmin'))
const Diagnostico    = lazy(() => import('@/pages/Diagnostico'))
const NotFound       = lazy(() => import('@/pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 0 },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function ThemeInit() {
  const { tema } = useUIStore()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
  }, [tema])
  return null
}

function AuthInit() {
  useAuth()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInit />
        <AuthInit />
        <Toaster position="top-right" richColors closeButton />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/nova-senha" element={<NovaSenha />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/app/dashboard" element={<Dashboard />} />
                <Route path="/app/funcionarios" element={<Funcionarios />} />
                <Route path="/app/funcionarios/:id" element={<FichaFunc />} />
                <Route path="/app/epis" element={<Epis />} />
                <Route path="/app/entregas" element={<Entregas />} />
                <Route path="/app/treinamentos" element={<Treinamentos />} />
                <Route path="/app/treinamentos/matriz" element={<MatrizTrein />} />
                <Route path="/app/acidentes" element={<Acidentes />} />
                <Route path="/app/documentos" element={<Documentos />} />
                <Route path="/app/relatorios" element={<Relatorios />} />
                <Route path="/app/notificacoes" element={<Notificacoes />} />
                <Route path="/app/configuracoes" element={<Configuracoes />} />
                <Route path="/app/exportar-dados" element={<ExportarDados />} />
                <Route path="/app/excluir-conta" element={<ExcluirConta />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute perfisPermitidos={['super_admin']}>
                      <SuperAdmin />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
