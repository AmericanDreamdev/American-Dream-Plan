import { useState } from "react";
import { Meeting } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, CheckCircle, XCircle, Clock, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { CalendlyEmbed } from "../consultation/CalendlyEmbed";
import { useNavigate } from "react-router-dom";

interface MeetingManagerProps {
  leadId: string;
  firstMeeting: Meeting | null;
  secondMeeting: Meeting | null;
  onUpdate?: () => void;
  leadName?: string;
  leadEmail?: string;
}

export const MeetingManager = ({ leadId, firstMeeting, secondMeeting, onUpdate, leadName, leadEmail }: MeetingManagerProps) => {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedMeetingType, setSelectedMeetingType] = useState<'first' | 'second'>('first');
  const [scheduledDate, setScheduledDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Agendada", className: "bg-blue-500 text-white", icon: Clock },
      completed: { label: "Realizada", className: "bg-green-500 text-white", icon: CheckCircle },
      cancelled: { label: "Cancelada", className: "bg-red-500 text-white", icon: XCircle },
      no_show: { label: "Não Compareceu", className: "bg-orange-500 text-white", icon: XCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definida";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleScheduleMeeting = () => {
    const meeting = selectedMeetingType === 'first' ? firstMeeting : secondMeeting;
    if (selectedMeetingType === 'first' && !meeting) {
      // First meeting is scheduled via the public FormsPage (Calendly). Open that page instead.
      // We'll navigate admins to the Forms page where Calendly is embedded.
      navigate(`/dashboard/forms?lead_id=${leadId}`);
      return;
    }

    if (meeting) {
      setScheduledDate(meeting.scheduled_date || "");
      setMeetingLink(meeting.meeting_link || "");
      setNotes(meeting.notes || "");
    } else {
      setScheduledDate("");
      setMeetingLink("");
      setNotes("");
    }
    setShowScheduleDialog(true);
  };

  const saveMeeting = async () => {
    setLoading(true);
    try {
      const meeting = selectedMeetingType === 'first' ? firstMeeting : secondMeeting;

      // For first meeting we don't allow creating via admin (it's done via FormsPage). Only allow updating existing.
      if (selectedMeetingType === 'first' && !meeting) {
        toast({ title: "Agendamento via formulário", description: "A 1ª reunião é agendada via formulário/Calendly. Abra o FormsPage para agendar." });
        setLoading(false);
        return;
      }

      const meetingData = {
        lead_id: leadId,
        meeting_type: selectedMeetingType,
        scheduled_date: scheduledDate || null,
        meeting_link: meetingLink || null,
        notes: notes || null,
        status: 'scheduled',
      };

      if (meeting) {
        // Atualizar reunião existente
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meeting.id);

        if (error) throw error;
        toast({
          title: "Reunião atualizada!",
          description: "As informações da reunião foram atualizadas com sucesso.",
        });
      } else {
        // Criar nova reunião
        const { error } = await supabase
          .from('meetings')
          .insert(meetingData);

        if (error) throw error;
        toast({
          title: "Reunião agendada!",
          description: "A reunião foi agendada com sucesso.",
        });
      }

      setShowScheduleDialog(false);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Erro ao salvar reunião:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a reunião.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (meetingId: string, meetingType: 'first' | 'second') => {
    setLoadingComplete(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
        })
        .eq('id', meetingId);

      if (error) throw error;
      
      toast({
        title: "Reunião concluída!",
        description: "A reunião foi marcada como realizada.",
      });

      // Se for a primeira reunião, enviar email com link da segunda parcela automaticamente
      if (meetingType === 'first') {
        try {
          const response = await supabase.functions.invoke('send-second-payment-link', {
            body: { lead_id: leadId }
          });

          if (response.error) {
            console.error('Erro ao enviar email da segunda parcela (Detalhes):', response.error);
            toast({
              title: "Atenção: Email não enviado",
              description: "A reunião foi marcada, mas o email automático falhou. Por favor, envie o link da segunda parcela manualmente.",
              variant: "default",
              className: "bg-yellow-50 border-yellow-200 text-yellow-800",
            });
          } else {
            toast({
              title: "Email enviado!",
              description: "Link da segunda parcela enviado automaticamente para o cliente.",
            });
          }
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          toast({
            title: "Aviso",
            description: "Reunião marcada. Envie o link da segunda parcela manualmente.",
          });
        }
      }

      // Se for a segunda reunião, enviar email de apresentação do plano
      if (meetingType === 'second') {
        try {
          const response = await supabase.functions.invoke('send-plan-presentation-email', {
            body: { lead_id: leadId }
          });

          if (response.error) {
            console.error('Erro ao enviar email de apresentação do plano:', response.error);
            toast({
              title: "Atenção: Email não enviado",
              description: "A reunião foi marcada, mas o email automático falhou. O cliente pode verificar o plano no dashboard.",
              variant: "default",
              className: "bg-yellow-50 border-yellow-200 text-yellow-800",
            });
          } else {
            toast({
              title: "Email enviado!",
              description: "Email de apresentação do plano enviado automaticamente para o cliente.",
            });
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de apresentação:', emailError);
          toast({
            title: "Aviso",
            description: "Reunião marcada. O cliente pode acessar o plano pelo dashboard.",
          });
        }
      }
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Erro ao marcar reunião como concluída:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a reunião.",
        variant: "destructive",
      });
    } finally {
      setLoadingComplete(false);
    }
  };

  const cancelMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'cancelled' })
        .eq('id', meetingId);

      if (error) throw error;
      
      toast({
        title: "Reunião cancelada",
        description: "A reunião foi cancelada.",
      });
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Erro ao cancelar reunião:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar a reunião.",
        variant: "destructive",
      });
    }
  };

  const [showCalendlyDialog, setShowCalendlyDialog] = useState(false);

  const renderMeetingCard = (meeting: Meeting | null, type: 'first' | 'second') => {
    const title = type === 'first' ? '1ª Reunião (Estratégica)' : '2ª Reunião (Apresentação do Plano)';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {title}
            </CardTitle>
            {meeting && getStatusBadge(meeting.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {meeting ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Data Agendada</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(meeting.scheduled_date)}
                    </p>
                  </div>
                </div>

                {meeting.completed_date && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-gray-500">Data Realizada</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(meeting.completed_date)}
                      </p>
                    </div>
                  </div>
                )}

                {meeting.meeting_link && (
                  <div className="flex items-start gap-2">
                    <Video className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-500">Link da Reunião</p>
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline break-all"
                      >
                        Abrir link
                      </a>
                    </div>
                  </div>
                )}

                {meeting.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-500">Anotações</p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {meeting.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMeetingType(type);
                    handleScheduleMeeting();
                  }}
                >
                  Editar
                </Button>
                {meeting.status === 'scheduled' && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => markAsCompleted(meeting.id, type)}
                      disabled={loadingComplete}
                    >
                      {loadingComplete ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Marcar como Realizada"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelMeeting(meeting.id)}
                      disabled={loadingComplete}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">Nenhuma reunião agendada</p>
              {type === 'first' ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">A 1ª reunião é agendada via formulário público (Calendly) integrado no fluxo do cliente.</p>
                  <div className="flex items-center justify-center">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboard/forms?lead_id=${leadId}`)}
                    >
                      Ir para Formulário (Calendly)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedMeetingType(type);
                      handleScheduleMeeting();
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Reunião
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCalendlyDialog(true)}
                  >
                    Agendar via Calendly
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderMeetingCard(firstMeeting, 'first')}
        {renderMeetingCard(secondMeeting, 'second')}
      </div>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMeetingType === 'first' ? '1ª Reunião (Estratégica)' : '2ª Reunião (Apresentação do Plano)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Data e Hora</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_link">Link da Reunião (Calendly/Google Meet)</Label>
              <Input
                id="meeting_link"
                type="url"
                placeholder="https://..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Anotações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre a reunião..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveMeeting} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCalendlyDialog} onOpenChange={setShowCalendlyDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agendar via Calendly</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <CalendlyEmbed
              url={undefined}
              prefill={{
                name: leadName || undefined,
                email: leadEmail || undefined,
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendlyDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

