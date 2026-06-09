import { useState, useRef } from 'react'
import { Upload, Download, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { stripMask } from '@/lib/masks'

interface LinhaCSV {
  matricula: string
  nome: string
  cpf: string
  cargo: string
  setor: string
  data_admissao: string
}

interface ResultadoLinha { linha: number; nome: string; ok: boolean; erro?: string }

interface Props { open: boolean; onClose: () => void }

const MODELO_CSV = `matricula,nome,cpf,cargo,setor,data_admissao
001,João da Silva,12345678901,Operador,Produção,2022-03-15
002,Maria Santos,98765432100,Técnica SST,Segurança,2021-07-01`

export function ImportarCSV({ open, onClose }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<LinhaCSV[]>([])
  const [resultados, setResultados] = useState<ResultadoLinha[]>([])
  const [importando, setImportando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  function parseCSV(texto: string): LinhaCSV[] {
    const linhas = texto.trim().split('\n')
    const cabecalho = linhas[0].split(',').map(h => h.trim().toLowerCase())
    return linhas.slice(1).map(linha => {
      const cols = linha.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const obj: Record<string, string> = {}
      cabecalho.forEach((h, i) => { obj[h] = cols[i] ?? '' })
      return obj as unknown as LinhaCSV
    }).filter(l => l.nome && l.matricula)
  }

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setResultados([])
    setConcluido(false)
    const reader = new FileReader()
    reader.onload = ev => {
      const texto = ev.target?.result as string
      setPreview(parseCSV(texto))
    }
    reader.readAsText(file, 'utf-8')
  }

  async function importar() {
    if (!arquivo || preview.length === 0) return
    setImportando(true)
    const res: ResultadoLinha[] = []

    for (let i = 0; i < preview.length; i++) {
      const linha = preview[i]
      try {
        const { error } = await supabase.from('funcionarios').insert({
          matricula: linha.matricula,
          nome: linha.nome,
          cpf: stripMask(linha.cpf),
          cargo: linha.cargo,
          setor: linha.setor,
          data_admissao: linha.data_admissao,
          ativo: true,
        })
        if (error) throw error
        res.push({ linha: i + 2, nome: linha.nome, ok: true })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        res.push({ linha: i + 2, nome: linha.nome, ok: false, erro: msg.includes('unique') ? 'Matrícula/CPF já cadastrado' : msg })
      }
    }

    setResultados(res)
    setConcluido(true)
    setImportando(false)
    qc.invalidateQueries({ queryKey: ['funcionarios'] })

    const ok = res.filter(r => r.ok).length
    const fail = res.filter(r => !r.ok).length
    if (fail === 0) toast.success(`${ok} funcionário(s) importado(s) com sucesso`)
    else toast.warning(`${ok} importado(s), ${fail} com erro`)
  }

  function baixarModelo() {
    const blob = new Blob([MODELO_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'modelo-funcionarios.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function fechar() {
    setArquivo(null); setPreview([]); setResultados([]); setConcluido(false)
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar funcionários via CSV</DialogTitle>
        </DialogHeader>

        {!concluido ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Baixe o modelo, preencha e envie o arquivo CSV.
              </p>
              <Button variant="outline" size="sm" onClick={baixarModelo}>
                <Download className="h-3.5 w-3.5" /> Modelo CSV
              </Button>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">{arquivo ? arquivo.name : 'Clique para selecionar o arquivo'}</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, codificação UTF-8</p>
              <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleArquivo} />
            </div>

            {preview.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{preview.length} funcionário(s) detectado(s):</p>
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {['Matrícula', 'Nome', 'Cargo', 'Setor'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((l, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-1.5 px-2 font-mono">{l.matricula}</td>
                          <td className="py-1.5 px-2">{l.nome}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{l.cargo}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{l.setor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Resultado da importação:</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {resultados.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.ok
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <span className={r.ok ? '' : 'text-muted-foreground'}>{r.nome}</span>
                  {!r.ok && <Badge variant="danger" className="text-xs">{r.erro}</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={fechar}>
            {concluido ? 'Fechar' : 'Cancelar'}
          </Button>
          {!concluido && (
            <Button onClick={importar} disabled={preview.length === 0 || importando}>
              {importando && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {preview.length > 0 && `(${preview.length})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
