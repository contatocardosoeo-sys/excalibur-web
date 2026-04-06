// =============================================
// EXCALIBUR — Database Types (Multi-Tenant)
// Baseado na engenharia reversa do Nexus Atemporal
// =============================================

export interface Clinica {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: Record<string, string>
  logo_url: string | null
  plano: 'starter' | 'professional' | 'premium' | 'enterprise'
  ativo: boolean
  configuracoes: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PipelineEstagio {
  id: string
  clinica_id: string
  nome: string
  tipo: 'leads' | 'oportunidades'
  ordem: number
  probabilidade: number
  cor: string
  ativo: boolean
  created_at: string
}

export interface Oportunidade {
  id: string
  clinica_id: string
  lead_id: string | null
  titulo: string
  valor: number
  probabilidade: number
  estagio_id: string | null
  estagio: string
  vendedor_id: string | null
  procedimento: string | null
  origem: string
  data_previsao_fechamento: string | null
  data_fechamento: string | null
  motivo_perda: string | null
  observacoes: string | null
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Atividade {
  id: string
  clinica_id: string
  lead_id: string
  oportunidade_id: string | null
  tipo: 'ligacao' | 'email' | 'whatsapp' | 'reuniao' | 'nota' | 'tarefa' | 'sistema' | 'follow_up'
  titulo: string
  descricao: string | null
  status: 'pendente' | 'concluida' | 'cancelada' | 'atrasada'
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  data_agendada: string | null
  data_conclusao: string | null
  responsavel_id: string | null
  responsavel_nome: string | null
  duracao_minutos: number | null
  resultado: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PropostaV2 {
  id: string
  clinica_id: string
  numero: string
  lead_id: string | null
  oportunidade_id: string | null
  paciente_nome: string
  paciente_cpf: string | null
  paciente_telefone: string | null
  procedimentos: PropostaProcedimento[]
  valor_total: number
  desconto_percentual: number
  desconto_valor: number
  valor_final: number
  entrada: number
  parcelas: number
  valor_parcela: number
  forma_pagamento: string
  financeira: string | null
  taxa_juros: number
  valor_financiado: number
  status: 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada' | 'expirada' | 'cancelada'
  validade: string | null
  vendedor_id: string | null
  vendedor_nome: string | null
  observacoes: string | null
  condicoes: string | null
  assinatura_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PropostaProcedimento {
  nome: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  descricao?: string
}

export interface EquipeMembro {
  id: string
  clinica_id: string
  nome: string
  email: string
  telefone: string | null
  cargo: string
  role: 'admin' | 'gerente' | 'vendedor' | 'membro' | 'biomedico' | 'dentista' | 'recepcionista'
  avatar_url: string | null
  ativo: boolean
  meta_mensal: number
  comissao_percentual: number
  unidades: string[]
  created_at: string
  updated_at: string
}

export interface Comissao {
  id: string
  clinica_id: string
  membro_id: string
  proposta_id: string | null
  valor_venda: number
  percentual: number
  valor_comissao: number
  status: 'pendente' | 'aprovada' | 'paga' | 'cancelada'
  data_pagamento: string | null
  created_at: string
}

export interface Meta {
  id: string
  clinica_id: string
  titulo: string
  tipo: 'vendas' | 'leads' | 'agendamentos' | 'faturamento' | 'conversao' | 'custom'
  periodo: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual'
  valor_meta: number
  valor_atual: number
  unidade: string
  responsavel_id: string | null
  data_inicio: string
  data_fim: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CampanhaVendas {
  id: string
  clinica_id: string
  nome: string
  descricao: string | null
  tipo: string
  status: 'rascunho' | 'ativa' | 'pausada' | 'encerrada'
  data_inicio: string | null
  data_fim: string | null
  orcamento: number
  receita_gerada: number
  leads_gerados: number
  conversoes: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface HistoricoLead {
  id: string
  clinica_id: string
  lead_id: string
  tipo: 'estagio_alterado' | 'nota' | 'atividade' | 'proposta' | 'sistema' | 'whatsapp' | 'email' | 'ligacao'
  titulo: string
  descricao: string | null
  autor: string
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  created_at: string
}

// =============================================
// Dashboard Vendas KPIs (computed, not a table)
// =============================================
export interface VendasDashboardKPIs {
  vendas_mes: number
  ticket_medio: number
  taxa_conversao: number
  pipeline_ativo: number
  pipeline_leads_count: number
  forecast: number
  ciclo_vendas_dias: number
  meta_mensal: number
  percentual_meta: number
}

export interface FunilConversao {
  estagio: string
  quantidade: number
  percentual: number
}

// =============================================
// Simulador de Crédito (Excalibur Pay)
// =============================================
export interface SimulacaoCredito {
  valor_total: number
  entrada: number
  parcelas: number
  taxa_juros: number
  valor_parcela: number
  valor_financiado: number
  custo_total: number
  financeira: string
}

// Clinica ID padrão para desenvolvimento
export const CLINICA_DEMO_ID = '00000000-0000-0000-0000-000000000001'
