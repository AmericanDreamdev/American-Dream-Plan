# Integração de Pagamentos: American Dream → 323 Network

Este documento descreve a integração de pagamentos do American Dream com o 323 Network.

## 📋 Visão Geral

Quando um usuário faz um pagamento no American Dream (via Stripe Card, Stripe PIX ou Zelle), o sistema sincroniza automaticamente essa informação com o 323 Network, permitindo que o usuário veja seus pagamentos em "Meus Serviços" no 323 Network.

## 🔑 Variáveis de Ambiente Necessárias

### Configuração no Supabase (Edge Functions)

Configure as seguintes variáveis de ambiente no **Supabase Dashboard → Project Settings → Edge Functions → Secrets**:

```bash
# API Key compartilhada entre American Dream e 323 Network
AMERICAN_DREAM_SHARED_API_KEY=seu_token_aqui

# URL do Supabase do 323 Network
URL_323_NETWORK=https://pgdvbanwumqjmqeybqnw.supabase.co

# Service Role Key do 323 Network (para buscar usuários por email)
SERVICE_ROLE_KEY_323_NETWORK=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ⚠️ IMPORTANTE

- A `AMERICAN_DREAM_SHARED_API_KEY` deve ser a **mesma** configurada no projeto 323 Network
- Se ainda não foi configurada, peça para configurar no 323 Network primeiro
- Use um token seguro (ex: `openssl rand -hex 32`)
- A `SERVICE_ROLE_KEY_323_NETWORK` é necessária para buscar usuários no 323 Network pelo email quando o `user_id` não corresponder

### Como obter `SERVICE_ROLE_KEY_323_NETWORK`:

1. Acesse: https://supabase.com/dashboard/project/pgdvbanwumqjmqeybqnw
2. Vá em: **Settings → API**
3. Copie a **Service Role Key** (role: `service_role`)
4. ⚠️ **CUIDADO**: Esta é uma chave sensível - nunca exponha no frontend

## 🔄 Fluxo de Sincronização

### 1. Pagamento via Stripe (Card ou PIX)

**Quando acontece:**
- Webhook do Stripe recebe evento `checkout.session.completed`
- Webhook do Stripe recebe evento `checkout.session.async_payment_succeeded`

**O que acontece:**
1. Pagamento é atualizado no banco do American Dream
2. Sistema busca o `lead.user_id` e `lead.email`
3. **Verifica se o `user_id` existe no 323 Network**
4. **Se não existir, busca o usuário pelo email no 323 Network**
5. **Se encontrar, atualiza o `lead.user_id` com o valor correto**
6. Sincroniza com 323 Network usando o `user_id` correto
7. Se não encontrar usuário, apenas loga um aviso (não falha o fluxo)

**Localização:** `supabase/functions/stripe-webhook/index.ts`

### 2. Pagamento via Zelle (Aprovação Manual)

**Quando acontece:**
- Admin aprova um comprovante de pagamento Zelle

**O que acontece:**
1. Comprovante é aprovado e payment é atualizado para `completed`
2. Sistema busca o `lead.user_id` e `lead.email`
3. **Verifica se o `user_id` existe no 323 Network**
4. **Se não existir, busca o usuário pelo email no 323 Network**
5. **Se encontrar, atualiza o `lead.user_id` com o valor correto**
6. Sincroniza com 323 Network usando o `user_id` correto
7. Se não encontrar usuário, apenas loga um aviso (não falha a aprovação)

**Localização:** `supabase/functions/approve-payment-proof/index.ts`

## 📦 Estrutura de Dados

### Payload Enviado para 323 Network

```typescript
{
  user_id: string,              // UUID do usuário no 323 Network (lead.user_id)
  payment_id: string,            // ID do pagamento no American Dream
  lead_id?: string,              // ID do lead no American Dream
  amount: number,                // Valor em CENTAVOS (ex: 10000 = $100.00)
  currency?: string,             // 'USD' ou 'BRL' (padrão: 'USD')
  payment_method: 'card' | 'pix' | 'zelle',
  status: 'completed' | 'pending' | 'failed',
  stripe_session_id?: string,     // Para pagamentos Stripe
  stripe_payment_intent_id?: string, // Para pagamentos Stripe
  metadata?: Record<string, any> // Metadados adicionais
}
```

### ⚠️ Pontos Importantes

1. **User ID do 323 Network**: O `user_id` deve ser o UUID do usuário no **323 Network**, não no American Dream. Este valor é armazenado em `leads.user_id` e é sincronizado via SSO quando o usuário se autentica.

2. **Valor em Centavos**: O `amount` deve estar em **centavos**:
   - ✅ `10000` = $100.00
   - ✅ `5000` = $50.00
   - ❌ `100` = $1.00 (errado se for $100)

3. **Tratamento de Erros**: A sincronização **não deve falhar** o fluxo principal de pagamento:
   - Use `try/catch` para capturar erros
   - Logue os erros para debug
   - Continue o processamento normal mesmo se a sincronização falhar

4. **Idempotência**: A Edge Function do 323 Network é idempotente:
   - Se você chamar com o mesmo `payment_id` várias vezes, não cria duplicatas
   - Pode chamar novamente se houver dúvida se foi sincronizado

## 🔍 Debugging

### Verificar se está funcionando:

1. **Logs no American Dream**:
   - Verificar console.log da função `syncPaymentTo323Network`
   - Verificar se está chamando a URL correta

2. **Logs no 323 Network**:
   - Acessar Supabase Dashboard > Edge Functions > `sync-american-dream-payment` > Logs
   - Verificar se está recebendo as requisições

3. **Verificar no banco**:
   ```sql
   -- No 323 Network (Supabase SQL Editor)
   SELECT * FROM service_payments 
   WHERE source = 'american_dream' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### Erros Comuns:

**"User not found in 323 Network"**
- Causa: `lead.user_id` não existe ou está incorreto, e não foi possível encontrar pelo email
- Solução: 
  - Verificar se o `SERVICE_ROLE_KEY_323_NETWORK` está configurada
  - Verificar se o email do lead corresponde ao email no 323 Network
  - Verificar logs para ver se a busca por email foi executada

**"Invalid API key"**
- Causa: API key não configurada ou incorreta
- Solução: Verificar variável `AMERICAN_DREAM_SHARED_API_KEY` em ambos os projetos

**"Missing required fields"**
- Causa: Algum campo obrigatório não está sendo enviado
- Solução: Verificar se todos os campos estão no payload

## ✅ Checklist de Implementação

- [x] Função `syncPaymentTo323Network()` criada
- [x] Integração no webhook Stripe implementada
- [x] Integração na aprovação Zelle implementada
- [ ] API key configurada no Supabase (Edge Functions)
- [ ] Testado com pagamento real via Stripe (Card)
- [ ] Testado com pagamento real via Stripe (Pix)
- [ ] Testado com aprovação manual de Zelle
- [ ] Verificado aparecimento em "Meus Serviços" do 323 Network
- [ ] Tratamento de erros implementado (não falha fluxo principal)

## 📞 Suporte

Se tiver problemas:
1. Verificar logs da Edge Function no Supabase Dashboard do 323 Network
2. Verificar logs do webhook do Stripe no American Dream
3. Verificar se o `lead.user_id` está preenchido
4. Testar a função helper manualmente primeiro

---

**Última atualização**: 2026-01-02

