import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para enviar email via SMTP com timeout
async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<boolean> {
  try {
    // Obter chave de autenticação do endpoint de email
    const emailApiKey = Deno.env.get("EMAIL_API_KEY");
    
    if (!emailApiKey) {
      console.error("EMAIL_API_KEY not configured. Please set EMAIL_API_KEY environment variable.");
      return false;
    }
    
    // Construir URL com chave de autenticação
    const emailEndpoint = `http://212.1.213.163:3000/send-smtp?key=${encodeURIComponent(emailApiKey)}`;
    
    // Obter credenciais SMTP das variáveis de ambiente
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    
    if (!smtpUser || !smtpPassword) {
      console.error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.");
      return false;
    }
    
    const emailData = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      password: smtpPassword,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ""), // Remove HTML tags para texto simples
      fromName: "American Dream",
      toName: toName,
    };

    // Criar AbortController para timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

    try {
      const response = await fetch(emailEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseText = await response.text();
      
      if (!response.ok) {
        console.warn("⚠️ Email send failed (non-critical):", {
          to: to,
          status: response.status,
          statusText: response.statusText,
          error: responseText.substring(0, 200),
          endpoint: emailEndpoint.replace(/\?key=.*/, "?key=***"), // Ocultar chave no log
        });
        return false;
      }

      // Log detalhado de sucesso
      console.log("✅ Email sent successfully:", {
        to: to,
        subject: subject,
        status: response.status,
        response: responseText.substring(0, 200), // Primeiros 200 caracteres da resposta
      });
      
      return true;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn(`⚠️ Email send timeout after 15 seconds for ${to} (non-critical - link was still generated)`);
        return false;
      }
      console.warn("⚠️ Email send error (non-critical):", {
        to: to,
        error: fetchError.message,
      });
      return false;
    }
  } catch (error: any) {
    console.warn("⚠️ Email send error (non-critical):", error.message);
    return false;
  }
}

