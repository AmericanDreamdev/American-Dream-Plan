import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { countries } from "@/data/countries";
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from "libphonenumber-js";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";

interface Term {
  id: string;
  title: string;
  content: string;
  term_type: string;
}

// Schema de validação dinâmico baseado no país
const createLeadFormSchema = (phoneCountryCode: string) => {
  return z.object({
    name: z.string()
      .min(2, "Por favor, digite seu nome completo")
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras"),
    email: z.string()
      .email("Por favor, digite um email válido")
      .toLowerCase()
      .trim(),
    phone: z.string()
      .min(1, "Por favor, digite seu número de telefone")
      .refine(
        (phone) => {
          if (!phone || !phoneCountryCode) return false;
          const selectedCountry = countries.find((c) => c.code === phoneCountryCode);
          if (!selectedCountry) return false;
          
          // Remover não-dígitos
          const cleanPhone = phone.replace(/\D/g, "");
          
          // Validação básica de comprimento
          if (cleanPhone.length < 6) return false; // Mínimo razoável
          if (cleanPhone.length > 15) return false; // Máximo E.164
          
          // Montar número completo
          const fullNumber = `${selectedCountry.dialCode}${cleanPhone}`;
          
          // Validar com libphonenumber-js
          try {
            return isValidPhoneNumber(fullNumber, selectedCountry.code as any);
          } catch {
            // Fallback: validação básica por comprimento
            return cleanPhone.length >= 6 && cleanPhone.length <= 15;
          }
        },
        {
          message: "Número de telefone inválido. Verifique se está correto",
        }
      ),
    phoneCountryCode: z.string().min(1, "Por favor, selecione o país do seu telefone"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "Você precisa aceitar os termos e condições para continuar",
    }),
  });
};

type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  termsAccepted: boolean;
};

const LeadForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("BR");
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const { recordTermAcceptance } = useTermsAcceptance();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(createLeadFormSchema("BR")),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      phoneCountryCode: "BR", // Default phone country code
      termsAccepted: false,
    },
  });

  // Carregar termos na montagem do componente (necessário para validar e registrar aceitação)
  useEffect(() => {
    const loadActiveTerm = async () => {
      setLoadingTerms(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("application_terms")
          .select("*")
          .eq("term_type", "lead_contract")
          .eq("is_active", true)
          .order("version", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setActiveTerm(data);
        } else {
          console.warn("Nenhum termo ativo encontrado.");
        }
      } catch (err: any) {
        console.error("Error loading term:", err);
        // Não mostrar erro aqui para não bloquear o formulário
        // O erro será mostrado apenas se tentar submeter sem termos
      } finally {
        setLoadingTerms(false);
      }
    };

    loadActiveTerm();
  }, []);

  // Atualizar resolver quando país muda
  useEffect(() => {
    form.clearErrors("phone");
    // Re-validar telefone se tiver valor quando país muda
    if (form.getValues("phone")) {
      form.trigger("phone");
    }
  }, [phoneCountryCode, form]);

  const onSubmit = async (values: LeadFormValues) => {
    // Validar formulário antes de submeter
    const isValid = await form.trigger();
    if (!isValid) {
      setError("Por favor, corrija os erros no formulário antes de continuar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Código do país do telefone
      const selectedPhoneCountry = countries.find((c) => c.code === values.phoneCountryCode);
      const phoneCountryCode = selectedPhoneCountry?.dialCode || "+55";
      
      // Remover qualquer código que já exista e garantir formato correto
      const cleanPhone = values.phone.replace(/\D/g, ""); // Remove não-dígitos
      const fullPhone = `${phoneCountryCode}${cleanPhone}`;
      
      // Validar número antes de salvar
      try {
        if (!isValidPhoneNumber(fullPhone, selectedPhoneCountry?.code as any)) {
          form.setError("phone", {
            type: "manual",
            message: "Por favor, verifique se o número de telefone está correto",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (validationError) {
        form.setError("phone", {
          type: "manual",
          message: "Por favor, verifique se o número de telefone está correto",
        });
        setIsSubmitting(false);
        return;
      }

      // Formatar número usando libphonenumber para garantir formato correto
      let formattedPhone = fullPhone;
      try {
        const parsed = parsePhoneNumber(fullPhone, selectedPhoneCountry?.code as any);
        if (parsed.isValid()) {
          formattedPhone = parsed.formatInternational(); // Formato: +55 11 98765-4321
        }
      } catch (formatError) {
        // Se não conseguir formatar, usar o número limpo
        formattedPhone = `${phoneCountryCode}${cleanPhone}`;
      }

      // Inserir lead no Supabase
      const { data, error: insertError } = await supabase
        .from("leads")
        .insert({
          name: values.name,
          email: values.email,
          phone: formattedPhone,
          country_code: phoneCountryCode, // Código do país do telefone
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erro ao inserir lead:", insertError);
        if (insertError.code === "PGRST301" || insertError.message?.includes("JWT")) {
          setError("Ocorreu um problema de conexão. Por favor, verifique sua internet e tente novamente.");
        } else {
          setError("Não foi possível processar seus dados. Por favor, verifique as informações e tente novamente.");
        }
        setIsSubmitting(false);
        return;
      }

      // Verificar se os termos foram aceitos e se estão disponíveis
      if (!values.termsAccepted) {
        setError("Por favor, aceite os termos e condições para continuar.");
        setIsSubmitting(false);
        return;
      }

      if (!activeTerm) {
        setError("Termos não disponíveis. Por favor, recarregue a página e tente novamente.");
        setIsSubmitting(false);
        return;
      }

      // Detectar país do usuário por IP antes de redirecionar
      let userCountry = "US"; // Padrão: EUA
      try {
        const ipResponse = await fetch("https://ipapi.co/json/");
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          userCountry = ipData.country_code || "US"; // BR para Brasil, US para outros
          console.log("User country detected:", userCountry);
        }
      } catch (ipError) {
        console.warn("Could not detect user country by IP:", ipError);
        // Usar padrão (US) se falhar
      }

      // Registrar aceitação de termos e gerar PDF antes de redirecionar
      try {
        const acceptanceId = await recordTermAcceptance(
          data.id,
          activeTerm.id,
          "lead_contract"
        );

        if (acceptanceId) {
          // Gerar PDF no momento (aguardar a geração)
          try {
            const { error: pdfError } = await supabase.functions.invoke("generate-contract-pdf", {
              body: {
                lead_id: data.id,
                term_acceptance_id: acceptanceId,
              },
            });

            if (pdfError) {
              console.error("Error generating PDF:", pdfError);
              // Continuar mesmo se falhar a geração do PDF
              // O PDF pode ser gerado depois se necessário
            }
          } catch (pdfErr) {
            console.error("Error calling PDF generation:", pdfErr);
            // Continuar mesmo se falhar
          }

          // Redirecionar para página de opções de pagamento com país detectado
          navigate(`/payment-options?lead_id=${data.id}&term_acceptance_id=${acceptanceId}&country=${userCountry}`);
        } else {
          setError("Erro ao registrar aceitação dos termos. Tente novamente.");
          setIsSubmitting(false);
        }
      } catch (termsError) {
        console.error("Error accepting terms:", termsError);
        setError("Erro ao processar aceitação dos termos. Tente novamente.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Erro ao salvar lead:", err);
      setError("Ocorreu um erro inesperado. Por favor, tente novamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0575E6] to-[#021B79] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Comece sua Jornada
          </h1>
          <p className="text-xl text-white/80">
            Preencha seus dados para dar início ao processo de visto
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 md:p-10 shadow-2xl border border-white/20">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome completo"
                        {...field}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#0575E6] focus:ring-[#0575E6]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#0575E6] focus:ring-[#0575E6]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Código do País do Telefone</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setPhoneCountryCode(value);
                        // Recriar schema com novo país para validação
                        const newSchema = createLeadFormSchema(value);
                        // Re-validar telefone com novo país
                        form.clearErrors("phone");
                        form.trigger("phone");
                        
                        const selectedCountry = countries.find((c) => c.code === value);
                        if (selectedCountry) {
                          const currentPhone = form.getValues("phone") || "";
                          const phoneNumber = currentPhone.replace(/^\+\d+\s*/, "");
                          form.setValue("phone", phoneNumber, { shouldValidate: true });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 focus:border-[#0575E6] focus:ring-[#0575E6]">
                          <SelectValue placeholder="Selecione o país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[400px] overflow-y-auto bg-white border-gray-200 text-gray-900">
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="font-medium">{country.dialCode}</span>{" "}
                            <span>{country.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => {
                  const currentCountryCode = form.watch("phoneCountryCode") || "BR";
                  const selectedPhoneCountry = countries.find((c) => c.code === currentCountryCode);
                  const dialCode = selectedPhoneCountry?.dialCode || "+55";
                  
                  // Remover código do país para exibição
                  const displayValue = field.value ? field.value.replace(/^\+\d+\s*/, "") : "";
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Telefone 
                        {selectedPhoneCountry && (
                          <span className="text-gray-500 text-sm font-normal ml-2">
                            ({selectedPhoneCountry.dialCode})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={selectedPhoneCountry?.code === "BR" 
                            ? "Ex: 11 98765-4321" 
                            : "Digite o número sem código do país"}
                          value={displayValue}
                          onChange={(e) => {
                            const phoneValue = e.target.value.replace(/\D/g, ""); // Remove não-dígitos
                            // Não incluir código do país no valor do campo, apenas número
                            form.setValue("phone", phoneValue, { shouldValidate: true });
                            // Validar em tempo real após um pequeno delay
                            setTimeout(() => {
                              form.trigger("phone");
                            }, 300);
                          }}
                          onBlur={(e) => {
                            field.onBlur();
                            // Forçar validação completa ao sair do campo
                            form.trigger("phone");
                          }}
                          className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#0575E6] focus:ring-[#0575E6]"
                          type="tel"
                          maxLength={15} // Máximo de dígitos (padrão E.164 permite até 15, mas sem código)
                        />
                      </FormControl>
                      <FormMessage />
                      {selectedPhoneCountry && (
                        <p className="text-xs text-gray-500">
                          Número completo: {dialCode} {displayValue || "..."}
                        </p>
                      )}
                    </FormItem>
                  );
                }}
              />

              {/* Checkbox de aceitação de termos */}
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-gray-700 cursor-pointer">
                        Li e concordo com os{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/terms", { state: { returnTo: "/lead-form" } });
                          }}
                          className="text-[#0575E6] hover:text-[#021B79] underline font-medium"
                        >
                          termos e condições
                        </button>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800 mb-1">Ops! Algo deu errado</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isSubmitting || 
                  !!form.formState.errors.name ||
                  !!form.formState.errors.email ||
                  !!form.formState.errors.phone ||
                  !!form.formState.errors.phoneCountryCode ||
                  !!form.formState.errors.termsAccepted ||
                  !form.getValues("name")?.trim() ||
                  !form.getValues("email")?.trim() ||
                  !form.getValues("phone")?.trim() ||
                  !form.getValues("phoneCountryCode") ||
                  !form.getValues("termsAccepted")
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;

