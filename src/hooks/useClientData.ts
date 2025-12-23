import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClientPlan } from "@/types/dashboard";

export interface ClientStage {
    stage: number;
    stageName: string;
    stageDescription: string;
    isCompleted: boolean;
    isCurrent: boolean;
    actionAvailable: boolean;
    actionLabel: string;
    actionLink: string;
}

export interface ClientData {
    leadId: string;
    name: string;
    email: string;
    phone: string;
    currentStage: number;
    stages: ClientStage[];
    // Data relacionada
    paymentCompleted: boolean;
    paymentId: string | null;
    termAcceptanceId: string | null;
    consultationFormCompleted: boolean;
    consultationFormId: string | null;
    firstMeetingScheduled: boolean;
    firstMeetingCompleted: boolean;
    firstMeetingDate: string | null;
    planningStarted: boolean;
    planStatus: string | null;
    secondPaymentCompleted: boolean;
    secondMeetingScheduled: boolean;
    secondMeetingCompleted: boolean;
    clientPlan: ClientPlan | null;
}

export const useClientData = () => {
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const determineStages = (data: any): ClientStage[] => {
        const {
            paymentCompleted,
            termAcceptanceId,
            consultationFormCompleted,
            firstMeetingScheduled,
            firstMeetingCompleted,
            planningStarted,
            planStatus,
            secondPaymentCompleted,
            secondMeetingScheduled,
            secondMeetingCompleted,
            leadId
        } = data;

        // Inferência de conclusão baseada em etapas futuras
        // Se pagou a segunda parcela, assume-se que reuniu e planejou
        const effectivePlanningStarted = planningStarted || secondPaymentCompleted || secondMeetingCompleted;
        const effectiveFirstMeetingCompleted = firstMeetingCompleted || effectivePlanningStarted;
        const effectivePlanCompleted = planStatus === 'presented' || planStatus === 'completed' || secondPaymentCompleted;

        // Determinar estágio atual
        let currentStage = 1;

        if (paymentCompleted) currentStage = 2;
        if (paymentCompleted && consultationFormCompleted) currentStage = 3;
        if (paymentCompleted && consultationFormCompleted && effectiveFirstMeetingCompleted) currentStage = 4;
        if (paymentCompleted && consultationFormCompleted && effectiveFirstMeetingCompleted && effectivePlanningStarted) currentStage = 5;
        if (paymentCompleted && consultationFormCompleted && effectiveFirstMeetingCompleted && effectivePlanningStarted && secondPaymentCompleted) currentStage = 6;
        if (secondMeetingCompleted) currentStage = 7; // Concluído

        const stages: ClientStage[] = [
            {
                stage: 1,
                stageName: "Pagamento Inicial",
                stageDescription: "Realize o pagamento da primeira parcela para iniciar",
                isCompleted: paymentCompleted,
                isCurrent: currentStage === 1,
                actionAvailable: !paymentCompleted,
                actionLabel: "Realizar Pagamento",
                actionLink: termAcceptanceId
                    ? `/payment-options?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`
                    : "/lead-form"
            },
            {
                stage: 2,
                stageName: "Formulário de Consultoria",
                stageDescription: "Preencha o formulário com suas informações detalhadas",
                isCompleted: consultationFormCompleted,
                isCurrent: currentStage === 2,
                actionAvailable: paymentCompleted && !consultationFormCompleted,
                actionLabel: "Preencher Formulário",
                actionLink: `/consultation-form?lead_id=${leadId}`
            },
            {
                stage: 3,
                stageName: "1ª Reunião (Estratégica)",
                stageDescription: firstMeetingScheduled
                    ? (effectiveFirstMeetingCompleted ? "Reunião realizada" : "Reunião agendada - aguarde o dia marcado")
                    : "Aguarde o agendamento da sua reunião estratégica",
                isCompleted: effectiveFirstMeetingCompleted,
                isCurrent: currentStage === 3,
                actionAvailable: false, // Reunião é agendada via Calendly no formulário
                actionLabel: firstMeetingScheduled ? "Ver Detalhes" : "Aguardando",
                actionLink: "#"
            },
            {
                stage: 4,
                stageName: "Planejamento",
                stageDescription: effectivePlanningStarted
                    ? "Nosso time está trabalhando no seu planejamento personalizado"
                    : "Aguarde o início do planejamento",
                isCompleted: effectivePlanCompleted,
                isCurrent: currentStage === 4,
                actionAvailable: false,
                actionLabel: effectivePlanningStarted ? "Em andamento..." : "Aguardando",
                actionLink: "#"
            },
            {
                stage: 5,
                stageName: "Segunda Parcela",
                stageDescription: secondPaymentCompleted
                    ? "Pagamento realizado"
                    : "Realize o pagamento da segunda parcela para continuar",
                isCompleted: secondPaymentCompleted,
                isCurrent: currentStage === 5,
                actionAvailable: effectivePlanningStarted && !secondPaymentCompleted,
                actionLabel: "Realizar Pagamento",
                actionLink: termAcceptanceId
                    ? `/parcela-2-2?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`
                    : "#"
            },
            {
                stage: 6,
                stageName: "Apresentação do Plano",
                stageDescription: secondMeetingCompleted
                    ? "Plano apresentado - Sucesso!"
                    : (secondMeetingScheduled ? "Reunião agendada" : "Aguarde o agendamento da apresentação"),
                isCompleted: secondMeetingCompleted,
                isCurrent: currentStage === 6,
                actionAvailable: false,
                actionLabel: secondMeetingScheduled ? "Ver Detalhes" : "Aguardando",
                actionLink: "#"
            }
        ];

        return stages;
    };

    const fetchClientData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Pegar usuário autenticado
            const { data: { user } } = await supabase.auth.getUser();

            if (!user?.email) {
                throw new Error("Usuário não autenticado");
            }

            // Buscar lead pelo email (segurança contra duplicidade)
            let { data: leadData, error: leadError } = await supabase
                .from('leads')
                .select('*')
                .eq('email', user.email.toLowerCase())
                .order('created_at', { ascending: false }) // Pega o mais recente (geralmente o ativo)
                .limit(1)
                .maybeSingle();

            // Se der erro diferente de "não encontrado" (que maybeSingle trata retornando null)
            if (leadError) {
                throw leadError;
            }

            // Se não encontrou o lead, criar um novo automaticamente
            if (!leadData) {
                console.log("Lead não encontrado, criando novo lead...");

                const { data: newLead, error: createError } = await supabase
                    .from('leads')
                    .insert({
                        name: user.user_metadata?.nome_completo || user.email.split('@')[0],
                        email: user.email.toLowerCase(),
                        phone: user.user_metadata?.telefone || '',
                        user_id: user.id,
                        status_geral: 'cadastrado'
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error("Erro ao criar lead:", createError);
                    // Se falhar (ex: duplicidade que o select não viu por RLS), tentar recuperar novamente
                    // ou lançar erro
                    throw new Error("Lead não encontrado e erro ao criar: " + createError.message);
                }

                leadData = newLead;
            } else if (leadData.user_id !== user.id) {
                // Autocorreção: Se o lead existe mas não tem user_id (ou está errado), atualizar
                await supabase
                    .from('leads')
                    .update({ user_id: user.id })
                    .eq('id', leadData.id);
            }

            if (!leadData) {
                throw new Error("Lead não encontrado");
            }

            // Buscar term_acceptance
            const { data: termData } = await supabase
                .from('term_acceptance')
                .select('id')
                .eq('lead_id', leadData.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Buscar pagamentos
            const { data: paymentsData } = await supabase
                .from('payments')
                .select('*')
                .eq('lead_id', leadData.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: true });

            const firstPayment = paymentsData?.find(p =>
                !p.metadata?.payment_part || p.metadata?.payment_part === 1
            );
            const secondPayment = paymentsData?.find(p =>
                p.metadata?.payment_part === 2
            );

            // Buscar formulário de consultoria
            const { data: consultationData } = await supabase
                .from('consultation_forms')
                .select('id')
                .eq('lead_id', leadData.id)
                .single();

            // Buscar reuniões
            const { data: meetingsData } = await supabase
                .from('meetings')
                .select('*')
                .eq('lead_id', leadData.id);

            const firstMeeting = meetingsData?.find(m => m.meeting_type === 'first');
            const secondMeeting = meetingsData?.find(m => m.meeting_type === 'second');

            // Buscar plano do cliente
            const { data: planData } = await supabase
                .from('client_plans')
                .select('*')
                .eq('lead_id', leadData.id)
                .single();

            // Montar dados do cliente
            const processedData = {
                leadId: leadData.id,
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                paymentCompleted: !!firstPayment,
                paymentId: firstPayment?.id || null,
                termAcceptanceId: termData?.id || null,
                consultationFormCompleted: !!consultationData,
                consultationFormId: consultationData?.id || null,
                firstMeetingScheduled: !!firstMeeting,
                firstMeetingCompleted: firstMeeting?.status === 'completed',
                firstMeetingDate: firstMeeting?.scheduled_date || null,
                planningStarted: !!planData,
                planStatus: planData?.status || null,
                secondPaymentCompleted: !!secondPayment,
                secondMeetingScheduled: !!secondMeeting,
                secondMeetingCompleted: secondMeeting?.status === 'completed',
                clientPlan: planData
            };

            const stages = determineStages(processedData);
            const currentStage = stages.find(s => s.isCurrent)?.stage || 1;

            setClientData({
                ...processedData,
                currentStage,
                stages
            });
        } catch (err: any) {
            console.error("Error fetching client data:", err);
            setError(err.message || "Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientData();
    }, []);

    return {
        clientData,
        loading,
        error,
        refetch: fetchClientData
    };
};
