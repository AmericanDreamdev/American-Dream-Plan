import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { ConsultationFormData, Dependente } from "@/types/consultation";
import { CalendlyEmbed } from "@/components/consultation/CalendlyEmbed";
import { toast } from "sonner";

// Schema de validação
const consultationFormSchema = z.object({
  // DADOS PESSOAIS
  nome_completo: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  cidade_residencia: z.string().min(1, "Cidade e país de residência é obrigatório"),
  estado_civil: z.string().min(1, "Estado civil é obrigatório"),
  possui_filhos: z.boolean().optional(),
  dependentes: z.array(z.object({
    nome: z.string(),
    idade: z.string(),
    grau_parentesco: z.string(),
  })).optional(),
  
  // OBJETIVO PRINCIPAL
  objetivo_principal: z.string().min(1, "Objetivo principal é obrigatório"),
  objetivo_outro: z.string(),
  tipo_visto_desejado: z.string().min(1, "Tipo de visto desejado é obrigatório"),
  periodo_estimado: z.string().min(1, "Período estimado é obrigatório"),
  pretende_ir_sozinho: z.boolean().optional(),
  pretende_ir_com: z.string(),
  
  // PERFIL PROFISSIONAL
  formacao_academica: z.string().min(1, "Formação acadêmica é obrigatória"),
  area_formacao_atuacao: z.string().min(1, "Área de formação/atuação é obrigatória"),
  cargo_atual: z.string().min(1, "Cargo atual é obrigatório"),
  tempo_cargo_atual: z.string().optional(), // Campo não existe no formulário, tempo está incluído em cargo_atual
  nivel_ingles: z.string().min(1, "Nível de inglês é obrigatório"),
  
  // SITUAÇÃO FINANCEIRA
  renda_mensal: z.string().min(1, "Renda mensal é obrigatória"),
  possui_bens: z.boolean().optional(),
  descricao_bens: z.string(),
  possui_empresa_cnpj: z.boolean().optional(),
  ramo_faturamento_empresa: z.string(),
  investimento_disposto: z.string().min(1, "Investimento disposto é obrigatório"),
  fundos_comprovaveis: z.string().min(1, "Fundos comprováveis é obrigatório"),
  interesse_dolarizar: z.string().min(1, "Interesse em dolarizar é obrigatório"),
  
  // HISTÓRICO MIGRATÓRIO
  ja_teve_visto_eua: z.boolean().optional(),
  tipo_visto_anterior: z.string(),
  data_visto_anterior: z.string(),
  ja_teve_visto_negado: z.boolean().optional(),
  motivo_visto_negado: z.string(),
  ja_viajou_eua: z.boolean().optional(),
  detalhes_viagem_eua: z.string(),
  ja_ficou_ilegal_eua: z.boolean().optional(),
  possui_parentes_eua: z.boolean().optional(),
  detalhes_parentes_eua: z.string(),
  
  // INTERESSES EDUCACIONAIS
  interesse_educacional: z.string().min(1, "Interesse educacional é obrigatório"),
  interesse_educacional_outro: z.string(),
  possui_instituicao_mente: z.boolean().optional(),
  nome_instituicao: z.string(),
  modalidade_curso: z.string().min(1, "Modalidade de curso é obrigatória"),
  busca_bolsa_financiamento: z.string().min(1, "Busca de bolsa/financiamento é obrigatória"),
  
  // NETWORK
  conhece_palestrante: z.boolean().optional(),
  detalhes_palestrante: z.string(),
  interesse_participar_eventos: z.string().min(1, "Interesse em participar de eventos é obrigatório"),
  
  // EXPECTATIVAS
  expectativas: z.array(z.string()).min(1),
  expectativas_outro: z.string(),
  como_conheceu: z.string().min(1),
  como_conheceu_outro: z.string(),
  
  // DECLARAÇÃO
  assinatura_digital: z.string().min(1),
}).refine((data) => {
  // Se possui filhos, deve ter pelo menos um dependente completo (não vazio)
  if (data.possui_filhos === true) {
    // Filtrar dependentes vazios (sem nome, idade ou grau_parentesco)
    const dependentesValidos = (data.dependentes || []).filter(
      (dep) => dep.nome && dep.nome.trim() !== "" && 
               dep.idade && dep.idade.trim() !== "" && 
               dep.grau_parentesco && dep.grau_parentesco.trim() !== ""
    );
    
    if (dependentesValidos.length === 0) {
      return false;
    }
  }
  // Se não possui filhos, não precisa validar dependentes
  return true;
}, {
  message: "Se possui filhos, adicione pelo menos um dependente com nome, idade e grau de parentesco preenchidos",
  path: ["dependentes"],
}).refine((data) => {
  // Se não pretende ir sozinho, pretende_ir_com é obrigatório
  if (data.pretende_ir_sozinho === false && (!data.pretende_ir_com || data.pretende_ir_com.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se não pretende ir sozinho, informe com quem pretende ir",
  path: ["pretende_ir_com"],
}).refine((data) => {
  // Se objetivo é "outro", objetivo_outro é obrigatório
  if (data.objetivo_principal === "outro" && (!data.objetivo_outro || data.objetivo_outro.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Especifique o objetivo",
  path: ["objetivo_outro"],
}).refine((data) => {
  // Se possui bens, descricao_bens é obrigatório
  if (data.possui_bens === true && (!data.descricao_bens || data.descricao_bens.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se possui bens, descreva brevemente",
  path: ["descricao_bens"],
}).refine((data) => {
  // Se possui empresa, ramo_faturamento_empresa é obrigatório
  if (data.possui_empresa_cnpj === true && (!data.ramo_faturamento_empresa || data.ramo_faturamento_empresa.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se possui empresa, informe o ramo de atuação e faturamento",
  path: ["ramo_faturamento_empresa"],
}).refine((data) => {
  // Se já teve visto, tipo_visto_anterior é obrigatório
  if (data.ja_teve_visto_eua === true && (!data.tipo_visto_anterior || data.tipo_visto_anterior.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se já teve visto, informe o tipo e quando foi emitido",
  path: ["tipo_visto_anterior"],
}).refine((data) => {
  // Se teve visto negado, motivo_visto_negado é obrigatório
  if (data.ja_teve_visto_negado === true && (!data.motivo_visto_negado || data.motivo_visto_negado.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se teve visto negado, descreva o motivo",
  path: ["motivo_visto_negado"],
}).refine((data) => {
  // Se já viajou, detalhes_viagem_eua é obrigatório
  if (data.ja_viajou_eua === true && (!data.detalhes_viagem_eua || data.detalhes_viagem_eua.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se já viajou, informe quando e por quanto tempo ficou",
  path: ["detalhes_viagem_eua"],
}).refine((data) => {
  // Se possui parentes, detalhes_parentes_eua é obrigatório
  if (data.possui_parentes_eua === true && (!data.detalhes_parentes_eua || data.detalhes_parentes_eua.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se possui parentes, informe os detalhes",
  path: ["detalhes_parentes_eua"],
}).refine((data) => {
  // Se possui instituição em mente, nome_instituicao é obrigatório
  if (data.possui_instituicao_mente === true && (!data.nome_instituicao || data.nome_instituicao.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se possui instituição em mente, informe o nome",
  path: ["nome_instituicao"],
}).refine((data) => {
  // Se conhece palestrante, detalhes_palestrante é obrigatório
  if (data.conhece_palestrante === true && (!data.detalhes_palestrante || data.detalhes_palestrante.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Se conhece palestrante, informe nome e área de atuação",
  path: ["detalhes_palestrante"],
}).refine((data) => {
  // Se interesse educacional é "outro", interesse_educacional_outro é obrigatório
  if (data.interesse_educacional === "outro" && (!data.interesse_educacional_outro || data.interesse_educacional_outro.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Especifique o interesse educacional",
  path: ["interesse_educacional_outro"],
}).refine((data) => {
  // Se como_conheceu é "outro", como_conheceu_outro é obrigatório
  if (data.como_conheceu === "outro" && (!data.como_conheceu_outro || data.como_conheceu_outro.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Especifique como conheceu",
  path: ["como_conheceu_outro"],
}).refine((data) => {
  // Se expectativas inclui "outro", expectativas_outro é obrigatório
  if (data.expectativas?.includes("outro") && (!data.expectativas_outro || data.expectativas_outro.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Descreva sua expectativa",
  path: ["expectativas_outro"],
});

type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

const ConsultationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
  // Total de seções do formulário
  const totalSteps = 8;

  // Componente de mensagem condicional que só mostra erros quando hasAttemptedSubmit for true
  // Precisa estar dentro do componente para ter acesso ao contexto do FormField
  const ConditionalFormMessage = ({ hasAttemptedSubmit: attempted }: { hasAttemptedSubmit: boolean }) => {
    const { error, formMessageId } = useFormField();
    
    // Só mostrar erro se o usuário tentou submeter E há um erro
    // Verificar explicitamente se attempted é true (não apenas truthy)
    // E garantir que o erro realmente existe e não é apenas um estado inicial
    if (attempted !== true || !error || !error.message) {
      return null;
    }

    return (
      <p id={formMessageId} className="text-sm font-medium text-destructive">
        {String(error?.message)}
      </p>
    );
  };

  // Verificar se está acessando via token
  const token = params.token;
  const leadId = searchParams.get("lead_id");
  const paymentId = searchParams.get("payment_id");
  const sessionId = searchParams.get("session_id");

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    mode: "onSubmit", // Só validar quando o usuário tentar submeter
    reValidateMode: "onSubmit", // Revalidar apenas no submit
    shouldFocusError: false, // Não focar automaticamente em erros
    criteriaMode: "all", // Mostrar todos os erros, não apenas o primeiro
    shouldUnregister: false, // Manter campos registrados mesmo quando não renderizados
    shouldUseNativeValidation: false, // Não usar validação nativa do HTML5
    // Garantir que não haja validação automática ao montar
    delayError: 0, // Não atrasar exibição de erros (mas só mostrar quando hasAttemptedSubmit for true)
    defaultValues: {
      // DADOS PESSOAIS
      nome_completo: "",
      email: "",
      telefone: "",
      data_nascimento: "",
      cidade_residencia: "",
      estado_civil: "",
      possui_filhos: undefined,
      dependentes: [],
      
      // OBJETIVO PRINCIPAL
      objetivo_principal: "",
      objetivo_outro: "",
      tipo_visto_desejado: "",
      periodo_estimado: "",
      pretende_ir_sozinho: undefined,
      pretende_ir_com: "",
      
      // PERFIL PROFISSIONAL
      formacao_academica: "",
      area_formacao_atuacao: "",
      cargo_atual: "",
      tempo_cargo_atual: "",
      nivel_ingles: "",
      
      // SITUAÇÃO FINANCEIRA
      renda_mensal: "",
      possui_bens: undefined,
      descricao_bens: "",
      possui_empresa_cnpj: undefined,
      ramo_faturamento_empresa: "",
      investimento_disposto: "",
      fundos_comprovaveis: "",
      interesse_dolarizar: "",
      
      // HISTÓRICO MIGRATÓRIO
      ja_teve_visto_eua: undefined,
      tipo_visto_anterior: "",
      data_visto_anterior: "",
      ja_teve_visto_negado: undefined,
      motivo_visto_negado: "",
      ja_viajou_eua: undefined,
      detalhes_viagem_eua: "",
      ja_ficou_ilegal_eua: undefined,
      possui_parentes_eua: undefined,
      detalhes_parentes_eua: "",
      
      // INTERESSES EDUCACIONAIS
      interesse_educacional: "",
      interesse_educacional_outro: "",
      possui_instituicao_mente: undefined,
      nome_instituicao: "",
      modalidade_curso: "",
      busca_bolsa_financiamento: "",
      
      // NETWORK
      conhece_palestrante: undefined,
      detalhes_palestrante: "",
      interesse_participar_eventos: "",
      
      // EXPECTATIVAS
      expectativas: [],
      expectativas_outro: "",
      como_conheceu: "",
      como_conheceu_outro: "",
      
      // DECLARAÇÃO
      assinatura_digital: "",
    },
  });

  // Adicionar classe ao body para remover efeitos azuis
  useEffect(() => {
    document.body.classList.add('consultation-form-page');
    return () => {
      document.body.classList.remove('consultation-form-page');
    };
  }, []);

  // Chave única para salvar dados no localStorage
  const storageKey = leadId ? `consultation_form_${leadId}` : null;
  const currentStepKey = leadId ? `consultation_form_step_${leadId}` : null;

  // Carregar dados salvos e seção ao montar o componente
  useEffect(() => {
    if (storageKey) {
      try {
        const savedData = localStorage.getItem(storageKey);
        const savedStep = localStorage.getItem(currentStepKey || '');
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Restaurar dados do formulário sem disparar validação
          Object.keys(parsedData).forEach((key) => {
            const value = parsedData[key];
            // Restaurar undefined
            if (value === "__undefined__") {
              form.setValue(key as any, undefined, { shouldValidate: false });
            } else {
              form.setValue(key as any, value, { shouldValidate: false });
            }
          });
          // Limpar erros após restaurar dados e garantir que hasAttemptedSubmit seja false
          // Resetar o estado do formulário para garantir que não haja erros sendo exibidos
          setTimeout(() => {
            const restoredValues = form.getValues();
            form.reset(restoredValues, {
              keepErrors: false,
              keepDirty: true, // Manter dirty para não perder dados
              keepIsSubmitted: false,
              keepTouched: false,
              keepIsValid: false,
              keepSubmitCount: false,
            });
            form.clearErrors();
            setHasAttemptedSubmit(false);
            setError(null);
          }, 200);
        }
        
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          if (step >= 1 && step <= totalSteps) {
            setCurrentStep(step);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados salvos:", err);
      }
    }
  }, [leadId, storageKey, currentStepKey, form, totalSteps]);

  // Salvar dados automaticamente quando o formulário mudar (com debounce)
  useEffect(() => {
    if (storageKey) {
      let timeoutId: NodeJS.Timeout;
      
      const subscription = form.watch((value) => {
        // Debounce: salvar apenas após 500ms sem mudanças
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const dataToSave: any = {};
            Object.keys(value).forEach((key) => {
              const val = value[key as keyof typeof value];
              // Salvar undefined como null para poder restaurar depois
              if (val === undefined) {
                dataToSave[key] = "__undefined__";
              } else {
                dataToSave[key] = val;
              }
            });
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
          } catch (err) {
            // Silencioso - não interromper o fluxo
          }
        }, 500);
      });
      
      return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    }
  }, [form, storageKey]);

  // Salvar seção atual
  useEffect(() => {
    if (currentStepKey) {
      localStorage.setItem(currentStepKey, currentStep.toString());
    }
  }, [currentStep, currentStepKey]);

  // Limpar erro quando mudar de seção
  useEffect(() => {
    // Limpar erros e estado de tentativa de submit imediatamente ao mudar de seção
    setError(null);
    setHasAttemptedSubmit(false);
    form.clearErrors();
    
    // Limpar erros novamente após um pequeno delay para garantir que nenhuma validação automática seja disparada
    const timer = setTimeout(() => {
      form.clearErrors();
      setHasAttemptedSubmit(false);
      setError(null);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentStep, form]);

  // Garantir que hasAttemptedSubmit comece como false ao montar o componente
  // e limpar erros ao carregar dados do localStorage
  useEffect(() => {
    // Resetar estado de tentativa de submit imediatamente
    setHasAttemptedSubmit(false);
    setError(null);
    
    // Limpar todos os erros do formulário imediatamente
    form.clearErrors();
    
    // Resetar o estado do formulário para garantir que não haja erros sendo exibidos
    // Isso força o react-hook-form a limpar completamente o estado de erros
    const currentValues = form.getValues();
    form.reset(currentValues, {
      keepErrors: false,
      keepDirty: false,
      keepIsSubmitted: false,
      keepTouched: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });
    
    // Limpar erros novamente após um pequeno delay para garantir que tudo foi inicializado
    // e que nenhuma validação automática tenha sido disparada
    const timer1 = setTimeout(() => {
      form.clearErrors();
      setHasAttemptedSubmit(false);
    }, 100);
    
    const timer2 = setTimeout(() => {
      form.clearErrors();
      setHasAttemptedSubmit(false);
    }, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [form]);

  // Verificar acesso e carregar dados
  useEffect(() => {
    const validateAccess = async () => {
      // Se tiver token, validar via token
      if (token) {
        try {
          // Buscar dados do token
          const { data: tokenData, error: tokenError } = await supabase
            .from("approval_tokens")
            .select(`
              *,
              lead:leads(*),
              payment:payments(*)
            `)
            .eq("token", token)
            .single();

          if (tokenError || !tokenData) {
            setError("Token inválido ou expirado.");
            setLoading(false);
            return;
          }

          // Verificar se token expirou
          if (new Date(tokenData.expires_at) < new Date()) {
            setError("Token expirado. Por favor, solicite um novo link.");
            setLoading(false);
            return;
          }

          // Token pode ser usado múltiplas vezes - não marcar como usado

          // Configurar dados do formulário
          if (tokenData.lead) {
            setLeadData(tokenData.lead);
            form.setValue("nome_completo", tokenData.lead.name || "");
            form.setValue("email", tokenData.lead.email || "");
            form.setValue("telefone", tokenData.lead.phone || "");
          }

          if (tokenData.payment) {
            setPaymentData(tokenData.payment);
          }

          // Verificar se já existe formulário submetido (por lead_id, já que payment_id pode ser null)
          if (tokenData.lead_id) {
            const { data: existingForm } = await supabase
              .from("consultation_forms")
              .select("*")
              .eq("lead_id", tokenData.lead_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingForm) {
              setIsFormSubmitted(true);
            }
          }

          setLoading(false);
          return;
        } catch (err: any) {
          // Erro ao validar token
          setError(err.message || "Erro ao validar token.");
          setLoading(false);
          return;
        }
      }

      // Fluxo antigo: validar via lead_id e session_id
      if (!leadId || !sessionId) {
        setError("Parâmetros inválidos. Acesso negado.");
        setLoading(false);
        return;
      }

      try {
        let payment = null;

        // Se paymentId não for "temp", tentar buscar o pagamento
        if (paymentId && paymentId !== "temp") {
          const { data: paymentData, error: paymentError } = await supabase
            .from("payments")
            .select("*")
            .eq("id", paymentId)
            .maybeSingle();

          if (!paymentError && paymentData) {
            payment = paymentData;
          }
        }

        // Se não encontrou por paymentId, buscar por session_id
        if (!payment && sessionId) {
          const { data: paymentData, error: paymentError } = await supabase
            .from("payments")
            .select("*")
            .eq("stripe_session_id", sessionId)
            .maybeSingle();

          if (!paymentError && paymentData) {
            payment = paymentData;
          }
        }

        // Se ainda não encontrou mas tem sessionId, permitir acesso (pagamento pode estar sendo processado)
        if (!payment && sessionId) {
          // Payment não encontrado, mas session_id existe - permitir acesso
          // Criar objeto temporário para permitir acesso ao formulário
          payment = {
            id: paymentId || "temp",
            stripe_session_id: sessionId,
            status: "completed", // Assumir completed se chegou na página de sucesso
            lead_id: leadId,
          };
        }

        if (!payment) {
          setError("Pagamento não encontrado. Por favor, verifique se o pagamento foi processado.");
          setLoading(false);
          return;
        }

        setPaymentData(payment);

        // Buscar lead
        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .single();

        if (leadError || !lead) {
          setError("Lead não encontrado.");
          setLoading(false);
          return;
        }

        setLeadData(lead);
        
        // Preencher dados do lead no formulário
        form.setValue("nome_completo", lead.name || "");
        form.setValue("email", lead.email || "");
        form.setValue("telefone", lead.phone || "");

        // Verificar se já existe formulário submetido (usar session_id ou payment_id real)
        if (payment && payment.id !== "temp") {
          const { data: existingForm } = await supabase
            .from("consultation_forms")
            .select("*")
            .eq("payment_id", payment.id)
            .maybeSingle();

          if (existingForm) {
            setIsFormSubmitted(true);
          }
        } else if (sessionId) {
          // Tentar buscar por session_id via payment
          const { data: paymentBySession } = await supabase
            .from("payments")
            .select("id")
            .eq("stripe_session_id", sessionId)
            .maybeSingle();

          if (paymentBySession?.id) {
            const { data: existingForm } = await supabase
              .from("consultation_forms")
              .select("*")
              .eq("payment_id", paymentBySession.id)
              .maybeSingle();

            if (existingForm) {
              setIsFormSubmitted(true);
            }
          }
        }

        setLoading(false);
      } catch (err: any) {
        // Erro ao validar acesso
        setError(err.message || "Erro ao validar acesso.");
        setLoading(false);
      }
    };

    validateAccess();
  }, [leadId, paymentId, sessionId, form]);

  const onSubmit = async (values: ConsultationFormValues) => {
    // Validar formulário antes de submeter
    const isValid = await form.trigger();
    
    if (!isValid) {
      const errorMsg = "Por favor, corrija os erros no formulário antes de enviar.";
      setError(errorMsg);
      toast.error(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Se estiver usando token, os dados já foram carregados no useEffect
    let finalLeadId = leadId;
    let finalPaymentId = paymentId;

    if (token) {
      const { data: tokenData } = await supabase
        .from("approval_tokens")
        .select("lead_id, payment_id, payment_proof_id, term_acceptance_id")
        .eq("token", token)
        .single();

      if (tokenData) {
        finalLeadId = tokenData.lead_id;
        finalPaymentId = tokenData.payment_id || null;
      }
    }
    
    if (!finalLeadId) {
      const errorMsg = "Dados inválidos: lead_id não encontrado. Por favor, recarregue a página.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!token && !leadId) {
      const errorMsg = "Dados inválidos: lead_id não encontrado. Por favor, recarregue a página.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // payment_id é opcional, tentar encontrar se disponível
      if (!finalPaymentId) {
        if (paymentData && paymentData.id && paymentData.id !== "temp") {
          finalPaymentId = paymentData.id;
        } else if (paymentId && paymentId !== "temp") {
          finalPaymentId = paymentId;
        } else if (token || sessionId || finalLeadId) {
          // Buscar payment por session_id ou lead_id
          if (sessionId) {
            const { data: paymentDataDb } = await supabase
              .from("payments")
              .select("id")
              .eq("stripe_session_id", sessionId)
              .maybeSingle();
            if (paymentDataDb?.id) {
              finalPaymentId = paymentDataDb.id;
            }
          }
          
          if (!finalPaymentId && finalLeadId) {
            const { data: lastPayment } = await supabase
              .from("payments")
              .select("id")
              .eq("lead_id", finalLeadId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (lastPayment?.id) {
              finalPaymentId = lastPayment.id;
            }
          }
        }
      }
      
      // Limpar campos vazios e converter datas vazias para null
      const cleanedValues = { ...values };
      
      if (cleanedValues.data_nascimento === "" || !cleanedValues.data_nascimento) {
        cleanedValues.data_nascimento = null;
      }
      
      if (cleanedValues.data_visto_anterior === "" || !cleanedValues.data_visto_anterior) {
        cleanedValues.data_visto_anterior = null;
      }
      
      const optionalStringFields = [
        'objetivo_outro', 'tipo_visto_anterior', 'periodo_estimado', 'pretende_ir_com',
        'area_formacao_atuacao', 'cargo_atual', 'tempo_cargo_atual', 'nivel_ingles',
        'descricao_bens', 'ramo_faturamento_empresa', 'investimento_disposto', 'fundos_comprovaveis',
        'interesse_dolarizar', 'motivo_visto_negado', 'detalhes_viagem_eua', 'detalhes_parentes_eua',
        'interesse_educacional_outro', 'nome_instituicao', 'modalidade_curso', 'busca_bolsa_financiamento',
        'detalhes_palestrante', 'interesse_participar_eventos', 'expectativas_outro', 'como_conheceu_outro',
        'cidade_residencia'
      ];
      
      optionalStringFields.forEach(field => {
        if (cleanedValues[field as keyof typeof cleanedValues] === "") {
          (cleanedValues[field as keyof typeof cleanedValues] as any) = null;
        }
      });

      // Remover campos undefined
      Object.keys(cleanedValues).forEach(key => {
        if (cleanedValues[key as keyof typeof cleanedValues] === undefined) {
          delete cleanedValues[key as keyof typeof cleanedValues];
        }
      });

      const submissionData: any = {
        lead_id: finalLeadId,
        ...cleanedValues,
        data_declaracao: new Date().toISOString().split("T")[0],
        assinatura_digital: "aceito",
      };
      
      if (finalPaymentId) {
        submissionData.payment_id = finalPaymentId;
      }
      
      const { data, error: submitError } = await supabase
        .from("consultation_forms")
        .insert(submissionData)
        .select();

      if (submitError) {
        throw new Error(submitError.message || "Erro ao enviar formulário");
      }

      setIsFormSubmitted(true);
      toast.success("Formulário enviado com sucesso! Agora você pode agendar sua reunião.");
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao enviar formulário. Por favor, tente novamente.";
      setError(errorMessage);
      setHasAttemptedSubmit(true);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error && !leadData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Erro de Acesso</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => navigate("/oferta")}
              style={{ 
                backgroundColor: '#111827',
                color: '#ffffff',
                border: 'none',
                padding: '0.625rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111827';
              }}
            >
              <span style={{ color: '#ffffff' }}>Voltar para o Início</span>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFormSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 consultation-form-page">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 bg-white border-gray-200 shadow-sm">
            <CardHeader className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-gray-900">Formulário Enviado com Sucesso!</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Agora você pode agendar sua reunião com o Ceme e o Matheus.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900">Agende sua Reunião</CardTitle>
              <CardDescription className="text-gray-600">
                Escolha o melhor dia e horário para sua consulta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendlyEmbed 
                prefill={
                  (leadData?.name || leadData?.email || form.getValues("nome_completo") || form.getValues("email"))
                    ? {
                        name: (leadData?.name || form.getValues("nome_completo") || "").toString().trim() || undefined,
                        email: (leadData?.email || form.getValues("email") || "").toString().trim() || undefined,
                      }
                    : undefined
                }
              />
              <div className="mt-6 flex justify-center">
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <button
                      onClick={() => navigate("/oferta")}
                      style={{ 
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        border: '1px solid #d1d5db',
                        padding: '0.625rem 1rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <span style={{ color: '#111827' }}>Voltar para a Página Inicial</span>
                    </button>

                    {/* Botão de Teste para Pular Agendamento */}
                    <button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('meetings')
                            .insert({
                              lead_id: leadData?.id || leadId,
                              meeting_type: 'first',
                              status: 'scheduled',
                              scheduled_date: new Date(Date.now() + 86400000).toISOString(), // Amanhã
                              meeting_url: 'https://meet.google.com/test-link'
                            });

                          if (error) throw error;

                          toast.success("Agendamento simulado com sucesso! Redirecionando...");
                          // Redireciona para o dashboard do cliente se estiver logado, ou home
                          navigate("/client/dashboard");
                        } catch (err: any) {
                          console.error("Erro ao simular agendamento:", err);
                          toast.error("Erro ao simular: " + err.message);
                        }
                      }}
                      style={{ 
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #D97706',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem'
                      }}
                    >
                      <span>🛠️ MODO TESTE: Pular Agendamento e Ir para Dashboard</span>
                    </button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const watchPossuiFilhos = form.watch("possui_filhos");
  const watchObjetivoPrincipal = form.watch("objetivo_principal");
  const watchPossuiBens = form.watch("possui_bens");
  const watchPossuiEmpresa = form.watch("possui_empresa_cnpj");
  const watchJaTeveVisto = form.watch("ja_teve_visto_eua");
  const watchJaTeveNegado = form.watch("ja_teve_visto_negado");
  const watchJaViajou = form.watch("ja_viajou_eua");
  const watchPossuiParentes = form.watch("possui_parentes_eua");
  const watchPossuiInstituicao = form.watch("possui_instituicao_mente");
  const watchConhecePalestrante = form.watch("conhece_palestrante");
  const watchComoConheceu = form.watch("como_conheceu");
  
  // Watch dos campos da seção 8 para validar se o botão de enviar deve estar habilitado
  const watchExpectativas = form.watch("expectativas");
  const watchAssinaturaDigital = form.watch("assinatura_digital");
  const watchComoConheceuOutro = form.watch("como_conheceu_outro");
  const watchExpectativasOutro = form.watch("expectativas_outro");
  
  // Verificar se a seção 8 está completa
  const isSection8Complete = () => {
    if (currentStep !== 8) return true; // Se não estiver na seção 8, considerar completa
    
    const expectativas = watchExpectativas || [];
    const comoConheceu = watchComoConheceu;
    const assinaturaDigital = watchAssinaturaDigital;
    
    // Verificar campos obrigatórios
    if (expectativas.length === 0) return false;
    if (!comoConheceu || comoConheceu.trim() === "") return false;
    if (!assinaturaDigital || assinaturaDigital.trim() === "") return false;
    
    // Verificar campos condicionais
    if (comoConheceu === "outro") {
      if (!watchComoConheceuOutro || watchComoConheceuOutro.trim() === "") return false;
    }
    
    if (expectativas.includes("outro")) {
      if (!watchExpectativasOutro || watchExpectativasOutro.trim() === "") return false;
    }
    
    return true;
  };
  
  const canSubmitForm = isSection8Complete();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 consultation-form-page">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Formulário de Análise Prévia – Consultoria American Dream
            </CardTitle>
            <CardDescription className="text-base">
              Preencha atentamente para que possamos entender seu perfil e preparar uma estratégia personalizada para o seu projeto nos Estados Unidos.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Barra de Progresso */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Seção {currentStep} de {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}% concluído</span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Mensagens de erro removidas - apenas FormMessage nos campos específicos */}

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(
              (data) => {
                // Limpar dados salvos ao submeter com sucesso
                if (storageKey) {
                  localStorage.removeItem(storageKey);
                }
                if (currentStepKey) {
                  localStorage.removeItem(currentStepKey);
                }
                onSubmit(data);
              },
              (errors) => {
                // Apenas marcar que tentou submeter para mostrar erros nos campos
                setHasAttemptedSubmit(true);
                
                // Scroll para o primeiro campo com erro
                setTimeout(() => {
                  const firstErrorField = document.querySelector('[data-invalid="true"], [aria-invalid="true"]');
                  if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }
            )} 
            className="space-y-8"
          >
            {/* SEÇÃO 1: DADOS PESSOAIS */}
            {currentStep === 1 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">DADOS PESSOAIS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1. Nome completo <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2. E-mail <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3. Telefone (WhatsApp) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4. Data de nascimento <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade_residencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>5. Cidade e país onde reside atualmente <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: São Paulo, Brasil" />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_civil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6. Estado civil <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="solteiro" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Solteiro(a)</SelectItem>
                          <SelectItem value="casado" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Casado(a)</SelectItem>
                          <SelectItem value="divorciado" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao_estavel" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="possui_filhos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>7. Você possui filhos? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            const checked = value === "sim";
                            field.onChange(checked);
                            // Se marcar "Sim", adicionar automaticamente um dependente vazio
                            if (checked) {
                              const dependentes = form.getValues("dependentes") || [];
                              // Só adicionar se não houver nenhum dependente ainda
                              if (dependentes.length === 0) {
                                form.setValue("dependentes", [{ nome: "", idade: "", grau_parentesco: "" }]);
                              }
                            } else {
                              // Se marcar "Não", limpar dependentes
                              form.setValue("dependentes", []);
                            }
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="filhos-sim" />
                            <Label htmlFor="filhos-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="filhos-nao" />
                            <Label htmlFor="filhos-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchPossuiFilhos === true && (
                  <div className="space-y-2">
                    <Label>Informe nome, idade e grau de parentesco de cada dependente:</Label>
                    <div className="space-y-2">
                      {form.watch("dependentes")?.map((_, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Nome"
                            value={form.watch("dependentes")?.[index]?.nome || ""}
                            onChange={(e) => {
                              const dependentes = form.getValues("dependentes") || [];
                              dependentes[index] = { ...dependentes[index], nome: e.target.value };
                              form.setValue("dependentes", dependentes);
                            }}
                          />
                          <Input
                            placeholder="Idade"
                            value={form.watch("dependentes")?.[index]?.idade || ""}
                            onChange={(e) => {
                              const dependentes = form.getValues("dependentes") || [];
                              dependentes[index] = { ...dependentes[index], idade: e.target.value };
                              form.setValue("dependentes", dependentes);
                            }}
                          />
                          <Input
                            placeholder="Grau de parentesco"
                            value={form.watch("dependentes")?.[index]?.grau_parentesco || ""}
                            onChange={(e) => {
                              const dependentes = form.getValues("dependentes") || [];
                              dependentes[index] = { ...dependentes[index], grau_parentesco: e.target.value };
                              form.setValue("dependentes", dependentes);
                            }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const dependentes = form.getValues("dependentes") || [];
                          form.setValue("dependentes", [...dependentes, { nome: "", idade: "", grau_parentesco: "" }]);
                        }}
                        style={{ 
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          border: '1px solid #d1d5db',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        <span style={{ color: '#111827' }}>Adicionar Dependente</span>
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 2: OBJETIVO PRINCIPAL */}
            {currentStep === 2 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">OBJETIVO PRINCIPAL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="objetivo_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>8. Qual é o seu objetivo principal nos Estados Unidos? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="estudar" id="obj-estudar" />
                            <Label htmlFor="obj-estudar">Estudar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="trabalhar" id="obj-trabalhar" />
                            <Label htmlFor="obj-trabalhar">Trabalhar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="empreender" id="obj-empreender" />
                            <Label htmlFor="obj-empreender">Empreender</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="morar" id="obj-morar" />
                            <Label htmlFor="obj-morar">Morar definitivamente</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="visitar" id="obj-visitar" />
                            <Label htmlFor="obj-visitar">Apenas visitar (turismo)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="outro" id="obj-outro" />
                            <Label htmlFor="obj-outro">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchObjetivoPrincipal === "outro" && (
                  <FormField
                    control={form.control}
                    name="objetivo_outro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique:</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="tipo_visto_desejado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>9. Qual tipo de visto você deseja solicitar? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="b1b2" id="visto-b1b2" />
                            <Label htmlFor="visto-b1b2">Turista (B1/B2)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="f1" id="visto-f1" />
                            <Label htmlFor="visto-f1">Estudante (F1)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cos" id="visto-cos" />
                            <Label htmlFor="visto-cos">Troca de status (COS)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="trabalho" id="visto-trabalho" />
                            <Label htmlFor="visto-trabalho">Visto de trabalho (EB3, EB2, L1, etc.)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao_sei" id="visto-nao-sei" />
                            <Label htmlFor="visto-nao-sei">Não sei</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodo_estimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>10. Você já tem uma data ou período estimado para ir aos Estados Unidos? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3_meses" id="periodo-3" />
                            <Label htmlFor="periodo-3">Nos próximos 3 meses</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6_meses" id="periodo-6" />
                            <Label htmlFor="periodo-6">Em até 6 meses</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1_ano" id="periodo-1-ano" />
                            <Label htmlFor="periodo-1-ano">Em 1 ano</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sem_data" id="periodo-sem-data" />
                            <Label htmlFor="periodo-sem-data">Ainda sem data definida</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pretende_ir_com"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>11. Pretende ir sozinho(a) ou acompanhado(a)? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sozinho" id="ir-sozinho" />
                            <Label htmlFor="ir-sozinho">Sozinho(a)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="conjuge" id="ir-conjuge" />
                            <Label htmlFor="ir-conjuge">Com cônjuge</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="conjuge_filhos" id="ir-conjuge-filhos" />
                            <Label htmlFor="ir-conjuge-filhos">Com cônjuge e filhos</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="outro" id="ir-outro" />
                            <Label htmlFor="ir-outro">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 3: PERFIL PROFISSIONAL E ACADÊMICO */}
            {currentStep === 3 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">PERFIL PROFISSIONAL E ACADÊMICO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="formacao_academica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>12. Formação acadêmica <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            <SelectItem value="ensino_medio" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Ensino médio</SelectItem>
                            <SelectItem value="tecnico" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Curso técnico</SelectItem>
                            <SelectItem value="graduacao" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Graduação</SelectItem>
                            <SelectItem value="pos_graduacao" className="text-gray-900 focus:bg-gray-100 focus:text-gray-900">Pós-graduação / Mestrado / Doutorado</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area_formacao_atuacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>13. Área de formação ou atuação profissional atual <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cargo_atual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>14. Cargo atual e há quanto tempo exerce a função <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Engenheiro de Software, 3 anos" />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivel_ingles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>15. Nível de inglês <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="basico" id="ingles-basico" />
                            <Label htmlFor="ingles-basico">Básico</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="intermediario" id="ingles-intermediario" />
                            <Label htmlFor="ingles-intermediario">Intermediário</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="avancado" id="ingles-avancado" />
                            <Label htmlFor="ingles-avancado">Avançado</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fluente" id="ingles-fluente" />
                            <Label htmlFor="ingles-fluente">Fluente</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 4: SITUAÇÃO FINANCEIRA */}
            {currentStep === 4 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">SITUAÇÃO FINANCEIRA E INVESTIMENTO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="renda_mensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>16. Qual é sua renda mensal aproximada (em dólares ou reais)? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: US$ 5.000 ou R$ 25.000" />
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="possui_bens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>17. Você possui bens ou propriedades em seu nome? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="bens-sim" />
                            <Label htmlFor="bens-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="bens-nao" />
                            <Label htmlFor="bens-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchPossuiBens === true && (
                  <FormField
                    control={form.control}
                    name="descricao_bens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, descreva brevemente:</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="possui_empresa_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>18. Você possui empresa ou CNPJ ativo? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="empresa-sim" />
                            <Label htmlFor="empresa-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="empresa-nao" />
                            <Label htmlFor="empresa-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchPossuiEmpresa === true && (
                  <FormField
                    control={form.control}
                    name="ramo_faturamento_empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, informe o ramo de atuação e faturamento médio:</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="investimento_disposto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>19. Quanto você está disposto(a) a investir no seu projeto de visto e mudança para os EUA? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ate_5000" id="inv-ate-5000" />
                            <Label htmlFor="inv-ate-5000">Até US$ 5.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="5000_15000" id="inv-5000-15000" />
                            <Label htmlFor="inv-5000-15000">Entre US$ 5.000 e US$ 15.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="15000_30000" id="inv-15000-30000" />
                            <Label htmlFor="inv-15000-30000">Entre US$ 15.000 e US$ 30.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="acima_30000" id="inv-acima-30000" />
                            <Label htmlFor="inv-acima-30000">Acima de US$ 30.000</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundos_comprovaveis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>20. Quanto você consegue comprovar de fundos hoje? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="10000" id="fundos-10000" />
                            <Label htmlFor="fundos-10000">US$ 10.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="20000" id="fundos-20000" />
                            <Label htmlFor="fundos-20000">US$ 20.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="30000" id="fundos-30000" />
                            <Label htmlFor="fundos-30000">US$ 30.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="40000" id="fundos-40000" />
                            <Label htmlFor="fundos-40000">US$ 40.000</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mais_40000" id="fundos-mais-40000" />
                            <Label htmlFor="fundos-mais-40000">Mais de US$ 40.000</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interesse_dolarizar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>21. Você tem interesse em dolarizar parte do seu patrimônio ou se tornar acionista de empresa americana? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="dolar-sim" />
                            <Label htmlFor="dolar-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="dolar-nao" />
                            <Label htmlFor="dolar-nao">Não</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="talvez" id="dolar-talvez" />
                            <Label htmlFor="dolar-talvez">Talvez — quero entender melhor</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 5: HISTÓRICO MIGRATÓRIO */}
            {currentStep === 5 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">HISTÓRICO MIGRATÓRIO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="ja_teve_visto_eua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>22. Você já teve algum visto para os Estados Unidos? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="visto-eua-sim" />
                            <Label htmlFor="visto-eua-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="visto-eua-nao" />
                            <Label htmlFor="visto-eua-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchJaTeveVisto === true && (
                  <>
                    <FormField
                      control={form.control}
                      name="tipo_visto_anterior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Se sim, qual tipo e quando foi emitido?</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: B1/B2, 2020" />
                          </FormControl>
                          <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="ja_teve_visto_negado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>23. Já teve algum visto negado? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="visto-negado-sim" />
                            <Label htmlFor="visto-negado-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="visto-negado-nao" />
                            <Label htmlFor="visto-negado-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchJaTeveNegado === true && (
                  <FormField
                    control={form.control}
                    name="motivo_visto_negado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, descreva brevemente o motivo ou o que foi informado na entrevista:</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="ja_viajou_eua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>24. Já viajou para os Estados Unidos? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="viajou-sim" />
                            <Label htmlFor="viajou-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="viajou-nao" />
                            <Label htmlFor="viajou-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchJaViajou === true && (
                  <FormField
                    control={form.control}
                    name="detalhes_viagem_eua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, quando e por quanto tempo ficou?</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 2021, 2 semanas" />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="ja_ficou_ilegal_eua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>25. Já ficou ilegalmente ou ultrapassou o tempo permitido nos EUA? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="ilegal-sim" />
                            <Label htmlFor="ilegal-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="ilegal-nao" />
                            <Label htmlFor="ilegal-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="possui_parentes_eua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>26. Possui parentes ou amigos próximos morando nos EUA? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="parentes-sim" />
                            <Label htmlFor="parentes-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="parentes-nao" />
                            <Label htmlFor="parentes-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchPossuiParentes === true && (
                  <FormField
                    control={form.control}
                    name="detalhes_parentes_eua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, indique quem e em qual cidade/estado vivem:</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 6: INTERESSES EDUCACIONAIS */}
            {currentStep === 6 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">INTERESSES EDUCACIONAIS (caso tenha intenção de estudar)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="interesse_educacional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>27. Tem interesse em: <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ingles" id="edu-ingles" />
                            <Label htmlFor="edu-ingles">Curso de inglês</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="faculdade" id="edu-faculdade" />
                            <Label htmlFor="edu-faculdade">Faculdade / College</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="tecnico" id="edu-tecnico" />
                            <Label htmlFor="edu-tecnico">Curso técnico</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="outro" id="edu-outro" />
                            <Label htmlFor="edu-outro">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {form.watch("interesse_educacional") === "outro" && (
                  <FormField
                    control={form.control}
                    name="interesse_educacional_outro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique:</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="possui_instituicao_mente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>28. Já possui alguma instituição em mente? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="instituicao-sim" />
                            <Label htmlFor="instituicao-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="instituicao-nao" />
                            <Label htmlFor="instituicao-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchPossuiInstituicao === true && (
                  <FormField
                    control={form.control}
                    name="nome_instituicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, qual?</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="modalidade_curso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>29. Modalidade de curso desejada: <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="presencial" id="modal-presencial" />
                            <Label htmlFor="modal-presencial">Presencial</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hibrido" id="modal-hibrido" />
                            <Label htmlFor="modal-hibrido">Híbrido (presencial e online)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online" id="modal-online" />
                            <Label htmlFor="modal-online">Online</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="busca_bolsa_financiamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>30. Está em busca de bolsa de estudos ou financiamento? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="bolsa-sim" />
                            <Label htmlFor="bolsa-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="bolsa-nao" />
                            <Label htmlFor="bolsa-nao">Não</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="talvez" id="bolsa-talvez" />
                            <Label htmlFor="bolsa-talvez">Talvez</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 7: NETWORK E OPORTUNIDADES */}
            {currentStep === 7 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">NETWORK E OPORTUNIDADES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="conhece_palestrante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>31. Você conhece alguém que poderia realizar uma palestra, evento ou workshop nos EUA (ex: empresários, mentores ou palestrantes)? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? "sim" : field.value === false ? "nao" : ""}
                          onValueChange={(value) => {
                            field.onChange(value === "sim");
                          }}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="palestrante-sim" />
                            <Label htmlFor="palestrante-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="palestrante-nao" />
                            <Label htmlFor="palestrante-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchConhecePalestrante === true && (
                  <FormField
                    control={form.control}
                    name="detalhes_palestrante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se sim, informe nome e área de atuação:</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="interesse_participar_eventos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>32. Você gostaria de participar de palestras, eventos ou encontros empresariais nos EUA promovidos pelos mentores do American Dream? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="eventos-sim" />
                            <Label htmlFor="eventos-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="eventos-nao" />
                            <Label htmlFor="eventos-nao">Não</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="talvez" id="eventos-talvez" />
                            <Label htmlFor="eventos-talvez">Talvez</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            )}

            {/* SEÇÃO 8: EXPECTATIVAS E MOTIVAÇÃO */}
            {currentStep === 8 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-xl text-gray-900 font-semibold">EXPECTATIVAS E MOTIVAÇÃO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="expectativas"
                  render={() => (
                    <FormItem>
                      <FormLabel>33. O que você espera alcançar com esta consultoria? <span className="text-red-500">*</span></FormLabel>
                      <div className="space-y-2">
                        {[
                          "Planejar minha entrada legal e segura nos EUA",
                          "Entender as opções de visto e estratégias possíveis",
                          "Validar uma estratégia antes de investir",
                          "Avaliar oportunidades de negócio ou estudo",
                        ].map((expectativa, index) => (
                          <FormField
                            key={index}
                            control={form.control}
                            name="expectativas"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(expectativa)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        return checked
                                          ? field.onChange([...current, expectativa])
                                          : field.onChange(
                                              current.filter((val) => val !== expectativa)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {expectativa}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormField
                          control={form.control}
                          name="expectativas_outro"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outro:</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Descreva sua expectativa" />
                              </FormControl>
                              <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                            </FormItem>
                          )}
                        />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="como_conheceu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>34. Como você conheceu o Matheus ou o Ceme? <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="instagram" id="conheceu-instagram" />
                            <Label htmlFor="conheceu-instagram">Instagram</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="indicacao" id="conheceu-indicacao" />
                            <Label htmlFor="conheceu-indicacao">Indicação</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="youtube" id="conheceu-youtube" />
                            <Label htmlFor="conheceu-youtube">YouTube</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="google" id="conheceu-google" />
                            <Label htmlFor="conheceu-google">Google</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="outro" id="conheceu-outro" />
                            <Label htmlFor="conheceu-outro">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                    </FormItem>
                  )}
                />

                {watchComoConheceu === "outro" && (
                  <FormField
                    control={form.control}
                    name="como_conheceu_outro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique:</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                )}

                <Separator className="my-6" />

                <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg">
                  <p className="text-sm text-gray-800 mb-4 font-semibold">
                    DECLARAÇÃO FINAL
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Declaro que as informações prestadas neste formulário são verdadeiras e fornecidas voluntariamente, compreendendo que serão utilizadas exclusivamente para análise técnica e elaboração da estratégia personalizada dentro da Consultoria American Dream.
                  </p>
                  <FormField
                    control={form.control}
                    name="assinatura_digital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Data: {new Date().toLocaleDateString("pt-BR")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite seu nome completo para assinar" />
                        </FormControl>
                        <ConditionalFormMessage hasAttemptedSubmit={hasAttemptedSubmit} />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {error && hasAttemptedSubmit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Botões de Navegação */}
            <div className="flex justify-between gap-4 pt-4">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Limpar erros ao voltar
                      setError(null);
                      setHasAttemptedSubmit(false);
                      setCurrentStep(currentStep - 1);
                    }}
                    style={{ 
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" style={{ color: '#111827' }} />
                    <span style={{ color: '#111827' }}>Anterior</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/oferta")}
                  style={{ 
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    padding: '0.625rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <span style={{ color: '#111827' }}>Cancelar</span>
                </button>
              </div>
              
              <div className="flex gap-2">
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Limpar erros ao mudar de seção
                      setError(null);
                      setHasAttemptedSubmit(false);
                      
                      // Validar TODOS os campos obrigatórios da seção atual antes de avançar
                      const sectionFields: Record<number, string[]> = {
                        1: ['nome_completo', 'email', 'telefone', 'data_nascimento', 'cidade_residencia', 'estado_civil'],
                        2: ['objetivo_principal', 'tipo_visto_desejado', 'periodo_estimado'],
                        3: ['formacao_academica', 'area_formacao_atuacao', 'cargo_atual', 'nivel_ingles'],
                        4: ['renda_mensal', 'investimento_disposto', 'fundos_comprovaveis', 'interesse_dolarizar'],
                        5: [], // Histórico migratório - campos condicionais
                        6: ['interesse_educacional', 'modalidade_curso', 'busca_bolsa_financiamento'], // Interesses educacionais
                        7: ['interesse_participar_eventos'], // Network
                        8: ['expectativas', 'como_conheceu', 'assinatura_digital'], // Expectativas
                      };
                      
                      const fieldsToValidate = sectionFields[currentStep] || [];
                      
                      // Função para validar campos condicionais da seção
                      const validateConditionalFields = (step: number, formValues: any): string[] => {
                        const missingFields: string[] = [];
                        
                        if (step === 1) {
                          // Seção 1: Dados Pessoais
                          if (formValues.possui_filhos === true) {
                            const dependentesValidos = (formValues.dependentes || []).filter(
                              (dep: any) => dep?.nome?.trim() && dep?.idade?.trim() && dep?.grau_parentesco?.trim()
                            );
                            if (dependentesValidos.length === 0) {
                              missingFields.push('dependentes');
                            }
                          }
                        }
                        
                        if (step === 2) {
                          // Seção 2: Objetivo Principal
                          if (formValues.objetivo_principal === "outro" && !formValues.objetivo_outro?.trim()) {
                            missingFields.push('objetivo_outro');
                          }
                          if (formValues.pretende_ir_sozinho === false && !formValues.pretende_ir_com?.trim()) {
                            missingFields.push('pretende_ir_com');
                          }
                        }
                        
                        if (step === 4) {
                          // Seção 4: Situação Financeira
                          if (formValues.possui_bens === true && !formValues.descricao_bens?.trim()) {
                            missingFields.push('descricao_bens');
                          }
                          if (formValues.possui_empresa_cnpj === true && !formValues.ramo_faturamento_empresa?.trim()) {
                            missingFields.push('ramo_faturamento_empresa');
                          }
                        }
                        
                        if (step === 5) {
                          // Seção 5: Histórico Migratório - todos são condicionais
                          if (formValues.ja_teve_visto_eua === true && !formValues.tipo_visto_anterior?.trim()) {
                            missingFields.push('tipo_visto_anterior');
                          }
                          if (formValues.ja_teve_visto_negado === true && !formValues.motivo_visto_negado?.trim()) {
                            missingFields.push('motivo_visto_negado');
                          }
                          if (formValues.ja_viajou_eua === true && !formValues.detalhes_viagem_eua?.trim()) {
                            missingFields.push('detalhes_viagem_eua');
                          }
                          if (formValues.possui_parentes_eua === true && !formValues.detalhes_parentes_eua?.trim()) {
                            missingFields.push('detalhes_parentes_eua');
                          }
                        }
                        
                        if (step === 6) {
                          // Seção 6: Interesses Educacionais
                          if (formValues.interesse_educacional === "outro" && !formValues.interesse_educacional_outro?.trim()) {
                            missingFields.push('interesse_educacional_outro');
                          }
                          if (formValues.possui_instituicao_mente === true && !formValues.nome_instituicao?.trim()) {
                            missingFields.push('nome_instituicao');
                          }
                        }
                        
                        if (step === 7) {
                          // Seção 7: Network
                          if (formValues.conhece_palestrante === true && !formValues.detalhes_palestrante?.trim()) {
                            missingFields.push('detalhes_palestrante');
                          }
                        }
                        
                        if (step === 8) {
                          // Seção 8: Expectativas
                          if (formValues.como_conheceu === "outro" && !formValues.como_conheceu_outro?.trim()) {
                            missingFields.push('como_conheceu_outro');
                          }
                          if (formValues.expectativas?.includes("outro") && !formValues.expectativas_outro?.trim()) {
                            missingFields.push('expectativas_outro');
                          }
                        }
                        
                        return missingFields;
                      };
                      
                      if (fieldsToValidate.length > 0) {
                        // Validar campos obrigatórios
                        form.trigger(fieldsToValidate as any).then((isValid) => {
                          const formValues = form.getValues();
                          const conditionalMissing = validateConditionalFields(currentStep, formValues);
                          
                          if (isValid && conditionalMissing.length === 0) {
                            // Tudo válido, pode avançar
                            // Limpar erros antes de mudar de seção para evitar que apareçam na próxima seção
                            form.clearErrors();
                            setHasAttemptedSubmit(false);
                            setCurrentStep(currentStep + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            // Há campos não preenchidos - apenas marcar para mostrar erros nos campos
                            setHasAttemptedSubmit(true);
                            
                            // Scroll para o primeiro campo com erro
                            setTimeout(() => {
                              const firstErrorField = document.querySelector('[data-invalid="true"]');
                              if (firstErrorField) {
                                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }
                        });
                      } else {
                        // Seção sem campos obrigatórios diretos, verificar condicionais
                        const formValues = form.getValues();
                        const conditionalMissing = validateConditionalFields(currentStep, formValues);
                        
                        if (conditionalMissing.length === 0) {
                          // Limpar erros antes de mudar de seção para evitar que apareçam na próxima seção
                          form.clearErrors();
                          setHasAttemptedSubmit(false);
                          setCurrentStep(currentStep + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          // Há campos condicionais não preenchidos - apenas marcar para mostrar erros
                          setHasAttemptedSubmit(true);
                          
                          // Scroll para o primeiro campo com erro
                          setTimeout(() => {
                            const firstErrorField = document.querySelector('[data-invalid="true"]');
                            if (firstErrorField) {
                              firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 100);
                        }
                      }
                    }}
                    style={{ 
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      // Garantir que o texto permaneça preto no hover
                      const span = e.currentTarget.querySelector('span');
                      const svg = e.currentTarget.querySelector('svg');
                      if (span) span.style.color = '#111827';
                      if (svg) svg.style.color = '#111827';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      // Garantir que o texto permaneça preto
                      const span = e.currentTarget.querySelector('span');
                      const svg = e.currentTarget.querySelector('svg');
                      if (span) span.style.color = '#111827';
                      if (svg) svg.style.color = '#111827';
                    }}
                  >
                    <span style={{ color: '#111827' }}>Próximo</span>
                    <ChevronRight className="h-4 w-4" style={{ color: '#111827' }} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmitForm}
                    style={{ 
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: (isSubmitting || !canSubmitForm) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s',
                      opacity: (isSubmitting || !canSubmitForm) ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting && canSubmitForm) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        // Garantir que o texto permaneça preto no hover
                        const span = e.currentTarget.querySelector('span');
                        const svg = e.currentTarget.querySelector('svg');
                        if (span) span.style.color = '#111827';
                        if (svg) svg.style.color = '#111827';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting && canSubmitForm) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        // Garantir que o texto permaneça preto
                        const span = e.currentTarget.querySelector('span');
                        const svg = e.currentTarget.querySelector('svg');
                        if (span) span.style.color = '#111827';
                        if (svg) svg.style.color = '#111827';
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ color: '#111827' }} />
                        <span style={{ color: '#111827' }}>Enviando...</span>
                      </>
                    ) : (
                      <span style={{ color: '#111827' }}>Enviar Formulário</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ConsultationForm;

