import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead não encontrado', details: leadError }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar term_acceptance_id
    const { data: termAcceptance } = await supabase
      .from('term_acceptance')
      .select('id')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!termAcceptance) {
      return new Response(
        JSON.stringify({ error: 'Termo de aceite não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se o lead é brasileiro (baseado no telefone)
    const isBrazilian = lead.phone?.includes('+55') || lead.phone?.startsWith('55');
    const countryParam = isBrazilian ? '&country=BR' : '';

    // Construir URL de pagamento da segunda parcela
    const baseUrl = Deno.env.get('SITE_URL') || 'https://americandream.323network.com';
    const secondPaymentUrl = `${baseUrl}/parcela-2-2?lead_id=${lead_id}&term_acceptance_id=${termAcceptance.id}${countryParam}`;

    // Configuração SMTP
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM_EMAIL') || smtpUser;
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'American Dream';

    if (!smtpUser || !smtpPass) {
      console.error('Credenciais SMTP não configuradas');
      return new Response(
        JSON.stringify({ error: 'Credenciais SMTP não configuradas no servidor' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Primeiro nome do lead
    const firstName = lead.name?.split(' ')[0] || 'Cliente';

    // Conteúdo HTML do Email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Segundo Pagamento - American Dream</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Parabéns, ${firstName}!</h1>
              <p style="color: #93c5fd; margin: 10px 0 0; font-size: 16px;">Sua primeira reunião foi concluída com sucesso</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá ${firstName},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Foi um prazer imenso realizar sua primeira reunião estratégica! Nossa equipe já está trabalhando no desenvolvimento do seu <strong>Planejamento American Dream</strong>.
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>O Próximo Passo: Segundo Pagamento e Apresentação do Plano</strong><br>
                Agora, avançaremos para a fase mais importante: a <strong>Apresentação do seu Plano Personalizado</strong>. Nesta segunda sessão, detalharemos todas as etapas, custos e prazos para o seu projeto de vida nos EUA.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Para que possamos agendar esta sessão exclusiva de entrega do seu planejamento, é necessário confirmar sua continuidade realizando o pagamento da segunda parte do investimento.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${secondPaymentUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                      Realizar Segundo Pagamento
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Após a confirmação, entraremos em contato imediatamente para definir o melhor horário para a apresentação do seu plano.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Dúvidas? Responda este email ou entre em contato pelo WhatsApp.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">
                © ${new Date().getFullYear()} American Dream. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Enviar Email via SMTP usando Nodemailer (mais estável que smtp client nativo do Deno)
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort, // 587
      secure: smtpPort === 465, // true para 465, false para outras portas (STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false // Em alguns ambientes containerizados isso ajuda a evitar erros de handshake
      }
    });

    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFrom}>`,
      to: lead.email,
      subject: 'Próximo Passo: Segundo Pagamento e Apresentação do Plano - American Dream',
      html: htmlContent,
    });

    console.log(`Email enviado para ${lead.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email da segunda parcela enviado com sucesso (SMTP)',
        to: lead.email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
