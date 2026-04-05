// ⚔️ Excalibur — Tipos globais

export type EtapaLead =
  | 'Recebido'
  | 'Contato feito'
  | 'Agendado'
  | 'Compareceu'
  | 'Fechou'

export type Procedimento =
  | 'Implante'
  | 'Protocolo'
  | 'Prótese'
  | 'Estética'
  | 'Outro'

export type StatusPaciente = 'ativo' | 'inativo' | 'arquivado'

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'compareceu'
  | 'cancelado'
  | 'noshow'

export type StatusProposta = 'pendente' | 'aprovado' | 'negado' | 'pago'

export interface Lead {
  id: string
  nome: string
  telefone: string | null
  procedimento: Procedimento | null
  etapa: EtapaLead
  created_at: string
}

export interface Paciente {
  id: string
  lead_id: string | null
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  procedimento: Procedimento | null
  status: StatusPaciente
  observacoes: string | null
  created_at: string
}

export interface Agendamento {
  id: string
  paciente_id: string | null
  paciente_nome: string
  data: string
  hora: string
  procedimento: Procedimento | null
  status: StatusAgendamento
  observacoes: string | null
  created_at: string
}

export interface Proposta {
  id: string
  paciente_id: string | null
  paciente_nome: string
  procedimento: Procedimento | null
  valor_total: number
  entrada: number
  parcelas: number
  valor_parcela: number
  taxa_juros: number
  status: StatusProposta
  financeira: string | null
  created_at: string
}
