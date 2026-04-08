// ⚔️ Excalibur — API Status de Agenda (configuráveis)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const clinicaId = new URL(req.url).searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const { data, error } = await supabase.from('status_agenda').select('*').eq('clinica_id', clinicaId).order('ordem')
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ status: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, nome, cor, icone, ordem, permite_reagendar, conta_como_noshow } = body as Record<string, unknown>
    if (!nome) return NextResponse.json({ erro: 'nome obrigatório' }, { status: 400 })

    const { data, error } = await supabase
      .from('status_agenda')
      .insert({ clinica_id, nome, cor: cor || '#6b7280', icone, ordem: ordem || 0, permite_reagendar: permite_reagendar !== false, conta_como_noshow: conta_como_noshow || false })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ status: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body as Record<string, unknown>
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabase.from('status_agenda').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ status: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
