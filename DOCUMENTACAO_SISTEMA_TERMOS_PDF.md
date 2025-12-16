# Documentação: Sistema de Aceitação de Termos e Geração de PDF

## Visão Geral

Este documento descreve o sistema completo de aceitação de termos e condições e a geração automática de PDFs com todas as informações do contrato, dados do aluno, IP, user agent e outras informações relevantes.

## Arquitetura do Sistema

O sistema é composto por:

1. **Frontend (React/TypeScript)**: Interface para exibição e aceitação de termos
2. **Hook Customizado**: `useTermsAcceptance` para gerenciar a aceitação
3. **Função RPC do Banco**: `record_term_acceptance` para registrar a aceitação
4. **Edge Function**: `generate-contract-pdf` para gerar o PDF automaticamente
5. **Storage**: Supabase Storage para armazenar os PDFs gerados

## Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ACEITAÇÃO DE TERMOS                 │
└─────────────────────────────────────────────────────────────────┘

1. USUÁRIO PREENCHE FORMULÁRIO
   │
   ├─> Exibe checkbox "Aceito os termos"
   │
   └─> Usuário clica em "Ver termos" → Abre /terms

2. PÁGINA DE TERMOS (/terms)
   │
   ├─> Carrega termo ativo do banco (application_terms)
   │
   └─> Exibe conteúdo HTML dos termos

3. USUÁRIO ACEITA TERMOS
   │
   ├─> Marca checkbox
   │
   └─> Submete formulário

4. CAPTURA DE INFORMAÇÕES DO CLIENTE
   │
   ├─> getClientInfo() chama api.ipify.org → Obtém IP
   │
   └─> navigator.userAgent → Obtém User Agent

5. REGISTRO DA ACEITAÇÃO
   │
   ├─> recordTermAcceptance() chama RPC record_term_acceptance
   │
   ├─> Insere em term_acceptance:
   │   - lead_id
   │   - term_id
   │   - ip_address
   │   - user_agent
   │   - accepted_at (timestamp)
   │
   └─> Retorna term_acceptance_id

6. GERAÇÃO DO PDF (Background - não bloqueia)
   │
   ├─> Chama Edge Function: generate-contract-pdf
   │
   ├─> Busca dados:
   │   - Lead (nome, email, telefone)
   │   - Term Acceptance (IP, user agent, data)
   │   - Term Content (título, conteúdo)
   │
   ├─> Gera PDF com jsPDF:
   │   - Cabeçalho
   │   - Informações do contratante
   │   - Conteúdo do contrato
   │   - Detalhes da aceitação (IP, user agent, data)
   │   - Assinatura digital
   │
   ├─> Upload para Supabase Storage (bucket: contracts)
   │
   └─> Atualiza term_acceptance.pdf_url

7. RESULTADO
   │
   ├─> PDF armazenado em: contracts/{nome}_{data}_{timestamp}.pdf
   │
   └─> URL pública disponível em term_acceptance.pdf_url
```

---

## Fluxo Completo

### 1. Exibição dos Termos

**Arquivo**: `src/pages/TermsAndConditions.tsx`

- A página carrega o termo ativo do banco de dados (`application_terms`)
- Filtra por `term_type = 'lead_contract'` e `is_active = true`
- Exibe o conteúdo HTML dos termos
- Permite navegação de volta para o formulário

```typescript
// Exemplo de como carregar o termo ativo
const { data, error } = await supabase
  .from("application_terms")
  .select("*")
  .eq("term_type", "lead_contract")
  .eq("is_active", true)
  .order("version", { ascending: false })
  .limit(1)
  .maybeSingle();
```

### 2. Checkbox de Aceitação

**Arquivos**: `src/pages/LeadForm.tsx`, `src/pages/AnalysisForm.tsx`

- Formulários incluem um checkbox obrigatório para aceitar termos
- Link para visualizar os termos abre em nova página
- Validação impede submissão sem aceitar

```tsx
<FormField
  control={form.control}
  name="termsAccepted"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel>
        Li e concordo com os{" "}
        <button onClick={() => navigate("/terms")}>
          termos e condições
        </button>
      </FormLabel>
    </FormItem>
  )}
