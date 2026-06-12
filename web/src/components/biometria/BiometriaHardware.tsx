import { useState, useEffect } from 'react'
import { Scan, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { BiometriaData } from './BiometriaWebAuthn'

interface BiometriaHardwareProps {
  funcionarioId: string
  funcionarioNome: string
  onCaptura: (dados: BiometriaData) => void
  onErro?: (erro: string) => void
}

// Interfaces para SDKs de leitores biométricos comuns
declare global {
  interface Window {
    // Digital Persona U.are.U SDK
    DPFPDevices?: any

    // Nitgen Hamster SDK
    NBioBSP?: any

    // ZKTeco SDK
    ZKFinger?: any

    // Futronic SDK
    FutronicSDK?: any
  }
}

export function BiometriaHardware({ funcionarioId, funcionarioNome, onCaptura, onErro }: BiometriaHardwareProps) {
  const [capturando, setCapturando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string>()
  const [sdkDisponivel, setSdkDisponivel] = useState<string | null>(null)
  const [leitorConectado, setLeitorConectado] = useState(false)

  useEffect(() => {
    verificarSDKs()
  }, [])

  function verificarSDKs() {
    // Verificar qual SDK está disponível
    if (window.DPFPDevices) {
      setSdkDisponivel('Digital Persona')
      verificarLeitorDigitalPersona()
    } else if (window.NBioBSP) {
      setSdkDisponivel('Nitgen')
      verificarLeitorNitgen()
    } else if (window.ZKFinger) {
      setSdkDisponivel('ZKTeco')
      verificarLeitorZKTeco()
    } else if (window.FutronicSDK) {
      setSdkDisponivel('Futronic')
      verificarLeitorFutronic()
    } else {
      setSdkDisponivel(null)
    }
  }

  async function verificarLeitorDigitalPersona() {
    try {
      const devices = await window.DPFPDevices?.getDevices()
      setLeitorConectado(devices && devices.length > 0)
    } catch {
      setLeitorConectado(false)
    }
  }

  async function verificarLeitorNitgen() {
    try {
      const result = await window.NBioBSP?.EnumerateDevice()
      setLeitorConectado(result && result.DeviceNumber > 0)
    } catch {
      setLeitorConectado(false)
    }
  }

  async function verificarLeitorZKTeco() {
    try {
      const result = await window.ZKFinger?.Init()
      setLeitorConectado(result === 0)
    } catch {
      setLeitorConectado(false)
    }
  }

  async function verificarLeitorFutronic() {
    try {
      const result = await window.FutronicSDK?.Initialize()
      setLeitorConectado(result)
    } catch {
      setLeitorConectado(false)
    }
  }

  async function capturarBiometria() {
    setCapturando(true)
    setErro(undefined)
    setSucesso(false)

    try {
      let template: string
      let dispositivoInfo: string

      // Capturar de acordo com o SDK disponível
      if (window.DPFPDevices && sdkDisponivel === 'Digital Persona') {
        const resultado = await capturarDigitalPersona()
        template = resultado.template
        dispositivoInfo = resultado.dispositivo
      } else if (window.NBioBSP && sdkDisponivel === 'Nitgen') {
        const resultado = await capturarNitgen()
        template = resultado.template
        dispositivoInfo = resultado.dispositivo
      } else if (window.ZKFinger && sdkDisponivel === 'ZKTeco') {
        const resultado = await capturarZKTeco()
        template = resultado.template
        dispositivoInfo = resultado.dispositivo
      } else if (window.FutronicSDK && sdkDisponivel === 'Futronic') {
        const resultado = await capturarFutronic()
        template = resultado.template
        dispositivoInfo = resultado.dispositivo
      } else {
        throw new Error('Nenhum leitor biométrico disponível')
      }

      // Gerar hash do template
      const hash = await gerarHash(template)

      // Salvar credencial no banco
      const credentialId = `hw-${hash.substring(0, 32)}`

      const { data: credencialExistente } = await supabase
        .from('funcionarios_credenciais_biometricas')
        .select('id')
        .eq('funcionario_id', funcionarioId)
        .eq('credential_id', credentialId)
        .eq('ativo', true)
        .single()

      if (!credencialExistente) {
        await supabase
          .from('funcionarios_credenciais_biometricas')
          .insert({
            funcionario_id: funcionarioId,
            credential_id: credentialId,
            public_key: template,
            tipo: 'hardware',
            dispositivo: dispositivoInfo,
            counter: 0,
          })
      } else {
        await supabase
          .from('funcionarios_credenciais_biometricas')
          .update({
            ultimo_uso: new Date().toISOString(),
          })
          .eq('id', credencialExistente.id)
      }

      // Preparar dados da captura
      const dadosCaptura: BiometriaData = {
        hash,
        tipo: 'hardware',
        dispositivo: dispositivoInfo,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      }

      setSucesso(true)
      toast.success('Biometria capturada com sucesso!')
      onCaptura(dadosCaptura)

    } catch (err: any) {
      const mensagem = err.message || 'Erro ao capturar biometria do hardware'
      console.error('Erro captura hardware:', err)
      setErro(mensagem)
      onErro?.(mensagem)
      toast.error(mensagem)
    } finally {
      setCapturando(false)
    }
  }

  // ========== DIGITAL PERSONA ==========
  async function capturarDigitalPersona(): Promise<{ template: string; dispositivo: string }> {
    return new Promise((resolve, reject) => {
      try {
        const reader = window.DPFPDevices.getDevice(0)
        if (!reader) throw new Error('Leitor Digital Persona não encontrado')

        reader.StartCapture()

        reader.onSampleCaptured = async (sample: any) => {
          reader.StopCapture()

          const template = await reader.CreateTemplate(sample)
          const templateBase64 = btoa(String.fromCharCode(...new Uint8Array(template)))

          resolve({
            template: templateBase64,
            dispositivo: `Digital Persona ${reader.GetDeviceInfo().ModelName}`,
          })
        }

        reader.onCaptureError = (error: any) => {
          reader.StopCapture()
          reject(new Error(`Erro ao capturar: ${error.message}`))
        }

        // Timeout de 30 segundos
        setTimeout(() => {
          reader.StopCapture()
          reject(new Error('Tempo esgotado. Tente novamente.'))
        }, 30000)

      } catch (err: any) {
        reject(err)
      }
    })
  }

  // ========== NITGEN ==========
  async function capturarNitgen(): Promise<{ template: string; dispositivo: string }> {
    return new Promise((resolve, reject) => {
      try {
        const bsp = window.NBioBSP

        bsp.Capture((result: any) => {
          if (result.Error) {
            reject(new Error(`Erro Nitgen: ${result.Error}`))
            return
          }

          const template = result.Template
          const deviceInfo = bsp.GetDeviceInfo()

          resolve({
            template,
            dispositivo: `Nitgen ${deviceInfo.DeviceName}`,
          })
        })

      } catch (err: any) {
        reject(err)
      }
    })
  }

  // ========== ZKTECO ==========
  async function capturarZKTeco(): Promise<{ template: string; dispositivo: string }> {
    return new Promise((resolve, reject) => {
      try {
        const zk = window.ZKFinger

        zk.BeginCapture((result: any, template: string) => {
          if (result !== 0) {
            reject(new Error('Erro ao capturar biometria ZKTeco'))
            return
          }

          resolve({
            template,
            dispositivo: 'ZKTeco Fingerprint Reader',
          })
        })

      } catch (err: any) {
        reject(err)
      }
    })
  }

  // ========== FUTRONIC ==========
  async function capturarFutronic(): Promise<{ template: string; dispositivo: string }> {
    return new Promise((resolve, reject) => {
      try {
        const sdk = window.FutronicSDK

        sdk.Enroll((result: any) => {
          if (!result.Success) {
            reject(new Error('Falha ao capturar biometria Futronic'))
            return
          }

          resolve({
            template: result.Template,
            dispositivo: 'Futronic FS Series',
          })
        })

      } catch (err: any) {
        reject(err)
      }
    })
  }

  async function gerarHash(dados: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(dados)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  if (!sdkDisponivel) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="font-medium text-foreground">Leitor biométrico não detectado</p>
            <p className="text-xs text-muted-foreground">
              Instale o driver do seu leitor biométrico para usar esta opção.
            </p>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Ver leitores suportados</summary>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>Digital Persona U.are.U</li>
                <li>Nitgen Hamster</li>
                <li>ZKTeco</li>
                <li>Futronic FS Series</li>
              </ul>
            </details>
          </div>
        </div>
      </Card>
    )
  }

  if (!leitorConectado) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Leitor não conectado</p>
            <p className="text-xs">Conecte o leitor {sdkDisponivel} e tente novamente</p>
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
            <Scan className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">Leitor Biométrico</h3>
            <p className="text-xs text-muted-foreground">{sdkDisponivel}</p>
          </div>
          {leitorConectado && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
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
          onClick={capturarBiometria}
          disabled={capturando || sucesso}
          className="w-full"
          variant={sucesso ? 'outline' : 'default'}
        >
          {capturando && <Loader2 className="h-4 w-4 animate-spin" />}
          {sucesso && <CheckCircle2 className="h-4 w-4" />}
          {!capturando && !sucesso && <Scan className="h-4 w-4" />}
          {capturando ? 'Posicione o dedo no leitor...' : sucesso ? 'Capturado' : 'Capturar Digital'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Posicione o dedo no leitor biométrico quando solicitado
        </p>
      </div>
    </Card>
  )
}
