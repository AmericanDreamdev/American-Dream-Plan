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

