import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import { extractUserFrom323Token } from "@/lib/jwt";

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

        // 1. Autenticar usuário com o token do 323 Network
        // O token é do projeto do 323 Network, então precisamos:
        // - Decodificar o token para obter os dados do usuário
        // - Criar/login do usuário no projeto do American Dream
        // - Criar uma sessão no projeto do American Dream
        let authenticatedUser;
        
        try {
          console.log("[AuthCallback] Processando token do 323 Network...");
          
          // Decodificar o token para obter os dados do usuário
          const tokenData = extractUserFrom323Token(token);
          if (!tokenData || !tokenData.email) {
            throw new Error("Não foi possível decodificar o token ou email não encontrado");
          }

          console.log("[AuthCallback] Dados do usuário extraídos do token:", tokenData);

          // Usar email dos parâmetros da URL ou do token (prioridade para URL)
          const userEmail = email || tokenData.email;
          const userName = name || tokenData.name || userEmail.split("@")[0];
          const userPhone = phone || tokenData.phone || "";
          const userPhoneCountryCode = phoneCountryCode || tokenData.phoneCountryCode || null;

          if (!userEmail) {
            throw new Error("Email não encontrado no token ou nos parâmetros");
          }

          // Chamar Edge Function para autenticar com token do 323 Network
          // A Edge Function vai validar o token e criar/login do usuário no projeto do American Dream
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Configuração do Supabase não encontrada");
          }

          console.log("[AuthCallback] Chamando Edge Function para autenticar...");
          
          const functionUrl = `${supabaseUrl}/functions/v1/auth-with-323-token`;
          const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              token,
              email: userEmail,
              name: userName,
              phone: userPhone,
              phoneCountryCode: userPhoneCountryCode,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
            throw new Error(errorData.error || `Erro ao autenticar: ${response.statusText}`);
          }

          const responseData = await response.json();
          const { access_token, refresh_token, magic_token, user: userData } = responseData;

          if (!userData) {
            throw new Error("Dados do usuário não retornados pela Edge Function");
          }

          console.log("[AuthCallback] Dados recebidos da Edge Function:", userData);
          console.log("[AuthCallback] Tentando criar sessão com o token retornado...");

          // A Edge Function retornou um magic_token
          // Vamos tentar usar verifyOtp para verificar o token
          if (magic_token) {
            console.log("[AuthCallback] Usando verifyOtp com o magic token...");
            
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: magic_token,
              type: "magiclink",
            });

            if (verifyError) {
              console.error("[AuthCallback] Erro ao verificar magic token:", verifyError);
              // Se falhar, tentar setSession como fallback
              console.log("[AuthCallback] Tentando setSession como fallback...");
              
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: access_token || magic_token,
                refresh_token: refresh_token || magic_token,
              });

              if (sessionError) {
                throw new Error(`Erro ao criar sessão: ${sessionError.message}`);
              }

              if (!sessionData?.session?.user) {
                throw new Error("Sessão não criada após setSession");
              }

              authenticatedUser = sessionData.session.user;
              console.log("[AuthCallback] Sessão criada com setSession:", authenticatedUser.id);
            } else {
              authenticatedUser = verifyData.user;
              console.log("[AuthCallback] Usuário autenticado via verifyOtp:", authenticatedUser.id);
            }
          } else if (access_token) {
            // Se não tiver magic_token, tentar setSession direto
            console.log("[AuthCallback] Usando setSession com access_token...");
            
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token || access_token,
            });

            if (sessionError) {
              throw new Error(`Erro ao criar sessão: ${sessionError.message}`);
            }

            if (!sessionData?.session?.user) {
              throw new Error("Sessão não criada");
            }

            authenticatedUser = sessionData.session.user;
            console.log("[AuthCallback] Usuário autenticado via setSession:", authenticatedUser.id);
          } else {
            throw new Error("Nenhum token retornado pela Edge Function");
          }

          // Atualizar metadata do usuário se necessário
          if (userName || userPhone) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                name: userName || authenticatedUser.user_metadata?.name,
                nome: userName || authenticatedUser.user_metadata?.nome,
                phone: userPhone || authenticatedUser.user_metadata?.phone,
                phoneCountryCode: userPhoneCountryCode || authenticatedUser.user_metadata?.phoneCountryCode,
              },
            });
            if (updateError) {
              console.warn("[AuthCallback] Aviso ao atualizar metadata:", updateError);
            }
          }

        } catch (authError: any) {
          console.error("[AuthCallback] Erro na autenticação:", authError);
          setError(`Falha ao autenticar: ${authError.message || "Por favor, tente novamente."}`);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Preparando tudo para você</h1>
        <p className="text-gray-600">Estamos configurando seu ambiente. Isso levará apenas alguns instantes.</p>
      </div>
    </div>
  );
}
