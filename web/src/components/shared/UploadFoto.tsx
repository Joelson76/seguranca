import { useState, useRef } from 'react'
import { Camera, Loader2, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Props {
  urlAtual?: string
  bucket: string
  pasta?: string
  onChange: (url: string) => void
  tamanho?: 'sm' | 'md' | 'lg'
}

export function UploadFoto({ urlAtual, bucket, pasta = '', onChange, tamanho = 'md' }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [preview, setPreview] = useState<string | null>(urlAtual ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  const tamanhos = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  }

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5 MB.')
      return
    }

    setEnviando(true)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      const ext = file.name.split('.').pop()
      const path = `${pasta}${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) throw error

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      onChange(urlData.publicUrl)
      toast.success('Foto enviada')
    } catch {
      toast.error('Erro ao enviar foto')
      setPreview(urlAtual ?? null)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative rounded-full border-2 border-dashed border-border overflow-hidden cursor-pointer bg-muted/30 flex items-center justify-center group',
          tamanhos[tamanho]
        )}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <User className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {enviando ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleArquivo}
      />
      {preview && (
        <button
          type="button"
          onClick={() => { setPreview(null); onChange('') }}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Remover foto
        </button>
      )}
    </div>
  )
}