/>
```

### 3. Captura de Informações do Cliente

**Arquivo**: `src/hooks/useTermsAcceptance.ts`

O hook `useTermsAcceptance` possui uma função `getClientInfo()` que:

- **Captura IP**: Usa a API `https://api.ipify.org?format=json`
- **Captura User Agent**: Usa `navigator.userAgent`

```typescript
const getClientInfo = async (): Promise<ClientInfo> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return {
      ip_address: data.ip,
      user_agent: navigator.userAgent,
    };
  } catch (error) {
    console.warn("Could not get IP address:", error);
    return {
      ip_address: null,
      user_agent: navigator.userAgent,
    };
  }
};
```

### 4. Registro da Aceitação

**Arquivo**: `src/hooks/useTermsAcceptance.ts`

Após capturar as informações do cliente, o sistema chama a função RPC `record_term_acceptance`:

```typescript
const recordTermAcceptance = async (
  leadId: string,
  termId: string,
  termType: TermType = "lead_contract"
): Promise<string | null> => {
  const clientInfo = await getClientInfo();

  const { data, error } = await supabase.rpc("record_term_acceptance", {
    p_lead_id: leadId,
    p_term_id: termId,
    p_term_type: termType,
    p_ip_address: clientInfo.ip_address,
    p_user_agent: clientInfo.user_agent,
  });

  return data || null; // Retorna o ID da aceitação
};
```

**Parâmetros da RPC**:
- `p_lead_id`: ID do lead/aluno
- `p_term_id`: ID do termo aceito
- `p_term_type`: Tipo do termo (ex: "lead_contract")
- `p_ip_address`: Endereço IP do cliente
- `p_user_agent`: User agent do navegador

**Retorno**: ID da aceitação (`term_acceptance_id`)

### 5. Estrutura do Banco de Dados

#### Tabela: `term_acceptance`

```sql
CREATE TABLE term_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES application_terms(id),
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos importantes**:
- `id`: ID único da aceitação
- `lead_id`: Referência ao lead/aluno
- `term_id`: Referência ao termo aceito
- `accepted_at`: Data/hora da aceitação
- `ip_address`: IP do cliente
- `user_agent`: User agent do navegador
- `pdf_url`: URL do PDF gerado (preenchido após geração)

#### Tabela: `application_terms`

```sql
CREATE TABLE application_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML content
  term_type TEXT NOT NULL,
  version INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Geração Automática do PDF

**Arquivo**: `supabase/functions/generate-contract-pdf/index.ts`

A Edge Function é chamada automaticamente após o registro da aceitação:

```typescript
// Chamada da função (não bloqueia o fluxo)
fetch(`${supabaseUrl}/functions/v1/generate-contract-pdf`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": supabaseAnonKey,
    "Authorization": `Bearer ${session?.access_token || supabaseAnonKey}`,
  },
  body: JSON.stringify({
    lead_id: data.id,
    term_acceptance_id: acceptanceId,
  }),
  keepalive: true, // Mantém a requisição mesmo após navegação
});
```

#### Processo de Geração do PDF

1. **Busca de Dados**:
   - Busca dados do lead (nome, email, telefone)
   - Busca dados da aceitação (IP, user agent, data)
   - Busca conteúdo do termo (título e conteúdo HTML)

2. **Criação do PDF** (usando jsPDF):
   - **Cabeçalho**: "DOCUMENTO DE ACEITAÇÃO DE TERMOS"
   - **Informações do Contratante**: Nome, E-mail, Telefone
   - **Conteúdo do Contrato**: Texto completo dos termos (HTML convertido para texto)
   - **Seção de Assinatura**: Data formatada, nome sublinhado
   - **Detalhes da Aceitação**:
     - Título do Termo
     - Data/hora da aceitação (formato pt-BR)
     - Endereço IP
     - Navegador/Dispositivo (user agent)
   - **Rodapé**: Data de geração e nota de validade legal

3. **Upload para Storage**:
   - Nome do arquivo: `{nome-normalizado}_{data}_{timestamp}.pdf`
   - Bucket: `contracts`
   - Atualiza `term_acceptance.pdf_url` com a URL pública

