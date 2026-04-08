import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const telefone = searchParams.get('telefone')
  const clinica_id = searchParams.get('clinica_id')

  if (!telefone) {
    return NextResponse.json({ success: false, error: 'telefone obrigatorio' }, { status: 400, headers: corsHeaders })
  }

  const query = supabase.from('leads').select('*').eq('telefone', telefone)
  if (clinica_id) query.eq('clinica_id', clinica_id)

  const { data, error } = await query.limit(1).single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true, lead: data || null }, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.telefone && !body.nome) {
      return NextResponse.json({ success: false, error: 'nome ou telefone obrigatorio' }, { status: 400, headers: corsHeaders })
    }

    // Check if lead exists by phone
    if (body.telefone) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('telefone', body.telefone)
        .limit(1)
        .single()

      if (existing) {
        // Update existing lead
        const { data, error } = await supabase
          .from('leads')
          .update({
            nome: body.nome || undefined,
            procedimento: body.procedimento || undefined,
            etapa: body.etapa || undefined,
            lead_score: body.lead_score || undefined,
            ultimo_contato: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
        }

        return NextResponse.json({ success: true, lead_id: data.id, lead: data, action: 'updated' }, { headers: corsHeaders })
      }
    }

    // Create new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: body.nome || 'Sem nome',
        telefone: body.telefone || '',
        procedimento: body.procedimento || 'Implante',
        etapa: body.etapa || 'Recebido',
        clinica_id: body.clinica_id || null,
        origem: body.origem || 'WhatsApp',
        lead_score: body.lead_score || 50,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, lead_id: data.id, lead: data, action: 'created' }, { headers: corsHeaders })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: corsHeaders })
  }
}
