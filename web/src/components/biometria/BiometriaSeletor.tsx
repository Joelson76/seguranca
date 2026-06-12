import { useState, useRef } from 'react'
import { Pen, Fingerprint, Scan, RotateCcw } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BiometriaWebAuthn, type BiometriaData } from './BiometriaWebAuthn'
import { BiometriaHardware } from './BiometriaHardware'

interface BiometriaSeletorProps {
  funcionarioId: string
  funcionarioNome: string
  onCaptura: (dados: BiometriaData | { tipo: 'assinatura'; base64: string }) => void
}

export function BiometriaSeletor({ funcionarioId, funcionarioNome, onCaptura }: BiometriaSeletorProps) {
  const [metodoSelecionado, setMetodoSelecionado] = useState<'assinatura' | 'webauthn' | 'hardware'>('assinatura')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [assinando, setAssinando] = useState(false)
  const [posInicial, setPosInicial] = useState({ x: 0, y: 0 })

  // ========== ASSINATURA CANVAS (método atual) ==========
  function getPonto(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * sx, y: ((e as React.MouseEvent).clientY - rect.top) * sy }
  }

  function iniciarAssinatura(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    setAssinando(true)
    setPosInicial(getPonto(e, canvasRef.current!))
  }

  function desenhar(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!assinando || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    const { x, y } = getPonto(e, canvasRef.current)
    ctx.beginPath()
    ctx.moveTo(posInicial.x, posInicial.y)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    setPosInicial({ x, y })
  }

  function limparCanvas() {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  function obterAssinaturaBase64(): string | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

  // ========== HANDLERS ==========
  function handleCapturaWebAuthn(dados: BiometriaData) {
    onCaptura(dados)
  }

  function handleCapturaHardware(dados: BiometriaData) {
    onCaptura(dados)
  }

  function handleSalvarAssinatura() {
    const base64 = obterAssinaturaBase64()
    if (base64) {
      onCaptura({ tipo: 'assinatura', base64 })
    }
  }

  return (
    <div className="space-y-3">
      <Label>Método de Autenticação</Label>

      <Tabs value={metodoSelecionado} onValueChange={(v) => setMetodoSelecionado(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assinatura" className="text-xs">
            <Pen className="h-3.5 w-3.5 mr-1.5" />
            Assinatura
          </TabsTrigger>
          <TabsTrigger value="webauthn" className="text-xs">
            <Fingerprint className="h-3.5 w-3.5 mr-1.5" />
            Dispositivo
          </TabsTrigger>
          <TabsTrigger value="hardware" className="text-xs">
            <Scan className="h-3.5 w-3.5 mr-1.5" />
            Leitor
          </TabsTrigger>
        </TabsList>

        {/* ========== ASSINATURA MANUAL ========== */}
        <TabsContent value="assinatura" className="mt-4">
          <div className="space-y-3">
            <div className="border rounded-md p-2 bg-muted/20">
              <canvas
                ref={canvasRef}
                width={400}
                height={100}
                className="w-full cursor-crosshair border rounded bg-white touch-none"
                onMouseDown={iniciarAssinatura}
                onMouseMove={desenhar}
                onMouseUp={() => setAssinando(false)}
                onMouseLeave={() => setAssinando(false)}
                onTouchStart={iniciarAssinatura}
                onTouchMove={desenhar}
                onTouchEnd={() => setAssinando(false)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={limparCanvas}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Limpar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Desenhe a assinatura do funcionário usando mouse ou toque
            </p>
          </div>
        </TabsContent>

        {/* ========== BIOMETRIA WEBAUTHN ========== */}
        <TabsContent value="webauthn" className="mt-4">
          <BiometriaWebAuthn
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            onCaptura={handleCapturaWebAuthn}
          />
        </TabsContent>

        {/* ========== BIOMETRIA HARDWARE ========== */}
        <TabsContent value="hardware" className="mt-4">
          <BiometriaHardware
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            onCaptura={handleCapturaHardware}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Re-exportar tipo para facilitar uso
export type { BiometriaData }
