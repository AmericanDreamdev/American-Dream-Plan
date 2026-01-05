# Documentação Completa - Integração Stripe

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura da Integração](#arquitetura-da-integração)
3. [Configuração Inicial](#configuração-inicial)
4. [Fluxo de Pagamento](#fluxo-de-pagamento)
5. [Cálculo e Contabilização de Taxas](#cálculo-e-contabilização-de-taxas)
6. [Estrutura de Dados](#estrutura-de-dados)
7. [Edge Functions](#edge-functions)
8. [Frontend Integration](#frontend-integration)
9. [Webhooks e Processamento](#webhooks-e-processamento)
10. [Exemplos de Código](#exemplos-de-código)

---

## Visão Geral

Este projeto implementa uma integração completa com o Stripe para processamento de pagamentos, suportando:
- **Cartão de Crédito** (USD)
- **PIX** (BRL) - com conversão automática de moeda
- Cálculo automático de taxas do Stripe
- Webhooks para atualização de status
- Contabilização detalhada de taxas

### Valor Base do Produto
- **Valor base:** US$ 999,00 (99900 centavos)
- **Valor final com taxas:** Varia conforme método de pagamento

---

## Arquitetura da Integração

```
┌─────────────────┐
│   Frontend      │
│ (React/TypeScript)│
└────────┬────────┘
         │
         │ 1. POST /create-checkout-session
         ▼
┌─────────────────────────┐
│  Edge Function          │
│ create-checkout-session │
│ - Calcula taxas         │
│ - Cria sessão Stripe    │
│ - Salva payment no DB   │
└────────┬────────────────┘
         │
         │ 2. Retorna checkout_url
         ▼
┌─────────────────┐
│   Stripe        │
│  Checkout Page  │
└────────┬────────┘
         │
         │ 3. Usuário paga
         ▼
┌─────────────────────────┐
│  Stripe Webhook         │
│  (checkout.completed)   │
└────────┬────────────────┘
         │
         │ 4. POST /stripe-webhook
         ▼
┌─────────────────────────┐
│  Edge Function          │
│ stripe-webhook          │
│ - Valida assinatura     │
│ - Atualiza payment      │
│ - Envia email           │
└─────────────────────────┘
```

---

## Configuração Inicial

### 1. Variáveis de Ambiente no Supabase

Configure no **Supabase Dashboard → Project Settings → Edge Functions → Secrets**:

```bash
# Chaves do Stripe
STRIPE_SECRET_KEY=sk_test_...          # Para desenvolvimento
STRIPE_SECRET_KEY_TEST=sk_test_...     # Opcional: chave de teste específica
STRIPE_SECRET_KEY_LIVE=sk_live_...     # Opcional: chave de produção específica

# Webhook Secret (obtido após configurar webhook no Stripe)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL do site
SITE_URL=https://seusite.com           # Produção
# ou
SITE_URL=http://localhost:8081        # Desenvolvimento
```

### 2. Configurar Webhook no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL:** `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
   - **Eventos a escutar:**
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
4. Após criar, copie o **"Signing secret"** (começa com `whsec_`)
5. Cole no Supabase como `STRIPE_WEBHOOK_SECRET`

### 3. Instalação de Dependências

As Edge Functions usam:
- `npm:stripe@^17.3.1` - SDK do Stripe
- `jsr:@supabase/supabase-js@2` - Cliente Supabase

---

## Fluxo de Pagamento

### Passo 1: Frontend Solicita Checkout

```typescript
// src/pages/PaymentOptions.tsx
const handleStripeCheckout = async (method: "card" | "pix" = "card") => {
  const requestBody = {
    lead_id: leadId,
    term_acceptance_id: termAcceptanceId,
    payment_method: method, // "card" ou "pix"
    exchange_rate: exchangeRate, // Opcional: taxa de câmbio do frontend
  };

  const { data } = await supabase.functions.invoke(
    "create-checkout-session",
    { body: requestBody }
  );

  // Redireciona para checkout do Stripe
  window.location.href = data.checkout_url;
};
```

### Passo 2: Edge Function Cria Sessão

A função `create-checkout-session`:

1. **Valida dados** (lead_id, term_acceptance_id)
2. **Detecta ambiente** (produção/teste) baseado na URL
3. **Calcula taxas** (ver seção abaixo)
4. **Cria sessão Stripe** com valores calculados
5. **Salva payment** no banco de dados com metadata

### Passo 3: Usuário Paga no Stripe

O Stripe processa o pagamento e redireciona para:
- **Sucesso:** `/payment/success?session_id=...`
- **Cancelamento:** `/payment/cancel?lead_id=...`

### Passo 4: Webhook Atualiza Status

Quando o pagamento é concluído, o Stripe envia webhook que:
1. Valida assinatura do webhook
2. Atualiza `payments.status = 'completed'`
3. Atualiza `amount` e `currency` com valores reais
4. Envia email de confirmação ao cliente

---

## Cálculo e Contabilização de Taxas

### Taxas do Stripe

#### Para Cartão de Crédito (USD):
```typescript
// Taxas configuradas
const cardFeePercentage = 0.039;  // 3.9%
const cardFeeFixed = 30;           // $0.30 em centavos

// Valor base
const baseUsdAmount = 99900;        // US$ 999,00 em centavos

// Cálculo do valor final
const usdAmountWithFee = Math.round(
  baseUsdAmount + 
  (baseUsdAmount * cardFeePercentage) + 
  cardFeeFixed
);
// Resultado: US$ 1.039,61 (999 + 38.96 + 0.30)
```

**Fórmula:**
```
Valor Final = Valor Base + (Valor Base × 3.9%) + $0.30
```

#### Para PIX (BRL):
```typescript
// Taxas do Stripe para PIX
const STRIPE_PIX_PROCESSING_PERCENTAGE = 0.0119;      // 1.19% - processamento
const STRIPE_CURRENCY_CONVERSION_PERCENTAGE = 0.006;  // 0.6% - conversão
const STRIPE_PIX_TOTAL_PERCENTAGE = 0.0179;          // ~1.79% total

// Taxa de câmbio (obtida do frontend ou API)
const exchangeRate = 5.6; // USD → BRL

// Função de cálculo
function calculatePIXAmountWithFees(netAmountUSD: number, exchangeRate: number): number {
  // 1. Converter USD para BRL
  const netAmountBRL = netAmountUSD * exchangeRate;
  
  // 2. Calcular valor bruto (antes das taxas)
  // Fórmula: Valor líquido / (1 - Taxa percentual)
  const grossAmountBRL = netAmountBRL / (1 - STRIPE_PIX_TOTAL_PERCENTAGE);
  
  // 3. Arredondar e converter para centavos
  const grossAmountRounded = Math.round(grossAmountBRL * 100) / 100;
  const grossAmountInCents = Math.round(grossAmountRounded * 100);
  
  return grossAmountInCents;
}

// Exemplo:
// Valor base: US$ 999,00
// Taxa de câmbio: 5.6
// Valor em BRL: R$ 5.594,40
// Com markup de 1.79%: R$ 5.696,14
```

**Fórmula:**
```
1. Valor BRL = Valor USD × Taxa de Câmbio
2. Valor Bruto BRL = Valor BRL / (1 - 1.79%)
3. Valor Final = Arredondar(Valor Bruto BRL) × 100 (centavos)
```

### Obtendo Taxa de Câmbio

A taxa de câmbio é obtida nesta ordem de prioridade:

1. **Frontend** (recomendado) - Enviada no request
2. **API Externa** - `https://api.exchangerate-api.com/v4/latest/USD` com margem de 4%
3. **Fallback** - Taxa fixa de 5.6

```typescript
// Prioridade 1: Frontend
if (frontendExchangeRate && frontendExchangeRate > 0) {
  exchangeRate = frontendExchangeRate;
}
// Prioridade 2: API com margem
else {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await response.json();
  const baseRate = parseFloat(data.rates.BRL);
  exchangeRate = baseRate * 1.04; // Margem comercial de 4%
}
// Prioridade 3: Fallback
else {
  exchangeRate = 5.6;
}
```

### Armazenamento de Taxas no Banco de Dados

As taxas são armazenadas no campo `metadata` da tabela `payments`:

```json
{
  "payment_method": "card",
  "base_usd_amount": "999.00",
  "base_brl_amount": "5594.40",
  "final_usd_amount": "1039.61",
  "final_brl_amount": "5696.14",
  "card_fee_amount": "40.61",
  "pix_fee_amount": "101.74",
  "card_fee_percentage": "3.9",
  "pix_fee_percentage": "1.79",
  "exchange_rate": "5.600"
}
```

**Campos importantes:**
- `base_usd_amount`: Valor base sem taxas (US$ 999,00)
- `final_usd_amount`: Valor final cobrado para cartão (com taxas)
- `final_brl_amount`: Valor final cobrado para PIX (com taxas e conversão)
- `card_fee_amount`: Valor da taxa em dólares
- `pix_fee_amount`: Valor da taxa em reais
- `exchange_rate`: Taxa de câmbio usada

---

## Estrutura de Dados

### Tabela `payments`

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  term_acceptance_id UUID REFERENCES term_acceptance(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10, 2),           -- Valor pago (com taxas)
  currency TEXT,                   -- 'USD' ou 'BRL'
  status TEXT,                     -- 'pending', 'completed', 'failed'
  metadata JSONB,                  -- Taxas, taxas de câmbio, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Exemplo de Registro

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "lead_id": "123e4567-e89b-12d3-a456-426614174000",
  "term_acceptance_id": "789e0123-e45b-67c8-d901-234567890abc",
  "stripe_session_id": "cs_test_a1b2c3d4...",
  "stripe_payment_intent_id": "pi_test_x1y2z3w4...",
  "amount": 1039.61,
  "currency": "USD",
  "status": "completed",
  "metadata": {
    "payment_method": "card",
    "base_usd_amount": "999.00",
    "final_usd_amount": "1039.61",
    "card_fee_amount": "40.61",
    "card_fee_percentage": "3.9",
    "exchange_rate": "5.600"
  },
  "created_at": "2025-01-08T10:30:00Z",
  "updated_at": "2025-01-08T10:35:00Z"
}
```

---

## Edge Functions

### 1. `create-checkout-session`

**Localização:** `supabase/functions/create-checkout-session/index.ts`

**Responsabilidades:**
- Validar dados do request
- Detectar ambiente (produção/teste)
- Calcular taxas conforme método de pagamento
- Obter taxa de câmbio (frontend → API → fallback)
- Criar sessão Stripe
- Salvar payment no banco

**Request:**
```typescript
{
  lead_id: string;
  term_acceptance_id: string;
  payment_method?: "card" | "pix";
  exchange_rate?: number; // Opcional
}
```

**Response:**
```typescript
{
  success: true;
  checkout_url: string;
  session_id: string;
}
```

**Código Principal:**
```typescript
// Detectar ambiente
const isProduction = normalizedSiteUrl.includes("americandream.323network.com");
const isLocalhost = normalizedSiteUrl.includes("localhost");

// Escolher chave Stripe
let stripeSecretKey: string | undefined;
if (isProduction) {
  stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE") || 
                    Deno.env.get("STRIPE_SECRET_KEY");
} else {
  stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY_TEST") || 
                    Deno.env.get("STRIPE_SECRET_KEY");
}

// Calcular valores
const baseUsdAmount = 99900; // US$ 999,00
const cardFeePercentage = 0.039;
const cardFeeFixed = 30;

// Para cartão
const usdAmountWithFee = Math.round(
  baseUsdAmount + (baseUsdAmount * cardFeePercentage) + cardFeeFixed
);

// Para PIX
const brlAmountWithFee = calculatePIXAmountWithFees(
  baseUsdAmount / 100, 
  exchangeRate
);

// Criar sessão Stripe
const session = await stripe.checkout.sessions.create({
  payment_method_types: isPixOnly ? ["pix"] : ["card"],
  line_items: [{
    price_data: {
      currency: isPixOnly ? "brl" : "usd",
      product_data: {
        name: "Consultoria American Dream",
      },
      unit_amount: isPixOnly ? brlAmountWithFee : usdAmountWithFee,
    },
    quantity: 1,
  }],
  mode: "payment",
  success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${siteUrl}/payment/cancel`,
  customer_email: lead.email,
  metadata: {
    lead_id: lead_id,
    term_acceptance_id: term_acceptance_id,
    // ... taxas e valores
  },
});
```

### 2. `stripe-webhook`

**Localização:** `supabase/functions/stripe-webhook/index.ts`

**Responsabilidades:**
- Validar assinatura do webhook
- Processar eventos do Stripe
- Atualizar status do pagamento
- Enviar email de confirmação

**Eventos Processados:**
- `checkout.session.completed` - Pagamento concluído (cartão)
- `checkout.session.async_payment_succeeded` - Pagamento PIX confirmado
- `checkout.session.async_payment_failed` - Pagamento falhou

**Validação de Assinatura:**
```typescript
// Obter body como RAW TEXT (importante!)
const bodyArrayBuffer = await req.arrayBuffer();
const body = new TextDecoder().decode(bodyArrayBuffer);
const signature = req.headers.get("stripe-signature");

// Verificar assinatura
event = await stripe.webhooks.constructEventAsync(
  body,
  signature,
  stripeWebhookSecret
);
```

**Processamento de Evento:**
```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Obter método de pagamento
  const paymentMethod = await getPaymentMethod(session.payment_intent);
  
  // Atualizar payment
  await supabase
    .from("payments")
    .update({
      status: "completed",
      stripe_payment_intent_id: session.payment_intent,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...currentMetadata,
        payment_method: paymentMethod,
        amount_total: session.amount_total / 100,
      },
    })
    .eq("stripe_session_id", session.id);
  
  // Enviar email de confirmação
  await sendEmail(...);
  
  break;
}
```

---

## Frontend Integration

### Componente de Pagamento

**Localização:** `src/pages/PaymentOptions.tsx`

**Funcionalidades:**
- Exibir opções de pagamento (Cartão, PIX)
- Obter taxa de câmbio (para PIX)
- Chamar Edge Function
- Redirecionar para Stripe

**Código Principal:**
```typescript
const handleStripeCheckout = async (method: "card" | "pix" = "card") => {
  const requestBody: any = {
    lead_id: leadId,
    term_acceptance_id: termAcceptanceId,
    payment_method: method,
  };
  
  // Se for PIX, enviar taxa de câmbio
  if (method === "pix" && exchangeRate) {
    requestBody.exchange_rate = exchangeRate;
  }
  
  const { data, error } = await supabase.functions.invoke(
    "create-checkout-session",
    { body: requestBody }
  );
  
  if (data?.checkout_url) {
    window.location.href = data.checkout_url;
  }
};
```

### Obter Taxa de Câmbio (Frontend)

```typescript
// Exemplo de como obter taxa de câmbio
const fetchExchangeRate = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return parseFloat(data.rates.BRL);
  } catch (error) {
    console.error('Erro ao obter taxa de câmbio:', error);
    return 5.6; // Fallback
  }
};
```

---

## Webhooks e Processamento

### Configuração de Webhook no Stripe

1. **URL do Endpoint:**
   ```
   https://[seu-projeto-id].supabase.co/functions/v1/stripe-webhook
   ```

2. **Eventos Configurados:**
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`

3. **Signing Secret:**
   - Copie o secret que começa com `whsec_`
   - Configure no Supabase como `STRIPE_WEBHOOK_SECRET`

### Segurança do Webhook

O webhook valida a assinatura do Stripe para garantir que a requisição é legítima:

```typescript
// IMPORTANTE: Body deve ser RAW TEXT, não parseado
const bodyArrayBuffer = await req.arrayBuffer();
const body = new TextDecoder().decode(bodyArrayBuffer);

// Verificar assinatura
try {
  event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    stripeWebhookSecret
  );
} catch (err) {
  // Assinatura inválida - rejeitar
  return new Response(JSON.stringify({ error: "Invalid signature" }), {
    status: 400,
  });
}
```

### Logs e Debugging

O webhook salva tentativas no banco de dados (`webhook_attempts`):

```sql
CREATE TABLE webhook_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  event_type TEXT,
  success BOOLEAN,
  error_message TEXT,
  signature_length INTEGER,
  body_length INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Exemplos de Código

### Exemplo 1: Criar Checkout Session (Frontend)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createCheckout(method: 'card' | 'pix', exchangeRate?: number) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      lead_id: 'lead-uuid',
      term_acceptance_id: 'term-uuid',
      payment_method: method,
      exchange_rate: exchangeRate,
    },
  });

  if (error) {
    console.error('Erro ao criar checkout:', error);
    return;
  }

  // Redirecionar para Stripe
  window.location.href = data.checkout_url;
}
```

### Exemplo 2: Calcular Taxas (Backend)

```typescript
// Taxas para cartão
function calculateCardFee(baseAmount: number): number {
  const feePercentage = 0.039; // 3.9%
  const feeFixed = 30; // $0.30
  return Math.round(baseAmount + (baseAmount * feePercentage) + feeFixed);
}

// Taxas para PIX
function calculatePIXFee(baseAmountUSD: number, exchangeRate: number): number {
  const pixFeePercentage = 0.0179; // 1.79%
  const baseAmountBRL = baseAmountUSD * exchangeRate;
  const grossAmountBRL = baseAmountBRL / (1 - pixFeePercentage);
  return Math.round(grossAmountBRL * 100);
}

// Exemplo de uso
const baseAmount = 99900; // US$ 999,00
const cardAmount = calculateCardFee(baseAmount); // US$ 1.039,61
const pixAmount = calculatePIXFee(999, 5.6); // R$ 5.696,14
```

### Exemplo 3: Processar Webhook

```typescript
// Edge Function: stripe-webhook
Deno.serve(async (req: Request) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Obter body raw
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  // Verificar assinatura
  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    Deno.env.get("STRIPE_WEBHOOK_SECRET")!
  );

  // Processar evento
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    await supabase
      .from("payments")
      .update({
        status: "completed",
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
      })
      .eq("stripe_session_id", session.id);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

### Exemplo 4: Consultar Taxas no Banco

```sql
-- Consultar pagamento com taxas
SELECT 
  id,
  amount as valor_pago,
  currency as moeda,
  metadata->>'base_usd_amount' as valor_base_usd,
  metadata->>'final_usd_amount' as valor_final_usd,
  metadata->>'card_fee_amount' as taxa_cartao,
  metadata->>'pix_fee_amount' as taxa_pix,
  metadata->>'exchange_rate' as taxa_cambio
FROM payments
WHERE status = 'completed'
ORDER BY created_at DESC;
```

---

## Resumo das Taxas

### Cartão de Crédito (USD)
- **Taxa:** 3.9% + $0.30
- **Valor base:** US$ 999,00
- **Valor final:** US$ 1.039,61
- **Taxa total:** US$ 40,61

### PIX (BRL)
- **Taxa de processamento:** 1.19%
- **Taxa de conversão:** 0.6%
- **Taxa total:** 1.79%
- **Valor base:** US$ 999,00
- **Taxa de câmbio:** ~5.6 (exemplo)
- **Valor em BRL:** R$ 5.594,40
- **Valor final:** R$ 5.696,14
- **Taxa total:** R$ 101,74

---

## Troubleshooting

### Erro: "Webhook signature verification failed"

**Causa:** Secret do webhook incorreto ou body modificado.

**Solução:**
1. Verifique `STRIPE_WEBHOOK_SECRET` no Supabase
2. Confirme que o secret começa com `whsec_`
3. Certifique-se de que o body não é parseado antes da verificação
4. Verifique se o webhook está ativo no Stripe Dashboard

### Erro: "Stripe secret key not configured"

**Causa:** Variável de ambiente não configurada.

**Solução:**
1. Configure `STRIPE_SECRET_KEY` no Supabase
2. Para produção, use `STRIPE_SECRET_KEY_LIVE`
3. Para desenvolvimento, use `STRIPE_SECRET_KEY_TEST`

### Taxa de Câmbio Incorreta

**Causa:** API de câmbio indisponível ou taxa desatualizada.

**Solução:**
1. Sempre envie `exchange_rate` do frontend quando possível
2. Configure fallback adequado
3. Monitore logs para identificar problemas

---

## Referências

- [Documentação Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe PIX](https://stripe.com/docs/payments/pix)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Notas Finais

- As taxas são calculadas **antes** de criar a sessão Stripe
- O valor final inclui todas as taxas do Stripe
- As taxas são armazenadas no `metadata` para auditoria
- O webhook atualiza o valor real pago (pode diferir ligeiramente)
- Sempre valide a assinatura do webhook para segurança

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0








