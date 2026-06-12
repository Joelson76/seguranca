-- ============================================================
-- SafeTrack — Migration 013: OPCIONAL - Auto-criar usuário
-- ============================================================
-- ⚠️ ESTE MIGRATION É OPCIONAL E NÃO É RECOMENDADO NESTE MOMENTO
--
-- Motivo: O SafeTrack usa um fluxo de onboarding onde:
-- 1. Usuário se registra (cria auth.users)
-- 2. Frontend cria o tenant
-- 3. Frontend cria o registro em usuarios com o tenant_id
--
-- Um trigger automático causaria race condition ou exigiria permitir
-- tenant_id = NULL, o que quebraria o RLS.
--
-- Mantenha este arquivo para referência futura, mas NÃO execute.
-- ============================================================

-- NÃO EXECUTAR ESTE CÓDIGO ABAIXO (apenas documentação)

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Este trigger NÃO é usado no SafeTrack
  -- Veja Registro.tsx para o fluxo manual
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/
