import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { recordTermAcceptance } = useTermsAcceptance();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token");
        const email = searchParams.get("email");
        const name = searchParams.get("name");
        const phone = searchParams.get("phone");
        const phoneCountryCode = searchParams.get("phoneCountryCode");
        const country = searchParams.get("country") || "US";

        if (!token) {
          console.error("Token não encontrado na URL");
          setError("Token de autenticação não encontrado");
          setTimeout(() => {
            navigate("/lead-form");
          }, 2000);
          return;
        }

        // 1. Autenticar usuário com o token
        // O token deve ser um access_token válido do Supabase
        // Primeiro, verificamos se o token é válido usando getUser
        let authenticatedUser;
        
        try {
          // Verificar se o token é válido tentando obter o usuário
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          
          if (userError || !user) {
            throw new Error("Token inválido ou expirado");
          }
          
          authenticatedUser = user;
          
          // Tentar criar uma sessão com o token
          // Nota: setSession pode precisar de refresh_token também
          // Se a 323 Network passar apenas access_token, tentamos usar o mesmo valor para ambos
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token, // Usar o mesmo token como fallback
          });

          if (sessionError) {
            console.warn("Aviso: Não foi possível criar sessão completa, mas o token é válido:", sessionError);
            // Continuar mesmo assim, pois o token é válido e podemos usar getUser
          }
        } catch (authError: any) {
          console.error("Erro na autenticação:", authError);
          setError("Falha ao autenticar. Por favor, tente novamente.");
          setTimeout(() => {
            navigate("/lead-form");
          }, 3000);
          return;
        }

        if (!authenticatedUser) {
          throw new Error("Não foi possível autenticar o usuário");
        }

        // 2. Buscar lead existente pelo email
        const userEmail = email || authenticatedUser.email;
        if (!userEmail) {
          throw new Error("Email não encontrado");
        }

        const { data: existingLead, error: leadError } = await supabase
          .from("leads")
          .select("id, user_id, email, name, phone")
          .eq("email", userEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let leadId: string | null = null;
        let termAcceptanceId: string | null = null;

        // 3. Se lead não existe, criar novo vinculado ao user_id
        if (!existingLead || leadError) {
          console.log("Lead não encontrado, criando novo...");
          
          // Obter dados do usuário (prioridade: parâmetros URL > user_metadata > email)
          const leadName = name || authenticatedUser.user_metadata?.name || authenticatedUser.user_metadata?.nome || userEmail.split("@")[0];
          const leadPhone = phone || authenticatedUser.user_metadata?.phone || "";
          const leadCountryCode = phoneCountryCode || authenticatedUser.user_metadata?.phoneCountryCode || null;

          const { data: newLead, error: createError } = await supabase
            .from("leads")
            .insert({
              name: leadName,
              email: userEmail,
              phone: leadPhone,
              country_code: leadCountryCode,
              user_id: authenticatedUser.id, // Vincular ao user_id
              status_geral: "novo",
            })
            .select()
            .single();

          if (createError) {
            console.error("Erro ao criar lead:", createError);
            // Continuar mesmo assim, mas logar o erro
          } else {
            leadId = newLead.id;
            console.log("Lead criado com sucesso:", leadId);
          }
        } else {
          leadId = existingLead.id;
          
          // 4. Se lead existe mas não tem user_id, vincular ao usuário autenticado
          if (existingLead && !existingLead.user_id) {
            console.log("Vinculando lead existente ao user_id...");
            const { error: updateError } = await supabase
              .from("leads")
              .update({ user_id: authenticatedUser.id })
              .eq("id", existingLead.id);

            if (updateError) {
              console.error("Erro ao vincular lead:", updateError);
              // Continuar mesmo assim
            } else {
              console.log("Lead vinculado com sucesso");
            }
          }
        }

        if (!leadId) {
          throw new Error("Não foi possível criar ou encontrar lead");
        }

        // 5. Buscar termo ativo
        const { data: activeTerm, error: termError } = await supabase
          .from("application_terms")
          .select("*")
          .eq("term_type", "lead_contract")
          .eq("is_active", true)
          .order("version", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (termError) {
          console.error("Erro ao buscar termo:", termError);
        }

        // 6. Criar term_acceptance se termo ativo existe
        if (activeTerm) {
          console.log("Criando term_acceptance...");
          const acceptanceId = await recordTermAcceptance(
            leadId,
            activeTerm.id,
            "lead_contract"
          );

          if (acceptanceId) {
            termAcceptanceId = acceptanceId;
            console.log("Term acceptance criado:", acceptanceId);

            // 7. Chamar geração de PDF em background (não aguardar)
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseAnonKey) {
              const functionUrl = `${supabaseUrl}/functions/v1/generate-contract-pdf`;

              // Obter token da sessão atual ou usar o token recebido
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              const authToken = currentSession?.access_token || token;

              fetch(functionUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": supabaseAnonKey,
                  "Authorization": `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  lead_id: leadId,
                  term_acceptance_id: acceptanceId,
                }),
                keepalive: true,
              })
                .then(async (response) => {
                  try {
                    const result = await response.json();
                    console.log("[AuthCallback] PDF generation completed:", result);
                  } catch (e) {
                    console.error("[AuthCallback] Error parsing PDF response:", e);
                  }
                })
                .catch((pdfErr: any) => {
                  console.error("[AuthCallback] Error calling PDF generation:", pdfErr);
                });
            }
          } else {
            console.warn("Variáveis de ambiente do Supabase não configuradas");
          }
        } else {
          console.warn("Nenhum termo ativo encontrado. Continuando sem criar term_acceptance.");
        }

        // 8. Redirecionar para /payment-options
        const paymentUrl = new URL("/payment-options", window.location.origin);
        if (leadId) paymentUrl.searchParams.set("lead_id", leadId);
        if (termAcceptanceId) paymentUrl.searchParams.set("term_acceptance_id", termAcceptanceId);
        paymentUrl.searchParams.set("country", country);

        console.log("Redirecionando para:", paymentUrl.toString());
        navigate(paymentUrl.pathname + paymentUrl.search);
      } catch (err: any) {
        console.error("Erro no callback:", err);
        setError(err.message || "Ocorreu um erro inesperado");
        setLoading(false);
        
        // Redirecionar para lead-form após 3 segundos
        setTimeout(() => {
          navigate("/lead-form");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, recordTermAcceptance]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro na Autenticação</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecionando para o formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#0575E6] mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Processando Autenticação...</h1>
        <p className="text-gray-600">Por favor, aguarde enquanto configuramos sua sessão.</p>
      </div>
    </div>
  );
}
