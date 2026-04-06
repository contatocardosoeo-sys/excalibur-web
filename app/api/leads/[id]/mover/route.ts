import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

const ETAPAS_VALIDAS = ['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { etapa } = body as { etapa: string }

    if (!etapa || !ETAPAS_VALIDAS.includes(etapa)) {
      return NextResponse.json(
        { erro: `Etapa inválida. Válidas: ${ETAPAS_VALIDAS.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ etapa })
      .eq('id', id)
      .select('id, nome, etapa')
      .single()

    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data, mensagem: `Lead movido para ${etapa}` })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao mover lead'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
