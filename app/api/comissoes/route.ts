// ⚔️ Excalibur — API Comissões
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const membroId = searchParams.get('membro_id')
    const status = searchParams.get('status')

    let query = supabase.from('comissoes').select('*').eq('clinica_id', clinicaId).order('created_at', { ascending: false })
    if (membroId) query = query.eq('membro_id', membroId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    const todas = data || []
    const totalPendente = todas.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor_comissao), 0)
    const totalPago = todas.filter(c => c.status === 'paga').reduce((s, c) => s + Number(c.valor_comissao), 0)

    return NextResponse.json({
      comissoes: data,
      kpis: { total_pendente: Math.round(totalPendente * 100) / 100, total_pago: Math.round(totalPago * 100) / 100, total_registros: todas.length },
    })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, membro_id, proposta_id, valor_venda, percentual } = body as Record<string, unknown>
    if (!membro_id || !valor_venda || !percentual) return NextResponse.json({ erro: 'membro_id, valor_venda e percentual são obrigatórios' }, { status: 400 })

    const valorComissao = Number(valor_venda) * (Number(percentual) / 100)

    const { data, error } = await supabase
      .from('comissoes')
      .insert({ clinica_id, membro_id, proposta_id, valor_venda, percentual, valor_comissao: Math.round(valorComissao * 100) / 100 })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ comissao: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, data_pagamento } = body as Record<string, unknown>
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (data_pagamento) updates.data_pagamento = data_pagamento
    if (status === 'paga' && !data_pagamento) updates.data_pagamento = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.from('comissoes').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ comissao: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
