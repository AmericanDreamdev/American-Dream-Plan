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
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { countries } from "@/data/countries";
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from "libphonenumber-js";

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
  });
};

type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
};

const LeadForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("BR");

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(createLeadFormSchema("BR")),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      phoneCountryCode: "BR", // Default phone country code
    },
  });

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
        if (insertError.code === "23505") {
          // Violação de constraint unique (email duplicado)
          form.setError("email", {
            type: "manual",
            message: "Este email já está cadastrado. Por favor, use outro endereço de email.",
          });
        } else if (insertError.code === "PGRST301" || insertError.message?.includes("JWT")) {
          setError("Ocorreu um problema de conexão. Por favor, verifique sua internet e tente novamente.");
        } else {
          setError("Não foi possível processar seus dados. Por favor, verifique as informações e tente novamente.");
        }
        setIsSubmitting(false);
        return;
      }

      // Se sucesso, redirecionar para página de aceitação de termos
      // Passaremos o lead_id via state
      if (data) {
        navigate("/accept-terms", { state: { leadId: data.id } });
      }
    } catch (err) {
      console.error("Erro ao salvar lead:", err);
      setError("Ocorreu um erro inesperado. Por favor, tente novamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Comece sua Jornada
          </h1>
          <p className="text-xl text-muted-foreground">
            Preencha seus dados para dar início ao processo de visto
          </p>
        </div>

        <div className="glass p-8 rounded-lg border border-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome completo"
                        {...field}
                        className="bg-background/50"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                        className="bg-background/50"
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
                    <FormLabel>Código do País do Telefone</FormLabel>
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
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecione o país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[400px] overflow-y-auto">
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
                      <FormLabel>
                        Telefone 
                        {selectedPhoneCountry && (
                          <span className="text-muted-foreground text-sm font-normal ml-2">
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
                          className="bg-background/50"
                          type="tel"
                          maxLength={15} // Máximo de dígitos (padrão E.164 permite até 15, mas sem código)
                        />
                      </FormControl>
                      <FormMessage />
                      {selectedPhoneCountry && (
                        <p className="text-xs text-muted-foreground">
                          Número completo: {dialCode} {displayValue || "..."}
                        </p>
                      )}
                    </FormItem>
                  );
                }}
              />

              {error && (
                <div className="p-4 bg-destructive/20 border border-destructive rounded-md">
                  <p className="text-sm font-medium text-destructive mb-1">Ops! Algo deu errado</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isSubmitting || 
                  !!form.formState.errors.name ||
                  !!form.formState.errors.email ||
                  !!form.formState.errors.phone ||
                  !!form.formState.errors.phoneCountryCode ||
                  !form.getValues("name")?.trim() ||
                  !form.getValues("email")?.trim() ||
                  !form.getValues("phone")?.trim() ||
                  !form.getValues("phoneCountryCode")
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

