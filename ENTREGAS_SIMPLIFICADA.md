# Página de Entregas - Precisa Simplificar

## Problema

A página `Entregas.tsx` tem muitos recursos que dependem de campos que não existem no schema atual:

### Campos que NÃO EXISTEM no banco:
- `devolvido`
- `data_devolucao`  
- `data_vencimento`
- `assinatura_url` (existe `assinatura_base64`)

### Funções que NÃO FUNCIONAM:
- `useRegistrarDevolucao()` - removida do hook
- `handleDevolver()` - usa campos inexistentes
- Coluna "Status" - usa campo `devolvido`
- Coluna "Vencimento" - usa campo `data_vencimento`

## Solução Rápida

Simplificar a página para:
1. ✅ Apenas REGISTRAR entregas (sem devolução)
2. ✅ Sem assinatura digital (por enquanto)
3. ✅ Sem data de vencimento
4. ✅ Apenas observação

## OU Atualizar o Schema do Banco

Se quiser manter todas as funcionalidades, execute no Supabase:

```sql
ALTER TABLE entregas_epi 
ADD COLUMN devolvido BOOLEAN DEFAULT false,
ADD COLUMN data_devolucao TIMESTAMPTZ,
ADD COLUMN data_vencimento DATE;
```

Mas isso requer atualizar também o hook e testar tudo novamente.

## Recomendação

**Para ter o sistema funcionando AGORA:**
- Simplificar a página de Entregas
- Remover funcionalidades extras

**Para o futuro:**
- Adicionar campos no banco
- Implementar devoluções corretamente
- Implementar assinatura digital
