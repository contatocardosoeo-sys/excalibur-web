import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ETAPA_MAP: Record<string, string> = {
  'Recepção': 'RECEPCAO',
  'Mapeamento': 'MAPEAMENTO',
  'Explicação': 'EXPLICACAO',
  'Agendamento': 'AGENDAMENTO',
  'Agendando': 'AGENDANDO',
  'Confirmação': 'CONFIRMACAO',
  'REAGENDAMENTO': 'REAGENDAMENTO',
  'LISTA FRIA': 'LISTA_FRIA',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'token obrigatorio' }, { status: 400 })
    }

    const { data: conexao } = await supabase
      .from('wascript_connections')
      .select('clinica_id, modo')
      .eq('token', token)
      .eq('ativo', true)
      .single()

    if (!conexao) {
      return NextResponse.json({ error: 'token invalido' }, { status: 404 })
    }

    const { clinica_id, modo } = conexao
    const phone = (body.phone || body.numero || '').replace(/\D/g, '')
    const nome = body.nome || body.name || null
    const etiqueta = body.etiqueta || body.label || null
    const evento = body.evento || body.event || 'Mensagem'

    if (!phone) {
      return NextResponse.json({ error: 'phone obrigatorio' }, { status: 400 })
    }

    const etapaRaw = etiqueta || evento
    const etapa = ETAPA_MAP[etapaRaw] || 'RECEPCAO'

    const { data: lead, error } = await supabase
      .from('whatsapp_leads')
      .upsert({
        clinica_id,
        phone,
        nome,
        etapa,
        etiqueta,
        ultimo_contato: new Date().toISOString(),
        dados: body,
      }, { onConflict: 'clinica_id,phone' })
      .select()
      .single()

    if (error) {
      console.error('[WASCRIPT WEBHOOK]', error)
      return NextResponse.json({ error: 'erro ao salvar lead' }, { status: 500 })
    }

    // Sync com tabela leads se externo
    if (modo === 'externo') {
      const { error: leadsErr } = await supabase
        .from('leads')
        .upsert({
          clinica_id,
          telefone: phone,
          nome: nome || phone,
          etapa: etapa === 'RECEPCAO' ? 'Recebido' : etapa === 'AGENDAMENTO' ? 'Agendado' : 'Contato feito',
          procedimento: 'Implante',
        }, { onConflict: 'clinica_id,telefone' })
      if (leadsErr) console.error('[WASCRIPT] sync leads:', leadsErr.message)
    }

    console.log(`[WASCRIPT] ${evento} | ${phone} | ${nome} | clinica: ${clinica_id}`)

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      clinica_id,
      phone,
      etapa,
      evento,
    })
  } catch (err) {
    console.error('[WASCRIPT WEBHOOK]', err)
    return NextResponse.json({ error: 'erro interno' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Excalibur Wascript Webhook ativo ⚔️' })
}
