import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, User, Mail, Phone, Calendar, MapPin, Briefcase, DollarSign, GraduationCap, Globe, Users, FileText } from "lucide-react";

interface ConsultationFormDetails {
  id: string;
  lead_id: string;
  payment_id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string | null;
  cidade_residencia: string | null;
  estado_civil: string | null;
  possui_filhos: boolean | null;
  dependentes: Array<{ nome: string; idade: string; grau_parentesco: string }> | null;
  objetivo_principal: string | null;
  objetivo_outro: string | null;
  tipo_visto_desejado: string | null;
  periodo_estimado: string | null;
  pretende_ir_sozinho: boolean | null;
  pretende_ir_com: string | null;
  formacao_academica: string | null;
  area_formacao_atuacao: string | null;
  cargo_atual: string | null;
  tempo_cargo_atual: string | null;
  nivel_ingles: string | null;
  renda_mensal: string | null;
  possui_bens: boolean | null;
  descricao_bens: string | null;
  possui_empresa_cnpj: boolean | null;
  ramo_faturamento_empresa: string | null;
  investimento_disposto: string | null;
  fundos_comprovaveis: string | null;
  interesse_dolarizar: string | null;
  ja_teve_visto_eua: boolean | null;
  tipo_visto_anterior: string | null;
  data_visto_anterior: string | null;
  ja_teve_visto_negado: boolean | null;
  motivo_visto_negado: string | null;
  ja_viajou_eua: boolean | null;
  detalhes_viagem_eua: string | null;
  ja_ficou_ilegal_eua: boolean | null;
  possui_parentes_eua: boolean | null;
  detalhes_parentes_eua: string | null;
  interesse_educacional: string | null;
  interesse_educacional_outro: string | null;
  possui_instituicao_mente: boolean | null;
  nome_instituicao: string | null;
  modalidade_curso: string | null;
  busca_bolsa_financiamento: string | null;
  conhece_palestrante: boolean | null;
  detalhes_palestrante: string | null;
  interesse_participar_eventos: string | null;
  expectativas: string[] | null;
  expectativas_outro: string | null;
  como_conheceu: string | null;
  como_conheceu_outro: string | null;
  assinatura_digital: string | null;
  data_declaracao: string | null;
  created_at: string;
}

const ConsultationFormDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ConsultationFormDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Adicionar classe ao body para remover fundo azul
    document.body.classList.add('consultation-form-details-page');

    const fetchFormData = async () => {
      if (!id) {
        setError("ID do formulário não fornecido");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("consultation_forms")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        setFormData(data);
      } catch (err: any) {
        console.error("Erro ao buscar formulário:", err);
        setError(err.message || "Erro ao carregar dados do formulário");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();

    return () => {
      // Remover classe quando sair da página
      document.body.classList.remove('consultation-form-details-page');
    };
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatBoolean = (value: boolean | null) => {
    if (value === null) return "N/A";
    return value ? "Sim" : "Não";
  };

  const formatValue = (value: string | null | undefined) => {
    if (!value || value.trim() === "") return "N/A";
    return value;
  };

  const formatArray = (arr: string[] | null) => {
    if (!arr || arr.length === 0) return "N/A";
    return arr.join(", ");
  };

  const formatSelectValue = (value: string | null) => {
    if (!value) return "N/A";
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" style={{ backgroundColor: '#ffffff' }}>
        <Card className="max-w-2xl w-full border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error || "Formulário não encontrado"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Voltar para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/dashboard/users")}
              variant="outline"
              className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalhes do Formulário</h1>
              <p className="text-gray-600 mt-1">
                Enviado em {formatDateTime(formData.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: DADOS PESSOAIS */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              DADOS PESSOAIS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                <p className="text-gray-900 mt-1">{formatValue(formData.nome_completo)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  E-mail
                </label>
                <p className="text-gray-900 mt-1">{formatValue(formData.email)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Telefone
                </label>
                <p className="text-gray-900 mt-1">{formatValue(formData.telefone)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </label>
                <p className="text-gray-900 mt-1">{formatDate(formData.data_nascimento)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Cidade e País de Residência
                </label>
                <p className="text-gray-900 mt-1">{formatValue(formData.cidade_residencia)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Estado Civil</label>
                <p className="text-gray-900 mt-1">{formatSelectValue(formData.estado_civil)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Possui Filhos</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.possui_filhos)}</p>
              </div>
            </div>

            {formData.possui_filhos && formData.dependentes && formData.dependentes.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-700 mb-4 block">Dependentes</label>
                <div className="space-y-3">
                  {formData.dependentes.map((dep, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Nome</label>
                          <p className="text-gray-900 mt-1">{formatValue(dep.nome)}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Idade</label>
                          <p className="text-gray-900 mt-1">{formatValue(dep.idade)}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Grau de Parentesco</label>
                          <p className="text-gray-900 mt-1">{formatValue(dep.grau_parentesco)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 2: OBJETIVO PRINCIPAL */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              OBJETIVO PRINCIPAL
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Objetivo Principal</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.objetivo_principal)}
                  </Badge>
                </p>
              </div>
              {formData.objetivo_principal === "outro" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Especifique</label>
                  <p className="text-gray-900 mt-1">{formatValue(formData.objetivo_outro)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Tipo de Visto Desejado</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.tipo_visto_desejado)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Período Estimado</label>
                <p className="text-gray-900 mt-1">{formatSelectValue(formData.periodo_estimado)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Pretende Ir</label>
                <p className="text-gray-900 mt-1">
                  {formData.pretende_ir_sozinho ? "Sozinho(a)" : formatValue(formData.pretende_ir_com)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: PERFIL PROFISSIONAL E ACADÊMICO */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              PERFIL PROFISSIONAL E ACADÊMICO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Formação Acadêmica</label>
                <p className="text-gray-900 mt-1">{formatSelectValue(formData.formacao_academica)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Área de Formação/Atuação</label>
                <p className="text-gray-900 mt-1">{formatValue(formData.area_formacao_atuacao)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Cargo Atual</label>
                <p className="text-gray-900 mt-1">{formatValue(formData.cargo_atual)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Nível de Inglês</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.nivel_ingles)}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: SITUAÇÃO FINANCEIRA */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              SITUAÇÃO FINANCEIRA E INVESTIMENTO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Renda Mensal</label>
                <p className="text-gray-900 mt-1">{formatValue(formData.renda_mensal)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Possui Bens</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.possui_bens)}</p>
              </div>
              {formData.possui_bens && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Descrição dos Bens</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{formatValue(formData.descricao_bens)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Possui Empresa/CNPJ</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.possui_empresa_cnpj)}</p>
              </div>
              {formData.possui_empresa_cnpj && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Ramo de Atuação e Faturamento</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{formatValue(formData.ramo_faturamento_empresa)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Investimento Disposto</label>
                <p className="text-gray-900 mt-1">{formatSelectValue(formData.investimento_disposto)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Fundos Comprováveis</label>
                <p className="text-gray-900 mt-1">{formatSelectValue(formData.fundos_comprovaveis)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Interesse em Dolarizar</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.interesse_dolarizar)}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 5: HISTÓRICO MIGRATÓRIO */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              HISTÓRICO MIGRATÓRIO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Já Teve Visto para os EUA</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.ja_teve_visto_eua)}</p>
              </div>
              {formData.ja_teve_visto_eua && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tipo de Visto Anterior</label>
                    <p className="text-gray-900 mt-1">{formatValue(formData.tipo_visto_anterior)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Data do Visto Anterior</label>
                    <p className="text-gray-900 mt-1">{formatDate(formData.data_visto_anterior)}</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Já Teve Visto Negado</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.ja_teve_visto_negado)}</p>
              </div>
              {formData.ja_teve_visto_negado && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Motivo da Negação</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{formatValue(formData.motivo_visto_negado)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Já Viajou para os EUA</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.ja_viajou_eua)}</p>
              </div>
              {formData.ja_viajou_eua && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Detalhes da Viagem</label>
                  <p className="text-gray-900 mt-1">{formatValue(formData.detalhes_viagem_eua)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Já Ficou Ilegalmente nos EUA</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.ja_ficou_ilegal_eua)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Possui Parentes nos EUA</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.possui_parentes_eua)}</p>
              </div>
              {formData.possui_parentes_eua && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Detalhes dos Parentes</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{formatValue(formData.detalhes_parentes_eua)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 6: INTERESSES EDUCACIONAIS */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              INTERESSES EDUCACIONAIS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Interesse Educacional</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.interesse_educacional)}
                  </Badge>
                </p>
              </div>
              {formData.interesse_educacional === "outro" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Especifique</label>
                  <p className="text-gray-900 mt-1">{formatValue(formData.interesse_educacional_outro)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Possui Instituição em Mente</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.possui_instituicao_mente)}</p>
              </div>
              {formData.possui_instituicao_mente && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Nome da Instituição</label>
                  <p className="text-gray-900 mt-1">{formatValue(formData.nome_instituicao)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Modalidade de Curso</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.modalidade_curso)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Busca Bolsa/Financiamento</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.busca_bolsa_financiamento)}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 7: NETWORK E OPORTUNIDADES */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              NETWORK E OPORTUNIDADES
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Conhece Palestrante</label>
                <p className="text-gray-900 mt-1">{formatBoolean(formData.conhece_palestrante)}</p>
              </div>
              {formData.conhece_palestrante && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Detalhes do Palestrante</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{formatValue(formData.detalhes_palestrante)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Interesse em Participar de Eventos</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.interesse_participar_eventos)}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 8: EXPECTATIVAS E MOTIVAÇÃO */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              EXPECTATIVAS E MOTIVAÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Expectativas</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.expectativas && formData.expectativas.length > 0 ? (
                    formData.expectativas.map((exp, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                        {exp}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </div>
              </div>
              {formData.expectativas?.includes("outro") && formData.expectativas_outro && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Outra Expectativa</label>
                  <p className="text-gray-900 mt-1">{formatValue(formData.expectativas_outro)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Como Conheceu</label>
                <p className="text-gray-900 mt-1">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {formatSelectValue(formData.como_conheceu)}
                  </Badge>
                </p>
              </div>
              {formData.como_conheceu === "outro" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Especifique</label>
                  <p className="text-gray-900 mt-1">{formatValue(formData.como_conheceu_outro)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 9: DECLARAÇÃO */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-gray-900">DECLARAÇÃO FINAL</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Assinatura Digital</label>
                <p className="text-gray-900 mt-1">{formatValue(formData.assinatura_digital)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Data da Declaração</label>
                <p className="text-gray-900 mt-1">{formatDate(formData.data_declaracao)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Técnicas */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg text-gray-900">Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <label className="text-xs font-medium text-gray-600">ID do Formulário</label>
                <p className="text-gray-900 mt-1 font-mono text-xs">{formData.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">ID do Lead</label>
                <p className="text-gray-900 mt-1 font-mono text-xs">{formData.lead_id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">ID do Pagamento</label>
                <p className="text-gray-900 mt-1 font-mono text-xs">{formatValue(formData.payment_id)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsultationFormDetails;

