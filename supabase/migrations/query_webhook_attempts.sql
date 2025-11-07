-- Query para analisar tentativas de webhook
-- Use esta query no SQL Editor do Supabase para ver quem está tentando acessar o webhook

-- Ver todas as tentativas falhas recentes
SELECT 
  id,
  event_id,
  event_type,
  signature_length,
  body_length,
  error_message,
  error_type,
  user_agent,
  origin,
  x_forwarded_for,
  x_real_ip,
  request_url,
  request_method,
  success,
  created_at
FROM webhook_attempts
WHERE success = false
ORDER BY created_at DESC
LIMIT 50;

-- Agrupar por IP de origem para identificar padrões
SELECT 
  x_forwarded_for,
  x_real_ip,
  COUNT(*) as total_attempts,
  COUNT(DISTINCT event_id) as unique_events,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt,
  STRING_AGG(DISTINCT event_type, ', ') as event_types
FROM webhook_attempts
WHERE success = false
GROUP BY x_forwarded_for, x_real_ip
ORDER BY total_attempts DESC;

-- Ver tentativas por tipo de evento
SELECT 
  event_type,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN success = true THEN 1 END) as successful,
  COUNT(CASE WHEN success = false THEN 1 END) as failed
FROM webhook_attempts
GROUP BY event_type
ORDER BY total_attempts DESC;

-- Ver tentativas por tamanho de assinatura (pode indicar diferentes webhooks)
SELECT 
  signature_length,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN success = true THEN 1 END) as successful,
  COUNT(CASE WHEN success = false THEN 1 END) as failed,
  STRING_AGG(DISTINCT event_type, ', ') as event_types
FROM webhook_attempts
GROUP BY signature_length
ORDER BY signature_length;

