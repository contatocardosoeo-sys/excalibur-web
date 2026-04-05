// ⚔️ Excalibur CEO — API Métricas KPIs
// GET /api/ceo/metricas — retorna todos os KPIs calculados em tempo real
import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

interface KPIs {
  leads: {
    total: number
    hoje: number
    semana: number
    mes: number
  }
  agendamentos: {
    total: number
    hoje: number
    semana: number
    confirmados: number
    noshow: number
  }
  pacientes: {
    ativos: number
    inativos: number
    total: number
  }
  propostas: {
    total: number
    aprovadas: number
    pendentes: number
    negadas: number
    ticket_medio: number
  }
  conversao: {
    lead_para_agendamento: number
    agendamento_para_comparecimento: number
    comparecimento_para_fechamento: number
    taxa_geral: number
  }
  faturamento: {
    total_aprovado: number
    total_pago: number
    receita_mes: number
  }
  atualizado_em: string
}

export async function GET() {
  try {
    const agora = new Date()
    const hojeStr = agora.toISOString().split('T')[0]
    const inicioSemana = new Date(agora)
    inicioSemana.setDate(agora.getDate() - agora.getDay())
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

    // Queries paralelas para performance
    const [
      leadsRes,
      agendamentosRes,
      pacientesRes,
      propostasRes,
    ] = await Promise.all([
      supabase.from('leads').select('id, etapa, created_at'),
      supabase.from('agendamentos').select('id, status, data, created_at'),
      supabase.from('pacientes').select('id, status'),
      supabase.from('propostas').select('id, status, valor_total, created_at'),
    ])

    if (leadsRes.error) throw leadsRes.error
    if (agendamentosRes.error) throw agendamentosRes.error
    if (pacientesRes.error) throw pacientesRes.error
    if (propostasRes.error) throw propostasRes.error

    const leads = leadsRes.data ?? []
    const agendamentos = agendamentosRes.data ?? []
    const pacientes = pacientesRes.data ?? []
    const propostas = propostasRes.data ?? []

    // Leads KPIs
    const leadsHoje = leads.filter(l => l.created_at?.startsWith(hojeStr)).length
    const leadsSemana = leads.filter(l => new Date(l.created_at) >= inicioSemana).length
    const leadsMes = leads.filter(l => new Date(l.created_at) >= inicioMes).length

    // Agendamentos KPIs
    const agHoje = agendamentos.filter(a => a.data === hojeStr).length
    const agSemana = agendamentos.filter(a => new Date(a.data) >= inicioSemana).length
    const agConfirmados = agendamentos.filter(a => a.status === 'confirmado').length
    const agNoshow = agendamentos.filter(a => a.status === 'noshow').length

    // Pacientes KPIs
    const pacAtivos = pacientes.filter(p => p.status === 'ativo').length
    const pacInativos = pacientes.filter(p => p.status === 'inativo').length

    // Propostas KPIs
    const propAprovadas = propostas.filter(p => p.status === 'aprovado' || p.status === 'pago')
    const propPendentes = propostas.filter(p => p.status === 'pendente')
    const propNegadas = propostas.filter(p => p.status === 'negado')
    const ticketMedio = propAprovadas.length > 0
      ? propAprovadas.reduce((sum, p) => sum + (p.valor_total ?? 0), 0) / propAprovadas.length
      : 0

    // Conversão do funil
    const totalLeads = leads.length || 1
    const leadsAgendados = leads.filter(l =>
      l.etapa === 'Agendado' || l.etapa === 'Compareceu' || l.etapa === 'Fechou'
    ).length
    const leadsCompareceram = leads.filter(l =>
      l.etapa === 'Compareceu' || l.etapa === 'Fechou'
    ).length
    const leadsFecharam = leads.filter(l => l.etapa === 'Fechou').length

    const leadParaAgendamento = (leadsAgendados / totalLeads) * 100
    const agParaComparecimento = leadsAgendados > 0
      ? (leadsCompareceram / leadsAgendados) * 100
      : 0
    const compParaFechamento = leadsCompareceram > 0
      ? (leadsFecharam / leadsCompareceram) * 100
      : 0
    const taxaGeral = (leadsFecharam / totalLeads) * 100

    // Faturamento
    const totalAprovado = propAprovadas.reduce((sum, p) => sum + (p.valor_total ?? 0), 0)
    const totalPago = propostas
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + (p.valor_total ?? 0), 0)
    const receitaMes = propostas
      .filter(p =>
        (p.status === 'aprovado' || p.status === 'pago') &&
        new Date(p.created_at) >= inicioMes
      )
      .reduce((sum, p) => sum + (p.valor_total ?? 0), 0)

    const kpis: KPIs = {
      leads: {
        total: leads.length,
        hoje: leadsHoje,
        semana: leadsSemana,
        mes: leadsMes,
      },
      agendamentos: {
        total: agendamentos.length,
        hoje: agHoje,
        semana: agSemana,
        confirmados: agConfirmados,
        noshow: agNoshow,
      },
      pacientes: {
        ativos: pacAtivos,
        inativos: pacInativos,
        total: pacientes.length,
      },
      propostas: {
        total: propostas.length,
        aprovadas: propAprovadas.length,
        pendentes: propPendentes.length,
        negadas: propNegadas.length,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
      },
      conversao: {
        lead_para_agendamento: Math.round(leadParaAgendamento * 100) / 100,
        agendamento_para_comparecimento: Math.round(agParaComparecimento * 100) / 100,
        comparecimento_para_fechamento: Math.round(compParaFechamento * 100) / 100,
        taxa_geral: Math.round(taxaGeral * 100) / 100,
      },
      faturamento: {
        total_aprovado: totalAprovado,
        total_pago: totalPago,
        receita_mes: receitaMes,
      },
      atualizado_em: agora.toISOString(),
    }

    return NextResponse.json(kpis)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao calcular métricas'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