// Função para gerar token curto e mascarado
function generateShortToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = "app-";
  let token = prefix;
  for (let i = 0; i < 9; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente para verificar autenticação do usuário
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente com service_role para bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o lead existe
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, name, email")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já existe token válido para este lead_id (sem term_acceptance_id)
    // Token pode ser usado múltiplas vezes, então não verificamos used_at
    const { data: existingToken } = await supabase
      .from("approval_tokens")
      .select("token, expires_at, used_at")
      .eq("lead_id", lead_id)
      .is("term_acceptance_id", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingToken) {
      // Construir URL completa para o email (usando a URL do Supabase como base)
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", "");
      const fullLink = `${siteUrl}/consultation-form/${existingToken.token}`;
      
      // Preparar resposta imediatamente
      const responseData = {
        success: true, 
        token: existingToken.token,
        link: `/consultation-form/${existingToken.token}`,
        message: "Existing valid token returned",
        email_sent: false // Será atualizado se o email for enviado
      };
      
      // Enviar email de forma não-bloqueante (em background)
      if (lead.email) {
        // Não usar await - enviar em background
        sendEmail(lead.email, lead.name || "Cliente", "Link de Acesso - Formulário de Consultoria American Dream", `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">American Dream</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 24px; font-weight: bold; line-height: 1.4;">
                          Olá ${lead.name || "Cliente"},
                        </h2>
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Seu link de acesso para preencher o formulário de consultoria está disponível!
                        </p>
                        <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                          <strong>Clique no botão abaixo para acessar o formulário:</strong>
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 0 0 30px;">
                              <a href="${fullLink}" 
                                 style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; min-width: 200px;">
                                Acessar Formulário de Consultoria
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                          Ou copie e cole este link no seu navegador:
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 4px; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 12px 16px;">
                              <p style="margin: 0; color: #6b7280; font-size: 14px; word-break: break-all; line-height: 1.5;">
                                ${fullLink}
                              </p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          <strong>Importante:</strong> Este link é válido por 30 dias e pode ser usado múltiplas vezes.
                        </p>
                        <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Se você não solicitou este link, por favor ignore este email.
                        </p>
                        <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 500; line-height: 1.6;">
                          Obrigado por confiar no American Dream!
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                          Este é um email automático, por favor não responda.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                          © 2025 American Dream. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `).then((emailSent) => {
          if (emailSent) {
            console.log(`✅ Email sent successfully to ${lead.email}`);
          } else {
            console.warn(`⚠️ Email could not be sent to ${lead.email} (non-critical - link was still generated)`);
          }
        }).catch((emailError: any) => {
          console.warn(`⚠️ Email send error for ${lead.email} (non-critical - link was still generated):`, emailError.message);
        });
        
        // Marcar que tentaremos enviar email
        responseData.email_sent = true;
      }
      
      // Retornar resposta imediatamente, sem esperar pelo email
      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar novo token
    let token = generateShortToken();
    let tokenExists = true;
    let attempts = 0;
    
    // Garantir que o token é único
    while (tokenExists && attempts < 10) {
      const { data: checkToken } = await supabase
        .from("approval_tokens")
        .select("token")
        .eq("token", token)
        .maybeSingle();
      
      if (!checkToken) {
        tokenExists = false;
      } else {
        token = generateShortToken();
        attempts++;
      }
    }

    if (tokenExists) {
      return new Response(
        JSON.stringify({ error: "Failed to generate unique token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar token com expiração de 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: newToken, error: tokenError } = await supabase
      .from("approval_tokens")
      .insert({
        token,
        lead_id,
        term_acceptance_id: null, // Permitir null para links gerados manualmente
        payment_id: null,
        payment_proof_id: null,
        expires_at: expiresAt.toISOString(),
        used_at: null,
      })
      .select("token")
      .single();

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      return new Response(
        JSON.stringify({ error: tokenError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construir path relativo do link (o frontend construirá a URL completa)
    const consultationLink = `/consultation-form/${newToken.token}`;
    
    // Construir URL completa para o email (usando a URL do Supabase como base)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", "");
    const fullLink = `${siteUrl}${consultationLink}`;

    // Preparar resposta imediatamente (não esperar pelo email)
    const responseData = {
      success: true, 
      token: newToken.token,
      link: consultationLink,
      expires_at: expiresAt.toISOString(),
      email_sent: false // Será atualizado se o email for enviado
    };

    // Enviar email de forma não-bloqueante (em background)
    if (lead.email) {
      // Não usar await - enviar em background
      sendEmail(lead.email, lead.name || "Cliente", "Link de Acesso - Formulário de Consultoria American Dream", `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">American Dream</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 24px; font-weight: bold; line-height: 1.4;">
                        Olá ${lead.name || "Cliente"},
                      </h2>
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Seu link de acesso para preencher o formulário de consultoria foi gerado com sucesso!
                      </p>
                      <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                        <strong>Clique no botão abaixo para acessar o formulário:</strong>
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 0 0 30px;">
                            <a href="${fullLink}" 
                               style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; min-width: 200px;">
                              Acessar Formulário de Consultoria
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 4px; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 12px 16px;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; word-break: break-all; line-height: 1.5;">
                              ${fullLink}
                            </p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <strong>Importante:</strong> Este link é válido por 30 dias e pode ser usado múltiplas vezes.
                      </p>
                      <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou este link, por favor ignore este email.
                      </p>
                      <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 500; line-height: 1.6;">
                        Obrigado por confiar no American Dream!
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                        Este é um email automático, por favor não responda.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                        © 2025 American Dream. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `).then((emailSent) => {
        if (emailSent) {
          console.log(`✅ Email sent successfully to ${lead.email}`);
        } else {
          console.warn(`⚠️ Email could not be sent to ${lead.email} (non-critical - link was still generated)`);
        }
      }).catch((emailError: any) => {
        console.warn(`⚠️ Email send error for ${lead.email} (non-critical - link was still generated):`, emailError.message);
      });
      
      // Marcar que tentaremos enviar email (mesmo que ainda não tenha sido enviado)
      responseData.email_sent = true;
    }

    // Retornar resposta imediatamente, sem esperar pelo email
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-consultation-link-for-lead function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

