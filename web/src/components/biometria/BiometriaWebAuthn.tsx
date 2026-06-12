import { useState } from 'react'
import { Fingerprint, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface BiometriaWebAuthnProps {
  funcionarioId: string
  funcionarioNome: string
  onCaptura: (dados: BiometriaData) => void
  onErro?: (erro: string) => void
}

export interface BiometriaData {
  hash: string
  tipo: 'webauthn' | 'hardware' | 'assinatura'
  dispositivo: string
  metadata: {
    timestamp: string
    userAgent: string
    authenticatorData?: string
  }
}

export function BiometriaWebAuthn({ funcionarioId, funcionarioNome, onCaptura, onErro }: BiometriaWebAuthnProps) {
  const [capturando, setCapturando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string>()

  // Verifica se o navegador suporta WebAuthn
  const suportaWebAuthn = typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined

  async function registrarCredencial() {
    if (!suportaWebAuthn) {
      const msg = 'Este navegador não suporta autenticação biométrica'
      setErro(msg)
      onErro?.(msg)
      toast.error(msg)
      return
    }

    setCapturando(true)
    setErro(undefined)
    setSucesso(false)

    try {
      // Gerar challenge do servidor
      const challenge = crypto.getRandomValues(new Uint8Array(32))

      // Configurar opções de criação de credencial
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'SafeTrack SST',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(funcionarioId),
          name: funcionarioNome,
          displayName: funcionarioNome,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Biometria integrada (Touch ID, Windows Hello, etc)
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'direct',
      }

      // Solicitar captura biométrica
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Nenhuma credencial foi capturada')
      }

      // Extrair dados da credencial
      const response = credential.response as AuthenticatorAttestationResponse
      const credentialId = Array.from(new Uint8Array(credential.rawId))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const publicKey = Array.from(new Uint8Array(response.getPublicKey()!))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const authenticatorData = Array.from(new Uint8Array(response.getAuthenticatorData()))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Gerar hash único da captura
      const hash = await gerarHash(`${credentialId}-${Date.now()}`)

      // Verificar se já existe credencial registrada
      const { data: credencialExistente } = await supabase
        .from('funcionarios_credenciais_biometricas')
        .select('id')
        .eq('funcionario_id', funcionarioId)
        .eq('credential_id', credentialId)
        .eq('ativo', true)
        .single()

      // Salvar credencial no banco (se nova)
      if (!credencialExistente) {
        const { error: dbError } = await supabase
          .from('funcionarios_credenciais_biometricas')
          .insert({
            funcionario_id: funcionarioId,
            credential_id: credentialId,
            public_key: publicKey,
            tipo: 'webauthn',
            dispositivo: navigator.userAgent,
            counter: 0,
          })

        if (dbError) {
          console.error('Erro ao salvar credencial:', dbError)
        }
      } else {
        // Atualizar último uso
        await supabase
          .from('funcionarios_credenciais_biometricas')
          .update({
            ultimo_uso: new Date().toISOString(),
            counter: supabase.rpc('increment_counter', { credential_id: credentialId })
          })
          .eq('id', credencialExistente.id)
      }

      // Preparar dados da captura
      const dadosCaptura: BiometriaData = {
        hash,
        tipo: 'webauthn',
        dispositivo: getDispositivoInfo(),
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          authenticatorData,
        },
      }

      setSucesso(true)
      toast.success('Biometria capturada com sucesso!')
      onCaptura(dadosCaptura)

    } catch (err: any) {
      let mensagem = 'Erro ao capturar biometria'

      if (err.name === 'NotAllowedError') {
        mensagem = 'Permissão negada. Autorize o uso da biometria.'
      } else if (err.name === 'NotSupportedError') {
        mensagem = 'Biometria não disponível neste dispositivo'
      } else if (err.name === 'InvalidStateError') {
        mensagem = 'Credencial já registrada'
      } else if (err.message) {
        mensagem = err.message
      }

      console.error('Erro WebAuthn:', err)
      setErro(mensagem)
      onErro?.(mensagem)
      toast.error(mensagem)
    } finally {
      setCapturando(false)
    }
  }

  async function gerarHash(dados: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(dados)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  function getDispositivoInfo(): string {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows Hello'
    if (ua.includes('Mac')) return 'Touch ID / Face ID'
    if (ua.includes('Android')) return 'Biometria Android'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'Touch ID / Face ID'
    return 'Biometria do dispositivo'
  }

  if (!suportaWebAuthn) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Biometria não disponível</p>
            <p className="text-xs">Este navegador não suporta autenticação biométrica</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">Biometria do Dispositivo</h3>
            <p className="text-xs text-muted-foreground">{getDispositivoInfo()}</p>
          </div>
        </div>

        {sucesso && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Biometria capturada com sucesso</span>
          </div>
        )}

        {erro && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{erro}</span>
          </div>
        )}

        <Button
          type="button"
          onClick={registrarCredencial}
          disabled={capturando || sucesso}
          className="w-full"
          variant={sucesso ? 'outline' : 'default'}
        >
          {capturando && <Loader2 className="h-4 w-4 animate-spin" />}
          {sucesso && <CheckCircle2 className="h-4 w-4" />}
          {!capturando && !sucesso && <Fingerprint className="h-4 w-4" />}
          {capturando ? 'Aguardando biometria...' : sucesso ? 'Capturado' : 'Capturar Biometria'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Você será solicitado a usar sua impressão digital, Face ID ou Windows Hello
        </p>
      </div>
    </Card>
  )
}
