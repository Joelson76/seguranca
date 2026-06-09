# SafeTrack — SaaS de Gestão SST

## Stack
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- Frontend: React 18 + Vite + TailwindCSS + shadcn/ui (manual)
- PDF: jsPDF + jspdf-autotable (geração no browser)
- Roteamento: react-router-dom
- Estado global: Zustand (apenas UI e auth)
- Cache/queries: TanStack Query v5 + Supabase client
- Formulários: React Hook Form + Zod
- Gráficos: Recharts
- Notificações: Sonner

## Regras de desenvolvimento
1. NUNCA filtrar manualmente por tenant_id no frontend — o RLS do Supabase faz isso automaticamente
2. Toda query usa o cliente Supabase: `supabase.from('tabela').select()`
3. Uploads sempre via Supabase Storage — nunca armazenar arquivos localmente
4. Autenticação exclusivamente via Supabase Auth — não criar JWT manual
5. Mensagens de erro e interface em português (pt-BR)
6. Datas exibidas no formato dd/MM/yyyy usando date-fns com locale pt-BR
7. Valores monetários exibidos em BRL com Intl.NumberFormat
8. Notificações in-app via Supabase Realtime (tabela notificacoes)

## Padrões de código
- Hooks customizados para cada entidade: useFuncionarios, useEpis, useEntregas etc.
- React Query para cache e revalidação das queries Supabase
- Zustand apenas para estado de UI (sidebar, tema) e auth (user, perfil)
- Erros do Supabase tratados nos hooks com toast.error()
- Aliases de path: `@/` aponta para `web/src/`

## Variáveis de ambiente (web/.env.local)
- VITE_SUPABASE_URL → URL do projeto Supabase
- VITE_SUPABASE_ANON_KEY → chave pública anon

## Estrutura de pastas (web/src/)
- components/ui/       → componentes shadcn/ui (Button, Input, Card, Dialog etc.)
- components/shared/   → layout (AppLayout, Sidebar, Header, ProtectedRoute)
- pages/               → uma página por rota
- hooks/               → hooks de dados (useFuncionarios, useEpis etc.)
- store/               → Zustand stores (authStore, uiStore)
- lib/                 → supabase.ts, utils.ts

## Banco de dados — rodar no Supabase SQL Editor
Ver arquivos em: supabase/migrations/

## Buckets Supabase Storage
- documentos (privado)
- assinaturas (privado)
- fotos-funcionario (privado)
- certificados (privado)
- logos (público)

## Fases concluídas
- [x] Fase 1: Setup + Auth + Banco + Funcionários
- [x] Fase 2: EPIs + Estoque + Entregas
- [x] Fase 3: Treinamentos + Documentos
- [x] Fase 4: Acidentes + Relatórios + Dashboard
- [x] Fase 5: Edge Functions + Notificações
- [x] Fase 6: Billing + Admin + Deploy

## ✅ Projeto 100% Concluído!
SafeTrack está pronto para produção. Ver DEPLOY_VERCEL.md para instruções de deploy.
