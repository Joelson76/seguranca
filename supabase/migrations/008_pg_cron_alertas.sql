-- ============================================================
-- SafeTrack — Migration 008: pg_cron para alertas diários
-- IMPORTANTE: Habilitar extensão pg_cron no Supabase Dashboard
--   Settings > Database > Extensions > pg_cron
-- ============================================================

-- Também habilitar a extensão pg_net para chamadas HTTP
-- Settings > Database > Extensions > pg_net

-- Agendar alertas diários às 08:00 (horário UTC — ajuste conforme fuso)
SELECT cron.schedule(
  'safetrack-alertas-diarios',
  '0 11 * * *',  -- 08:00 BRT = 11:00 UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/alertas-diarios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Para verificar jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover o job:
-- SELECT cron.unschedule('safetrack-alertas-diarios');
