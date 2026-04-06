// ⚔️ Excalibur — API Atividades (Follow-ups & Tarefas)
// GET /api/atividades — listar com filtros
// POST /api/atividades — criar nova atividade
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const leadId = searchParams.get('lead_id')
    const oportunidadeId = searchParams.get('oportunidade_id')
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')
    const prioridade = searchParams.get('prioridade')
    const limite = parseInt(searchParams.get('limite') || '50')

    let query = supabase
      .from('atividades')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (leadId) query = query.eq('lead_id', leadId)
    if (oportunidadeId) query = query.eq('oportunidade_id', oportunidadeId)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)
    if (prioridade) query = query.eq('prioridade', prioridade)

    const { data, error } = await query

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    // Contadores por status
    const { data: contagens } = await supabase
      .from('atividades')
      .select('status')
      .eq('clinica_id', clinicaId)

    const stats = {
      pendentes: 0,
      concluidas: 0,
      atrasadas: 0,
      total: 0,
    }

    for (const a of contagens || []) {
      stats.total++
      if (a.status === 'pendente') stats.pendentes++
      if (a.status === 'concluida') stats.concluidas++
      if (a.status === 'atrasada') stats.atrasadas++
    }

    return NextResponse.json({ atividades: data, stats })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao listar atividades'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clinica_id = CLINICA_DEMO_ID,
      lead_id,
      oportunidade_id,
      tipo,
      titulo,
      descricao,
      status = 'pendente',
      prioridade = 'media',
      data_agendada,
      responsavel_id,
      responsavel_nome,
      duracao_minutos,
    } = body as Record<string, unknown>

    if (!titulo || !tipo) {
      return NextResponse.json({ erro: 'Título e tipo são obrigatórios' }, { status: 400 })
    }

    if (!lead_id) {
      return NextResponse.json({ erro: 'lead_id é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('atividades')
      .insert({
        clinica_id,
        lead_id,
        oportunidade_id,
        tipo,
        titulo,
        descricao,
        status,
        prioridade,
        data_agendada,
        responsavel_id,
        responsavel_nome,
        duracao_minutos,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    // Registrar no histórico do lead
    await supabase.from('historico_leads').insert({
      clinica_id,
      lead_id,
      tipo: 'atividade',
      titulo: `${tipo}: ${titulo}`,
      descricao,
      autor: responsavel_nome || 'sistema',
    })

    return NextResponse.json({ atividade: data, mensagem: 'Atividade criada' }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar atividade'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body as Record<string, unknown>

    if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

    if (updates.status === 'concluida') {
      updates.data_conclusao = new Date().toISOString()
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('atividades')
      .update(updates)
      .eq('id', id as string)
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ atividade: data, mensagem: 'Atividade atualizada' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao atualizar atividade'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
