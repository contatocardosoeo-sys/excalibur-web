import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(req: NextRequest) {
  const clinica_id = req.nextUrl.searchParams.get('clinica_id')
  if (!clinica_id) return NextResponse.json({ error: 'clinica_id obrigatório' }, { status: 400 })

  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const semanaAtual = getWeekString(new Date())

  const [
    { data: funnelMes },
    { data: funnelHoje },
    { data: adocao },
    { data: jornada },
    { data: metas },
    { data: alertas },
  ] = await Promise.all([
    supabase.from('funil_diario').select('*').eq('clinica_id', clinica_id).gte('data', inicioMes).order('data'),
    supabase.from('funil_diario').select('*').eq('clinica_id', clinica_id).eq('data', hoje).maybeSingle(),
    supabase.from('adocao_clinica').select('*').eq('clinica_id', clinica_id).eq('semana', semanaAtual).maybeSingle(),
    supabase.from('jornada_clinica').select('*').eq('clinica_id', clinica_id).maybeSingle(),
    supabase.from('metas_contrato').select('*').eq('clinica_id', clinica_id).maybeSingle(),
    supabase.from('alertas_clinica').select('*').eq('clinica_id', clinica_id).eq('resolvido', false).order('created_at', { ascending: false }),
  ])

  const totalMes = (funnelMes || []).reduce((acc, d) => ({
    investimento: acc.investimento + Number(d.investimento || 0),
    leads: acc.leads + Number(d.leads || 0),
    leads_respondidos: acc.leads_respondidos + Number(d.leads_respondidos || 0),
    agendamentos: acc.agendamentos + Number(d.agendamentos || 0),
    comparecimentos: acc.comparecimentos + Number(d.comparecimentos || 0),
    fechamentos: acc.fechamentos + Number(d.fechamentos || 0),
    faturamento: acc.faturamento + Number(d.faturamento || 0),
  }), { investimento: 0, leads: 0, leads_respondidos: 0, agendamentos: 0, comparecimentos: 0, fechamentos: 0, faturamento: 0 })

  const metricas = {
    ...totalMes,
    cpl: totalMes.leads > 0 ? totalMes.investimento / totalMes.leads : 0,
    taxa_agendamento: totalMes.leads_respondidos > 0 ? (totalMes.agendamentos / totalMes.leads_respondidos) * 100 : 0,
    taxa_comparecimento: totalMes.agendamentos > 0 ? (totalMes.comparecimentos / totalMes.agendamentos) * 100 : 0,
    taxa_fechamento: totalMes.comparecimentos > 0 ? (totalMes.fechamentos / totalMes.comparecimentos) * 100 : 0,
    ticket_medio: totalMes.fechamentos > 0 ? totalMes.faturamento / totalMes.fechamentos : 0,
    cac: totalMes.fechamentos > 0 ? totalMes.investimento / totalMes.fechamentos : 0,
    roi: totalMes.investimento > 0 ? ((totalMes.faturamento - totalMes.investimento) / totalMes.investimento) * 100 : 0,
  }

  const versus = metas ? {
    cpl: { atual: metricas.cpl, meta: Number(metas.meta_cpl), ok: metricas.cpl <= Number(metas.meta_cpl) },
    agendamento: { atual: metricas.taxa_agendamento, meta: Number(metas.meta_agendamento), ok: metricas.taxa_agendamento >= Number(metas.meta_agendamento) },
    comparecimento: { atual: metricas.taxa_comparecimento, meta: Number(metas.meta_comparecimento), ok: metricas.taxa_comparecimento >= Number(metas.meta_comparecimento) },
    fechamento: { atual: metricas.taxa_fechamento, meta: Number(metas.meta_fechamento), ok: metricas.taxa_fechamento >= Number(metas.meta_fechamento) },
    ticket_medio: { atual: metricas.ticket_medio, meta: Number(metas.meta_ticket_medio), ok: metricas.ticket_medio >= Number(metas.meta_ticket_medio) },
  } : null

  return NextResponse.json({
    metricas,
    versus,
    hoje: funnelHoje,
    historico: funnelMes,
    adocao,
    jornada,
    alertas: alertas || [],
  })
}

function getWeekString(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}
