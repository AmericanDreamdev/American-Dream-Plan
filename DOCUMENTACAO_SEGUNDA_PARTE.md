# Documentação - Segunda Parte do Pagamento

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Acessar](#como-acessar)
3. [Métodos de Pagamento](#métodos-de-pagamento)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Diferenças em Relação à Primeira Parte](#diferenças-em-relação-à-primeira-parte)

---

## Visão Geral

A página de **Segunda Parte do Pagamento** (`/segunda-parte`) permite aos usuários realizar o pagamento da segunda parcela da consultoria American Dream, no valor de **US$ 999,00** (ou equivalente em BRL).

### Características:
- **Valor:** US$ 999,00 (mesmo da primeira parte)
- **Métodos de pagamento:** Iguais à primeira parte (Stripe Card, PIX, Zelle, InfinitePay)
- **Sem validação:** Não verifica se a primeira parte foi paga
- **Identificação:** Campo `payment_part: 2` no metadata

---

## Como Acessar

### URL da Página

```
https://seusite.com/segunda-parte?lead_id={UUID}&term_acceptance_id={UUID}
```

### Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `lead_id` | UUID | ID do lead (mesmo usado na primeira parte) |
| `term_acceptance_id` | UUID | ID da aceitação de termos (mesmo usado na primeira parte) |
| `country` | String | País do usuário (opcional, padrão: US) |

### Exemplos de URLs

```bash
# Usuário dos EUA
https://americandream.323network.com/segunda-parte?lead_id=123e4567-e89b-12d3-a456-426614174000&term_acceptance_id=789e0123-e45b-67c8-d901-234567890abc

# Usuário do Brasil
https://americandream.323network.com/segunda-parte?lead_id=123e4567-e89b-12d3-a456-426614174000&term_acceptance_id=789e0123-e45b-67c8-d901-234567890abc&country=BR
```

---

## Métodos de Pagamento

### Para Usuários do Brasil

Apenas **InfinitePay** é exibido:
- **Valor:** R$ 5.776,00
- **Redirecionamento:** Direto para o link do InfinitePay

### Para Usuários de Outros Países

Três opções são exibidas:

| Método | Valor (USD) | Valor (BRL) | Taxas |
|--------|-------------|-------------|-------|
| **Zelle** | US$ 999,00 | - | Sem taxas |
| **Stripe Card** | US$ 1.038,26 | - | 3.9% + $0.30 |
| **Stripe PIX** | - | R$ 5.696,14 | 1.79% + conversão |

### Cálculo de Valores

Os cálculos são **idênticos** à primeira parte:

```typescript
// Cartão de Crédito
const baseUsdAmount = 999.00;
const cardFeePercentage = 0.039; // 3.9%
const cardFeeFixed = 0.30;
const cardFinalAmount = baseUsdAmount + (baseUsdAmount * cardFeePercentage) + cardFeeFixed;
// Resultado: US$ 1.038,26

// PIX
const STRIPE_PIX_TOTAL_PERCENTAGE = 0.0179; // 1.79%
const exchangeRate = 5.6; // Exemplo
const pixFinalAmount = (baseUsdAmount * exchangeRate) / (1 - STRIPE_PIX_TOTAL_PERCENTAGE);
// Resultado: ~R$ 5.696,14
```

---

## Fluxo de Funcionamento

### Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────┐
│ Usuário acessa /segunda-parte                      │
│ com lead_id e term_acceptance_id                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Sistema valida parâmetros                          │
│ - Se faltarem → Redireciona para /lead-form       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Exibe métodos de pagamento baseado no país        │
│ - Brasil: InfinitePay                              │
│ - Outros: Zelle, Card, PIX                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Usuário escolhe método e confirma                  │
└────────────────┬────────────────────────────────────┘
                 │
      ┌──────────┴──────────┬─────────────────┐
      ▼                     ▼                 ▼
   Zelle                 Stripe            InfinitePay
      │                     │                 │
      ▼                     ▼                 ▼
  Registra              Cria sessão        Registra
  payment              (payment_part=2)     payment
  payment_part=2            │              payment_part=2
      │                     │                 │
      ▼                     ▼                 ▼
  Redireciona          Redireciona        Redireciona
  /zelle-checkout     Stripe Checkout    InfinitePay
      │                     │                 │
      └─────────────────────┴─────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │ Pagamento       │
                 │ Processado      │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Webhook atualiza│
                 │ status (parte 2)│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Email enviado   │
                 │ (segunda parte) │
                 └─────────────────┘
```

---

## Estrutura de Dados

### Tabela `payments`

Os registros da segunda parte são salvos na mesma tabela `payments`, diferenciados pelo campo `payment_part` no metadata:

```sql
-- Exemplo de registro da segunda parte
SELECT 
  id,
  lead_id,
  term_acceptance_id,
  amount,
  currency,
  status,
  metadata
FROM payments
WHERE metadata->>'payment_part' = '2'
ORDER BY created_at DESC;
```

### Exemplo de Metadata (Segunda Parte)

```json
{
  "payment_method": "card",
  "payment_part": 2,
  "base_usd_amount": "999.00",
  "final_usd_amount": "1038.26",
  "card_fee_amount": "39.26",
  "card_fee_percentage": "3.9",
  "exchange_rate": "5.600"
}
```

### Consultar Pagamentos por Parte

```sql
-- Todos os pagamentos da segunda parte
SELECT 
  id,
  lead_id,
  amount,
  currency,
  status,
  created_at,
  metadata->>'payment_part' as payment_part,
  metadata->>'payment_method' as payment_method
FROM payments
WHERE metadata->>'payment_part' = '2'
ORDER BY created_at DESC;

-- Total arrecadado por parte
SELECT 
  metadata->>'payment_part' as payment_part,
  COUNT(*) as total_payments,
  SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END) as total_usd,
  SUM(CASE WHEN currency = 'BRL' THEN amount ELSE 0 END) as total_brl
FROM payments
WHERE status = 'completed'
  AND metadata->>'payment_part' IS NOT NULL
GROUP BY metadata->>'payment_part';
```

---

## Diferenças em Relação à Primeira Parte

### Semelhanças
- ✅ Mesmos métodos de pagamento
- ✅ Mesmos cálculos de taxas
- ✅ Mesma lógica de processamento
- ✅ Mesmo fluxo de webhook

### Diferenças

| Aspecto | Primeira Parte | Segunda Parte |
|---------|----------------|---------------|
| **Rota** | `/payment-options` | `/segunda-parte` |
| **Título** | "Escolha a forma de pagamento" | "Segunda Parte do Pagamento" |
| **Subtítulo** | "Selecione o método de pagamento de sua preferência" | "Complete seu investimento na consultoria American Dream" |
| **Metadata** | `payment_part: 1` (ou ausente) | `payment_part: 2` |
| **Email Subject** | "Pagamento Confirmado - American Dream" | "Confirmação - Segunda Parte do Pagamento - American Dream" |
| **Validação** | Nenhuma (primeira vez) | Nenhuma (não valida primeira parte) |
| **Botão Voltar** | Vai para `/lead-form` | Vai para `/oferta` |

### Código das Páginas

**Primeira Parte:**
```typescript
// src/pages/PaymentOptions.tsx
const handleStripeCheckout = async (method: "card" | "pix" = "card") => {
  const requestBody: any = {
    lead_id: leadId,
    term_acceptance_id: termAcceptanceId,
    payment_method: method,
    // payment_part não é enviado (padrão: 1)
  };
  // ...
};
```

**Segunda Parte:**
```typescript
// src/pages/SecondPayment.tsx
const handleStripeCheckout = async (method: "card" | "pix" = "card") => {
  const requestBody: any = {
    lead_id: leadId,
    term_acceptance_id: termAcceptanceId,
    payment_method: method,
    payment_part: 2, // EXPLICITAMENTE ENVIADO
  };
  // ...
};
```

---

## Envio de Links

### Como Enviar o Link da Segunda Parte

Para enviar o link da segunda parte para um cliente, você precisa:

1. **Obter o `lead_id` e `term_acceptance_id`** do cliente no banco de dados:

```sql
SELECT 
  l.id as lead_id,
  ta.id as term_acceptance_id,
  l.name,
  l.email
FROM leads l
LEFT JOIN term_acceptance ta ON ta.lead_id = l.id
WHERE l.email = 'cliente@exemplo.com';
```

2. **Construir a URL:**

```
https://americandream.323network.com/segunda-parte?lead_id={lead_id}&term_acceptance_id={term_acceptance_id}
```

3. **Enviar por email, WhatsApp ou outro canal**

### Template de Email

```html
Olá [NOME],

Para completar seu investimento na consultoria American Dream, 
por favor acesse o link abaixo para realizar a segunda parte do pagamento:

[LINK DA SEGUNDA PARTE]

Valor: US$ 999,00 (ou equivalente em BRL)

Atenciosamente,
Equipe American Dream
```

---

## Troubleshooting

### Problema: "Usuário não consegue acessar a página"

**Solução:** Verifique se a URL contém `lead_id` e `term_acceptance_id` válidos.

### Problema: "Métodos de pagamento não aparecem"

**Solução:** 
1. Verifique o parâmetro `country` (BR exibe apenas InfinitePay)
2. Verifique console do navegador para erros

### Problema: "Pagamento não é identificado como segunda parte"

**Solução:** Verifique se `payment_part: 2` está sendo enviado no request para `create-checkout-session`:

```sql
-- Verificar no banco de dados
SELECT 
  id,
  metadata->>'payment_part' as payment_part,
  metadata->>'payment_method' as payment_method
FROM payments
WHERE lead_id = 'lead-uuid'
ORDER BY created_at DESC;
```

---

## Referências

- [Documentação Integração Stripe](./DOCUMENTACAO_INTEGRACAO_STRIPE.md)
- [Plano de Implementação](./.cursor/plans/segunda_parte_pagamento_0785c50e.plan.md)

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0


