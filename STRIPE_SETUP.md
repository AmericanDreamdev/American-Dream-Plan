# Configuração do Stripe

## Variáveis de Ambiente Necessárias

### 1. Variáveis no Supabase (Edge Functions)

Configure as seguintes variáveis de ambiente no seu projeto Supabase:

1. Acesse: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

2. Adicione as seguintes variáveis:

```
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_... para produção)
STRIPE_WEBHOOK_SECRET=whsec_... (obtido após configurar o webhook)
SITE_URL=https://seusite.com (ou http://localhost:8081 para desenvolvimento)
```

### 2. Obter Chaves do Stripe

1. **STRIPE_SECRET_KEY:**
   - Acesse: https://dashboard.stripe.com/apikeys
   - Copie a "Secret key" (test ou live)

2. **STRIPE_WEBHOOK_SECRET:**
   - Acesse: https://dashboard.stripe.com/webhooks
   - Clique em "Add endpoint"
   - Endpoint URL: `https://xwgdvpicgsjeyqejanwa.supabase.co/functions/v1/stripe-webhook`
   - Selecione os eventos:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
   - Clique em "Add endpoint"
   - Após criar, clique no webhook e copie o "Signing secret" (começa com `whsec_`)

### 3. Configurar SITE_URL

- **Desenvolvimento:** `http://localhost:8081`
- **Produção:** URL do seu site (ex: `https://american-dream.com`)

## Fluxo de Pagamento

1. Usuário aceita os termos → chama `create-checkout-session`
2. Redireciona para checkout do Stripe
3. Após pagamento → Stripe envia webhook para `stripe-webhook`
4. Webhook atualiza status do pagamento na tabela `payments`
5. Usuário é redirecionado para `/payment/success`

## Valor Configurado

O valor atual é **US$ 1.998,00** (199800 centavos), configurado diretamente no código da Edge Function `create-checkout-session`.

Para alterar, edite:
```typescript
const amount = 199800; // US$ 1.998,00
```

## Testar Pagamento

1. Use cartão de teste: `4242 4242 4242 4242`
2. Qualquer data futura para expiração
3. Qualquer CVC
4. Qualquer CEP

Mais cartões de teste: https://stripe.com/docs/testing

## Troubleshooting - Erro de Webhook Signature

Se você receber o erro: `Webhook signature verification failed: No signatures found matching the expected signature`

### Passos para resolver:

1. **Verificar STRIPE_WEBHOOK_SECRET no Supabase:**
   - Acesse: Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Confirme que `STRIPE_WEBHOOK_SECRET` está configurado
   - O valor deve começar com `whsec_`
   - **IMPORTANTE:** Cada webhook endpoint tem seu próprio secret. Use o secret correto!

2. **Verificar se o webhook está configurado no Stripe:**
   - Acesse: https://dashboard.stripe.com/webhooks
   - Verifique se o endpoint está ativo
   - URL deve ser: `https://xwgdvpicgsjeyqejanwa.supabase.co/functions/v1/stripe-webhook`
   - Eventos selecionados:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`

3. **Copiar o Signing Secret correto:**
   - No Stripe Dashboard → Webhooks
   - Clique no webhook endpoint
   - Clique em "Reveal" no "Signing secret"
   - Copie o valor completo (começa com `whsec_`)
   - Cole no Supabase Secrets como `STRIPE_WEBHOOK_SECRET`

4. **Se estiver testando localmente com Stripe CLI:**
   - Use: `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
   - O secret será diferente (começa com `whsec_` mas é específico para local)
   - Configure esse secret temporariamente no Supabase para testes locais

5. **Verificar logs:**
   - Acesse: Supabase Dashboard → Edge Functions → stripe-webhook → Logs
   - Os logs agora mostram informações de debug sobre a verificação

### Notas Importantes:

- O `STRIPE_WEBHOOK_SECRET` é diferente para cada ambiente (test/live) e para cada endpoint
- Se você criar um novo webhook no Stripe, precisa copiar o novo secret
- O corpo da requisição NÃO pode ser modificado antes de verificar a assinatura (já está correto no código)

