import { Shield, Users, BookOpen, AlertTriangle, BarChart3, FileText, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const funcionalidades = [
  { icon: Users, titulo: 'Gestão de Funcionários', desc: 'Cadastre e acompanhe todos os funcionários com histórico completo de EPIs, treinamentos e acidentes.' },
  { icon: Shield, titulo: 'Controle de EPIs', desc: 'Gerencie estoque, emita comprovantes com assinatura digital e receba alertas de reposição automáticos.' },
  { icon: BookOpen, titulo: 'Treinamentos e NRs', desc: 'Registre participações, acompanhe vencimentos e mantenha a equipe sempre em conformidade.' },
  { icon: AlertTriangle, titulo: 'Acidentes e Incidentes', desc: 'Registre ocorrências, conduza investigações e emita relatórios completos para o eSocial.' },
  { icon: FileText, titulo: 'Repositório de Documentos', desc: 'Armazene PCMSO, PGR, PPRA, LTCAT e demais documentos com controle de validade.' },
  { icon: BarChart3, titulo: 'Relatórios e Dashboards', desc: 'Visualize indicadores em tempo real e exporte relatórios em PDF para auditorias.' },
]

const planos = [
  { nome: 'Básico', preco: 149, cor: 'border-border', destaque: false, funcionalidades: ['Até 50 funcionários', '1 usuário administrador', 'Controle de EPIs', 'Treinamentos básicos', 'Relatórios PDF', 'Suporte por e-mail'] },
  { nome: 'Profissional', preco: 349, cor: 'border-primary', destaque: true, funcionalidades: ['Até 200 funcionários', 'Até 5 usuários', 'Tudo do plano Básico', 'Gestão de acidentes', 'Documentos ilimitados', 'Alertas automáticos', 'Suporte prioritário'] },
  { nome: 'Enterprise', preco: 749, cor: 'border-border', destaque: false, funcionalidades: ['Funcionários ilimitados', 'Usuários ilimitados', 'Tudo do Profissional', 'API de integração', 'Relatórios avançados', 'Onboarding dedicado', 'SLA garantido'] },
]

const depoimentos = [
  { nome: 'Carlos Mendes', cargo: 'SESMT — Metalúrgica Alfa', texto: 'Com o SafeTrack reduzimos 60% do tempo gasto com controle de EPIs. A assinatura digital foi um divisor de águas na nossa operação.' },
  { nome: 'Dra. Renata Sousa', cargo: 'Médica do Trabalho — Clínica OcupaSaúde', texto: 'Atendo mais de 15 empresas clientes e o SafeTrack centralizou tudo. Consigo acompanhar treinamentos e documentos de todos em um só lugar.' },
  { nome: 'Roberto Figueiredo', cargo: 'Técnico SST — Construtora Norte', texto: 'Os alertas automáticos me salvaram de várias não-conformidades. Recomendo para qualquer técnico que gerencia muitos funcionários.' },
]

const faqs = [
  { pergunta: 'O SafeTrack é adequado para empresas de qualquer porte?', resposta: 'Sim! Temos planos que atendem desde pequenas empresas com 10 funcionários até grandes corporações com equipes ilimitadas.' },
  { pergunta: 'Como funciona a assinatura digital de entrega de EPI?', resposta: 'O funcionário assina diretamente na tela (tablet ou celular) e o comprovante é gerado automaticamente em PDF com validade jurídica.' },
  { pergunta: 'Os dados ficam seguros e separados por empresa?', resposta: 'Sim. Utilizamos isolamento total de dados (multi-tenant) com Row Level Security no banco de dados. Cada empresa só acessa seus próprios dados.' },
  { pergunta: 'Posso importar dados de planilhas existentes?', resposta: 'Sim! Oferecemos importação via CSV para funcionários, EPIs e histórico de treinamentos. Nossa equipe auxilia no processo de migração.' },
  { pergunta: 'Funciona em dispositivos móveis?', resposta: 'Completamente! O SafeTrack foi desenvolvido para funcionar perfeitamente em smartphones e tablets via browser, sem precisar instalar aplicativo.' },
]

function FAQ({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between p-4 text-left font-medium text-sm hover:bg-muted/30 transition-colors"
      >
        {pergunta}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && <div className="px-4 pb-4 text-sm text-muted-foreground">{resposta}</div>}
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5"><Shield className="h-5 w-5 text-white" /></div>
            <span className="font-bold text-lg">SafeTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><a href="/login">Entrar</a></Button>
            <Button size="sm" asChild><a href="/registro">Começar grátis</a></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6">30 dias grátis — sem cartão de crédito</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Gerencie a segurança da sua equipe{' '}
            <span className="text-primary">em um só lugar</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma completa de SST para controle de EPIs, treinamentos, acidentes e documentos. Conformidade com as NRs sem complicação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild><a href="/registro">Começar agora — 30 dias grátis</a></Button>
            <Button size="lg" variant="outline">Ver demonstração</Button>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Tudo que você precisa para o SST</h2>
            <p className="text-muted-foreground">Módulos integrados para gestão completa de segurança e saúde no trabalho</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funcionalidades.map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
                <div className="bg-primary/10 rounded-lg p-2.5 w-fit mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{titulo}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Para quem é o SafeTrack?</h2>
          <p className="text-muted-foreground mb-10">Desenvolvido para os profissionais que mantêm o ambiente de trabalho seguro</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { titulo: 'Empresas', desc: 'Gerencie o SST de toda a equipe, com controle de EPIs, treinamentos obrigatórios e gestão de acidentes em conformidade com a legislação.' },
              { titulo: 'Consultorias SST', desc: 'Administre múltiplos clientes em uma única plataforma. Cada empresa tem seus dados isolados e você acessa tudo com um login.' },
              { titulo: 'Técnicos de Segurança', desc: 'Tenha todas as ferramentas para seu dia a dia: fichas de EPI, controle de vencimentos, registro de acidentes e relatórios prontos para auditoria.' },
            ].map(({ titulo, desc }) => (
              <div key={titulo} className="p-6 rounded-xl border text-left">
                <h3 className="font-semibold mb-2">{titulo}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Planos e preços</h2>
            <p className="text-muted-foreground">Escolha o plano ideal para o tamanho da sua operação</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planos.map((plano) => (
              <div key={plano.nome} className={`bg-white dark:bg-gray-900 rounded-xl p-6 border-2 ${plano.cor} ${plano.destaque ? 'shadow-lg relative' : ''}`}>
                {plano.destaque && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais popular</Badge>
                )}
                <h3 className="font-bold text-lg">{plano.nome}</h3>
                <div className="my-4">
                  <span className="text-3xl font-bold">R$ {plano.preco}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plano.funcionalidades.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plano.destaque ? 'default' : 'outline'} asChild>
                  <a href="/registro">Começar agora</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">O que nossos clientes dizem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map(({ nome, cargo, texto }) => (
              <div key={nome} className="p-6 rounded-xl border bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">"{texto}"</p>
                <div>
                  <p className="font-semibold text-sm">{nome}</p>
                  <p className="text-xs text-muted-foreground">{cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => <FAQ key={faq.pergunta} {...faq} />)}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">Comece a usar hoje mesmo</h2>
          <p className="text-primary-foreground/80 mb-8">
            30 dias gratuitos, sem cartão de crédito, sem burocracia. Configure sua empresa em menos de 5 minutos.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/registro">Começar agora — 30 dias grátis</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1"><Shield className="h-4 w-4 text-white" /></div>
            <span className="font-bold">SafeTrack</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Termos de uso</a>
            <a href="#" className="hover:text-foreground">Contato</a>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 SafeTrack. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
