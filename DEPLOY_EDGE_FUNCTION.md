# Guia de Deploy da Edge Function via CLI

## Passo 1: Login no Supabase CLI

Abra o terminal PowerShell e execute:

```powershell
supabase login
```

Isso abrirá o navegador para você fazer login. Após o login, volte ao terminal.

## Passo 2: Linkar o Projeto (se necessário)

Se o projeto ainda não estiver linkado, execute:

```powershell
cd "c:\Users\victurib\American Dream\american-dream-plan"
supabase link --project-ref xwgdvpicgsjeyqejanwa
```

**OU** se você preferir usar o project-ref do arquivo local:

```powershell
supabase link --project-ref xcmugywaapwmgirberiv
```

## Passo 3: Deploy da Função stripe-webhook

Execute o comando de deploy:

```powershell
supabase functions deploy stripe-webhook
```

Se você quiser especificar o project-ref diretamente:

```powershell
supabase functions deploy stripe-webhook --project-ref xwgdvpicgsjeyqejanwa
```

## Passo 4: Verificar o Deploy

Após o deploy, você pode verificar se a função foi deployada corretamente:

```powershell
supabase functions list
```

## Troubleshooting

### Se der erro de permissões:
- Certifique-se de que está logado: `supabase login`
- Verifique se você tem acesso ao projeto no dashboard do Supabase

### Se der erro de projeto não encontrado:
- Verifique o project-ref correto no dashboard do Supabase
- O project-ref está na URL: `https://[PROJECT_REF].supabase.co`

### Para ver logs da função:
```powershell
supabase functions logs stripe-webhook
```

## Alternativa: Deploy direto sem linkar

Se você não quiser linkar o projeto, pode fazer deploy direto:

```powershell
supabase functions deploy stripe-webhook --project-ref xwgdvpicgsjeyqejanwa --no-verify-jwt
```

**Nota:** O `--no-verify-jwt` desabilita a verificação JWT (não recomendado para produção, mas útil para testes).

