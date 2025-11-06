export interface Dependente {
  nome: string;
  idade: string;
  grau_parentesco: string;
}

export interface ConsultationFormData {
  // DADOS PESSOAIS
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento?: string;
  cidade_residencia?: string;
  estado_civil?: string;
  possui_filhos: boolean;
  dependentes?: Dependente[];
  
  // OBJETIVO PRINCIPAL
  objetivo_principal?: string;
  objetivo_outro?: string;
  tipo_visto_desejado?: string;
  periodo_estimado?: string;
  pretende_ir_sozinho?: boolean;
  pretende_ir_com?: string;
  
  // PERFIL PROFISSIONAL E ACADÊMICO
  formacao_academica?: string;
  area_formacao_atuacao?: string;
  cargo_atual?: string;
  tempo_cargo_atual?: string;
  nivel_ingles?: string;
  
  // SITUAÇÃO FINANCEIRA E INVESTIMENTO
  renda_mensal?: string;
  possui_bens?: boolean;
  descricao_bens?: string;
  possui_empresa_cnpj?: boolean;
  ramo_faturamento_empresa?: string;
  investimento_disposto?: string;
  fundos_comprovaveis?: string;
  interesse_dolarizar?: string;
  
  // HISTÓRICO MIGRATÓRIO
  ja_teve_visto_eua?: boolean;
  tipo_visto_anterior?: string;
  data_visto_anterior?: string;
  ja_teve_visto_negado?: boolean;
  motivo_visto_negado?: string;
  ja_viajou_eua?: boolean;
  detalhes_viagem_eua?: string;
  ja_ficou_ilegal_eua?: boolean;
  possui_parentes_eua?: boolean;
  detalhes_parentes_eua?: string;
  
  // INTERESSES EDUCACIONAIS
  interesse_educacional?: string;
  interesse_educacional_outro?: string;
  possui_instituicao_mente?: boolean;
  nome_instituicao?: string;
  modalidade_curso?: string;
  busca_bolsa_financiamento?: string;
  
  // NETWORK E OPORTUNIDADES
  conhece_palestrante?: boolean;
  detalhes_palestrante?: string;
  interesse_participar_eventos?: string;
  
  // EXPECTATIVAS E MOTIVAÇÃO
  expectativas?: string[];
  expectativas_outro?: string;
  como_conheceu?: string;
  como_conheceu_outro?: string;
  
  // DECLARAÇÃO FINAL
  data_declaracao?: string;
  assinatura_digital?: string;
}

export interface ConsultationFormSubmission extends ConsultationFormData {
  lead_id: string;
  payment_id: string;
}