```typescript
// Exemplo de estrutura do PDF gerado
const pdf = new jsPDF();

// Cabeçalho
pdf.text("DOCUMENTO DE ACEITAÇÃO DE TERMOS", pageWidth / 2, 20, {
  align: "center",
});

// Informações do Contratante
pdf.text(`Nome: ${lead.name}`, 20, 50);
pdf.text(`E-mail: ${lead.email}`, 20, 60);
pdf.text(`Telefone: ${lead.phone}`, 20, 70);

// Conteúdo do Contrato
pdf.text("CONTEÚDO DO CONTRATO", 20, 90);
// ... conteúdo dos termos ...

// Detalhes da Aceitação
pdf.text(`Aceito em: ${acceptanceDate}`, 20, 200);
pdf.text(`Endereço IP: ${termAcceptance.ip_address}`, 20, 210);
pdf.text(`Navegador/Dispositivo: ${termAcceptance.user_agent}`, 20, 220);
```

---

## Implementação em Outro Projeto

### Passo 1: Configurar Banco de Dados

Criar as tabelas necessárias:

```sql
-- Tabela de termos
CREATE TABLE application_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  term_type TEXT NOT NULL,
  version INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de aceitação
CREATE TABLE term_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES application_terms(id),
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_term_acceptance_lead_id ON term_acceptance(lead_id);
CREATE INDEX idx_term_acceptance_term_id ON term_acceptance(term_id);
```

### Passo 2: Criar Função RPC

```sql
CREATE OR REPLACE FUNCTION record_term_acceptance(
  p_lead_id UUID,
  p_term_id UUID,
  p_term_type TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_acceptance_id UUID;
BEGIN
  INSERT INTO term_acceptance (
    lead_id,
    term_id,
    ip_address,
    user_agent
  ) VALUES (
    p_lead_id,
    p_term_id,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_acceptance_id;
  
  RETURN v_acceptance_id;
END;
$$;

-- Dar permissão para usuários anônimos (se necessário)
GRANT EXECUTE ON FUNCTION record_term_acceptance TO anon;
GRANT EXECUTE ON FUNCTION record_term_acceptance TO authenticated;
```

**Nota**: A função usa `SECURITY DEFINER` para executar com privilégios elevados, permitindo inserir dados mesmo com RLS ativado. Ajuste as permissões conforme sua política de segurança.

### Passo 3: Criar Hook React

Copiar e adaptar `src/hooks/useTermsAcceptance.ts`:

```typescript
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ClientInfo {
  ip_address: string | null;
  user_agent: string;
}

export const useTermsAcceptance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClientInfo = useCallback(async (): Promise<ClientInfo> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return {
        ip_address: data.ip,
        user_agent: navigator.userAgent,
      };
    } catch (error) {
      return {
        ip_address: null,
        user_agent: navigator.userAgent,
      };
    }
  }, []);

  const recordTermAcceptance = useCallback(
    async (
      leadId: string,
      termId: string,
      termType: string = "contract"
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const clientInfo = await getClientInfo();

        const { data, error: rpcError } = await supabase.rpc(
          "record_term_acceptance",
          {
            p_lead_id: leadId,
            p_term_id: termId,
            p_term_type: termType,
            p_ip_address: clientInfo.ip_address,
            p_user_agent: clientInfo.user_agent,
          }
        );

        if (rpcError) throw rpcError;

        return data || null;
      } catch (error: any) {
        setError(error.message || "Failed to record term acceptance");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getClientInfo]
  );

  return {
    recordTermAcceptance,
    loading,
    error,
  };
};
```

### Passo 4: Criar Edge Function para PDF

Criar `supabase/functions/generate-contract-pdf/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@^2.5.1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, term_acceptance_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar dados
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    const { data: termAcceptance } = await supabase
      .from("term_acceptance")
      .select("*")
      .eq("id", term_acceptance_id)
      .single();

    const { data: termData } = await supabase
      .from("application_terms")
      .select("title, content")
      .eq("id", termAcceptance.term_id)
      .single();

    // Gerar PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // Adicionar conteúdo ao PDF
    // ... (ver código completo no arquivo original)

    // Upload para storage
    const pdfBlob = pdf.output("blob");
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

    const fileName = `${normalizedName}_${dateStr}_${timestamp}.pdf`;
    const { data: uploadData } = await supabase.storage
      .from("contracts")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("contracts")
      .getPublicUrl(fileName);

    // Atualizar term_acceptance
    await supabase
      .from("term_acceptance")
      .update({ pdf_url: publicUrl })
      .eq("id", term_acceptance_id);

    return new Response(
      JSON.stringify({ success: true, pdf_url: publicUrl }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

### Passo 5: Configurar Storage

1. Criar bucket `contracts` no Supabase Storage
2. Configurar políticas de acesso (público para leitura, autenticado para escrita)

### Passo 6: Integrar no Formulário

```typescript
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";

