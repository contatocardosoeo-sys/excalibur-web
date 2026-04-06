// ⚔️ Excalibur — API Oportunidades (Pipeline de Vendas)
// GET /api/oportunidades — lista com filtros
// POST /api/oportunidades — criar nova oportunidade
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const estagio = searchParams.get('estagio')
    const vendedorId = searchParams.get('vendedor_id')
    const busca = searchParams.get('busca')
    const limite = parseInt(searchParams.get('limite') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('oportunidades')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1)

    if (estagio) query = query.eq('estagio', estagio)
    if (vendedorId) query = query.eq('vendedor_id', vendedorId)
    if (busca) query = query.or(`titulo.ilike.%${busca}%,procedimento.ilike.%${busca}%`)

    const { data, error, count } = await query

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    // Calcular KPIs do pipeline
    const { data: todas } = await supabase
      .from('oportunidades')
      .select('valor, probabilidade, estagio, created_at, data_fechamento')
      .eq('clinica_id', clinicaId)

    const todasOps = todas || []
    const ativas = todasOps.filter(o => !['Ganho', 'Perdido'].includes(o.estagio))
    const ganhas = todasOps.filter(o => o.estagio === 'Ganho')
    const perdidas = todasOps.filter(o => o.estagio === 'Perdido')
    const fechadas = ganhas.length + perdidas.length

    const valorBruto = ativas.reduce((s, o) => s + Number(o.valor || 0), 0)
    const forecast = ativas.reduce((s, o) => s + (Number(o.valor || 0) * (o.probabilidade || 0) / 100), 0)
    const taxaConversao = fechadas > 0 ? (ganhas.length / fechadas) * 100 : 0

    return NextResponse.json({
      oportunidades: data,
      kpis: {
        valor_bruto_pipeline: Math.round(valorBruto * 100) / 100,
        forecast_ponderado: Math.round(forecast * 100) / 100,
        taxa_conversao: Math.round(taxaConversao * 10) / 10,
        total_ativas: ativas.length,
        ganhas: ganhas.length,
        perdidas: perdidas.length,
      },
      total: count,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao listar oportunidades'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clinica_id = CLINICA_DEMO_ID,
      lead_id,
      titulo,
      valor = 0,
      probabilidade = 20,
      estagio = 'Qualificacao',
      vendedor_id,
      procedimento,
      origem = 'manual',
      data_previsao_fechamento,
      observacoes,
      tags = [],
    } = body as Record<string, unknown>

    if (!titulo) {
      return NextResponse.json({ erro: 'Título é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('oportunidades')
      .insert({
        clinica_id,
        lead_id,
        titulo,
        valor,
        probabilidade,
        estagio,
        vendedor_id,
        procedimento,
        origem,
        data_previsao_fechamento,
        observacoes,
        tags,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    return NextResponse.json({ oportunidade: data, mensagem: 'Oportunidade criada' }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar oportunidade'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
