// ⚔️ Excalibur — API Pacotes de Procedimentos
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const clinicaId = new URL(req.url).searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const { data, error } = await supabase.from('procedimentos_pacotes').select('*').eq('clinica_id', clinicaId).order('nome')
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ pacotes: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, nome, descricao, procedimentos, preco_original, preco_pacote, desconto_percentual, sessoes, validade_dias } = body as Record<string, unknown>
    if (!nome || !preco_pacote) return NextResponse.json({ erro: 'nome e preco_pacote são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('procedimentos_pacotes')
      .insert({ clinica_id, nome, descricao, procedimentos: procedimentos || [], preco_original, preco_pacote, desconto_percentual, sessoes: sessoes || 1, validade_dias: validade_dias || 365 })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ pacote: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
