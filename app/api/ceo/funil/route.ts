import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, etapa, created_at')

    if (error) throw error

    const ETAPAS = ['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou']

    const funil = ETAPAS.map((etapa, i) => {
      const count = (leads ?? []).filter(l => l.etapa === etapa).length
      const prevCount = i === 0
        ? (leads ?? []).length
        : (leads ?? []).filter(l => ETAPAS.indexOf(l.etapa) >= i - 1).length
      const taxa = prevCount > 0 ? (count / prevCount) * 100 : 0

      return { etapa, count, taxa: Math.round(taxa * 100) / 100 }
    })

    const total = (leads ?? []).length
    const fecharam = (leads ?? []).filter(l => l.etapa === 'Fechou').length

    return NextResponse.json({
      funil,
      total_leads: total,
      total_fechamentos: fecharam,
      taxa_geral: total > 0 ? Math.round((fecharam / total) * 10000) / 100 : 0,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao calcular funil'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
