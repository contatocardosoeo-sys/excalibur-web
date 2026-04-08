import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(req: NextRequest) {
  const clinica_id = req.nextUrl.searchParams.get('clinica_id')
  const periodo = req.nextUrl.searchParams.get('periodo') || '30'
  const formato = req.nextUrl.searchParams.get('formato')

  if (!clinica_id) return NextResponse.json({ error: 'clinica_id obrigatório' }, { status: 400 })

  const dataLimite = new Date(Date.now() - parseInt(periodo) * 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('funil_diario')
    .select('*')
    .eq('clinica_id', clinica_id)
    .gte('data', dataLimite)
    .order('data', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (formato === 'csv') {
    const headers = ['data', 'investimento', 'leads', 'leads_respondidos', 'agendamentos', 'comparecimentos', 'fechamentos', 'faturamento', 'cpl', 'taxa_agendamento', 'taxa_comparecimento', 'taxa_fechamento', 'ticket_medio', 'cac']
    const rows = (data || []).map(r => headers.map(h => r[h] ?? '').join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="funil-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  const totais = (data || []).reduce((acc, d) => ({
    investimento: acc.investimento + Number(d.investimento || 0),
    leads: acc.leads + Number(d.leads || 0),
    leads_respondidos: acc.leads_respondidos + Number(d.leads_respondidos || 0),
    agendamentos: acc.agendamentos + Number(d.agendamentos || 0),
    comparecimentos: acc.comparecimentos + Number(d.comparecimentos || 0),
    fechamentos: acc.fechamentos + Number(d.fechamentos || 0),
    faturamento: acc.faturamento + Number(d.faturamento || 0),
  }), { investimento: 0, leads: 0, leads_respondidos: 0, agendamentos: 0, comparecimentos: 0, fechamentos: 0, faturamento: 0 })

  return NextResponse.json({ data, totais, periodo: parseInt(periodo) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clinica_id, data: dataInput, ...campos } = body

  if (!clinica_id) return NextResponse.json({ error: 'clinica_id obrigatório' }, { status: 400 })

  const dataFunil = dataInput || new Date().toISOString().split('T')[0]

  const { data: result, error } = await supabase
    .from('funil_diario')
    .upsert(
      { clinica_id, data: dataFunil, ...campos, updated_at: new Date().toISOString() },
      { onConflict: 'clinica_id,data' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await checarAlertas(clinica_id, result)

  return NextResponse.json({ success: true, data: result })
}

async function checarAlertas(clinica_id: string, funil: Record<string, number>) {
  const alertas: Array<{ clinica_id: string; tipo: string; nivel: number; titulo: string; descricao: string }> = []

  if (Number(funil.taxa_agendamento) < 30) {
    alertas.push({
      clinica_id,
      tipo: 'TAXA_AGENDAMENTO_BAIXA',
      nivel: 2,
      titulo: 'Taxa de agendamento abaixo de 30%',
      descricao: `Taxa atual: ${Number(funil.taxa_agendamento).toFixed(1)}%. Meta: 40%`,
    })
  }
  if (Number(funil.taxa_comparecimento) < 40) {
    alertas.push({
      clinica_id,
      tipo: 'TAXA_COMPARECIMENTO_BAIXA',
      nivel: 2,
      titulo: 'Taxa de comparecimento abaixo de 40%',
      descricao: `Taxa atual: ${Number(funil.taxa_comparecimento).toFixed(1)}%. Meta: 50%`,
    })
  }
  if (Number(funil.cpl) > 15) {
    alertas.push({
      clinica_id,
      tipo: 'CPL_ALTO',
      nivel: 1,
      titulo: 'CPL acima de R$15',
      descricao: `CPL atual: R$${Number(funil.cpl).toFixed(2)}. Meta: R$5`,
    })
  }

  if (alertas.length > 0) {
    await supabase.from('alertas_clinica').insert(alertas)
  }
}
