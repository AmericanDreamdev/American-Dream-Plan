# Configuração de Autenticação do Dashboard

O dashboard agora está protegido com autenticação. Apenas usuários autenticados podem acessar.

## Como Criar o Usuário de Acesso

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Navegue até **Authentication** → **Users**
4. Clique em **Add user** → **Create new user**
5. Preencha:
   - **Email**: Seu email de acesso
   - **Password**: Uma senha segura
   - **Auto Confirm User**: ✅ (marcar para não precisar confirmar email)
6. Clique em **Create user**

### Opção 2: Via SQL (Supabase SQL Editor)

Você também pode criar o usuário diretamente via SQL:

```sql
-- Criar usuário com email e senha
-- Substitua 'seu@email.com' e 'sua_senha_segura' pelos valores desejados
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'seu@email.com',
  crypt('sua_senha_segura', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  '',
  ''
);
```

⚠️ **Nota**: A criação via SQL é mais complexa. Recomenda-se usar a Opção 1 (Dashboard).

## Acessar o Dashboard

1. Acesse: `https://seusite.com/login`
2. Insira o email e senha criados
3. Você será redirecionado automaticamente para `/dashboard`

## Segurança

- O dashboard está completamente protegido - sem login, ninguém pode acessar
- A sessão é mantida até que o usuário faça logout
- O botão "Sair" no dashboard faz logout e redireciona para a página de login

## Proteção da Rota

A rota `/dashboard` está protegida pelo componente `ProtectedRoute` que:
- Verifica se o usuário está autenticado
- Redireciona para `/login` se não estiver autenticado
- Permite acesso apenas se autenticado