const MyForm = () => {
  const { recordTermAcceptance, loading } = useTermsAcceptance();
  const [activeTerm, setActiveTerm] = useState(null);

  const onSubmit = async (values) => {
    // 1. Salvar lead
    const { data: lead } = await supabase
      .from("leads")
      .insert({ ...values })
      .select()
      .single();

    // 2. Registrar aceitação
    const acceptanceId = await recordTermAcceptance(
      lead.id,
      activeTerm.id,
      "contract"
    );

    // 3. Gerar PDF em background
    if (acceptanceId) {
      fetch(`${supabaseUrl}/functions/v1/generate-contract-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          term_acceptance_id: acceptanceId,
        }),
        keepalive: true,
      });
    }

    // 4. Redirecionar
    navigate("/success");
  };
};
```

---

## Informações Capturadas no PDF

O PDF gerado contém:

1. **Informações do Contratante**:
   - Nome completo
   - E-mail
   - Telefone

2. **Conteúdo do Contrato**:
   - Título do termo
   - Texto completo dos termos e condições

3. **Detalhes da Aceitação**:
   - Título do termo aceito
   - Data e hora da aceitação (formato: DD/MM/YYYY HH:MM:SS)
   - Endereço IP do cliente
   - User Agent (navegador/dispositivo)

4. **Assinatura Digital**:
   - Nome sublinhado
   - Data formatada (ex: "Los Angeles, Califórnia, 07 de janeiro de 2025")

5. **Rodapé**:
   - Data de geração do PDF
   - Nota de validade legal

---

## Dependências Necessárias

### Frontend:
- `@supabase/supabase-js`: Cliente Supabase
- React Hook Form (opcional, para formulários)

### Edge Function:
- `jsr:@supabase/functions-js/edge-runtime.d.ts`: Runtime do Deno
- `jsr:@supabase/supabase-js@2`: Cliente Supabase
- `npm:jspdf@^2.5.1`: Biblioteca para geração de PDF

### APIs Externas:
- `https://api.ipify.org?format=json`: Para captura de IP

---

## Variáveis de Ambiente Necessárias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

**Edge Function** (configuradas no Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Segurança

1. **RLS (Row Level Security)**: Configure políticas adequadas nas tabelas
2. **Service Role Key**: Use apenas na Edge Function (nunca no frontend)
3. **Validação**: Sempre valide dados antes de inserir no banco
4. **Sanitização**: Sanitize conteúdo HTML antes de exibir

---

## Troubleshooting

### PDF não está sendo gerado
- Verifique logs da Edge Function no Supabase
- Confirme que o bucket `contracts` existe
- Verifique permissões do storage

### IP não está sendo capturado
- API `ipify.org` pode estar bloqueada
- Implemente fallback para `null`

### User Agent não está sendo capturado
- Verifique se `navigator.userAgent` está disponível
- Alguns navegadores podem bloquear

---

## Exemplo de Uso Completo

```typescript
// 1. Carregar termo ativo
const { data: term } = await supabase
  .from("application_terms")
  .select("*")
  .eq("is_active", true)
  .single();

// 2. Usuário aceita termos (checkbox)
const termsAccepted = true;

// 3. Ao submeter formulário
const { recordTermAcceptance } = useTermsAcceptance();

const acceptanceId = await recordTermAcceptance(
  leadId,
  term.id,
  "contract"
);

// 4. PDF é gerado automaticamente em background
// URL fica disponível em term_acceptance.pdf_url
```

---

## Conclusão

Este sistema fornece uma solução completa para:
- ✅ Exibição de termos e condições
- ✅ Captura de consentimento do usuário
- ✅ Registro de informações legais (IP, user agent, data)
- ✅ Geração automática de PDF com todas as informações
- ✅ Armazenamento seguro dos documentos

Todas as informações são capturadas automaticamente e incluídas no PDF para fins de comprovação legal.

