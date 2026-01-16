import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  token: string;
  email?: string;
  name?: string;
  phone?: string;
  phoneCountryCode?: string;
}

/**
 * Decodifica um JWT sem validar (apenas para obter os dados)
 */
function decodeJWT(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch (error) {
    console.error("[auth-with-323-token] Erro ao decodificar token:", error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, email, name, phone, phoneCountryCode }: RequestBody =
      await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decodificar o token do 323 Network para obter os dados do usuário
    const decoded = decodeJWT(token);
    if (!decoded) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou malformado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extrair dados do usuário do token
    const userMetadata = decoded.user_metadata || {};
    const userEmail = email || decoded.email || userMetadata.email;
    const userName = name || userMetadata.name || userMetadata.nome || decoded.name;
    const userPhone = phone || userMetadata.phone || decoded.phone || "";
    const userPhoneCountryCode =
      phoneCountryCode ||
      userMetadata.phoneCountryCode ||
      userMetadata.phone_country_code ||
      null;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Email não encontrado no token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[auth-with-323-token] Processando autenticação para:", userEmail);

    // Inicializar cliente Supabase do American Dream com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o usuário já existe no projeto do American Dream
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    let existingUser = null;
    if (!listError && existingUsers?.users) {
      existingUser = existingUsers.users.find((u) => u.email === userEmail);
    }

    let userId: string;
    let accessToken: string;
    let refreshToken: string;

    if (existingUser) {
      // Usuário já existe, atualizar metadata se necessário
      console.log("[auth-with-323-token] Usuário existente encontrado:", existingUser.id);
      
      const updateData: any = {};
      if (userName && existingUser.user_metadata?.name !== userName) {
        updateData.name = userName;
        updateData.nome = userName;
      }
      if (userPhone && existingUser.user_metadata?.phone !== userPhone) {
        updateData.phone = userPhone;
      }
      if (userPhoneCountryCode && existingUser.user_metadata?.phoneCountryCode !== userPhoneCountryCode) {
        updateData.phoneCountryCode = userPhoneCountryCode;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              ...existingUser.user_metadata,
              ...updateData,
            },
          }
        );
        if (updateError) {
          console.warn("[auth-with-323-token] Aviso ao atualizar metadata:", updateError);
        }
      }

      userId = existingUser.id;
      
      // Gerar magic link para o usuário existente
      // O cliente vai usar este link para criar a sessão
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
        options: {
          redirectTo: `${Deno.env.get("SITE_URL") || "http://localhost:8080"}/auth/callback`,
        },
      });

      if (linkError || !linkData) {
        throw new Error(`Erro ao gerar link: ${linkError?.message || "Erro desconhecido"}`);
      }

      // O link contém um token que pode ser usado para autenticação
      // Extrair o token do link
      const linkUrl = new URL(linkData.properties.action_link);
      const magicToken = linkUrl.searchParams.get("token");
      
      if (!magicToken) {
        throw new Error("Token não encontrado no link gerado");
      }

      // Usar o token do magic link
      accessToken = magicToken;
      refreshToken = magicToken;
    } else {
      // Criar novo usuário no projeto do American Dream
      console.log("[auth-with-323-token] Criando novo usuário...");
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: userName,
          nome: userName,
          phone: userPhone,
          phoneCountryCode: userPhoneCountryCode,
          source: "323-network",
        },
      });

      if (createError || !newUser) {
        throw new Error(
          `Erro ao criar usuário: ${createError?.message || "Erro desconhecido"}`
        );
      }

      userId = newUser.user.id;
      console.log("[auth-with-323-token] Usuário criado:", userId);

      // Gerar magic link para o novo usuário
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
        options: {
          redirectTo: `${Deno.env.get("SITE_URL") || "http://localhost:8080"}/auth/callback`,
        },
      });

      if (linkError || !linkData) {
        throw new Error(
          `Erro ao gerar link: ${linkError?.message || "Erro desconhecido"}`
        );
      }

      // Extrair token do link
      const linkUrl = new URL(linkData.properties.action_link);
      const magicToken = linkUrl.searchParams.get("token");
      
      if (!magicToken) {
        throw new Error("Token não encontrado no link gerado");
      }

      accessToken = magicToken;
      refreshToken = magicToken;
    }

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        magic_token: accessToken, // Token do magic link para usar com verifyOtp
        user: {
          id: userId,
          email: userEmail,
          user_metadata: {
            name: userName,
            nome: userName,
            phone: userPhone,
            phoneCountryCode: userPhoneCountryCode,
            source: "323-network",
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[auth-with-323-token] Erro:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro interno do servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

