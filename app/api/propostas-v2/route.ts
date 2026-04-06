// ⚔️ Excalibur — API Propostas V2 (com Simulador de Crédito)
// GET /api/propostas-v2 — listar propostas
// POST /api/propostas-v2 — criar proposta
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

function gerarNumeroProposta(): string {
  const now = new Date()
  const ano = now.getFullYear()
  const mes = String(now.getMonth() + 1).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
  return `PROP-${ano}${mes}-${seq}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const status = searchParams.get('status')
    const busca = searchParams.get('busca')
    const limite = parseInt(searchParams.get('limite') || '50')

    let query = supabase
      .from('propostas_v2')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (status) query = query.eq('status', status)
    if (busca) query = query.or(`numero.ilike.%${busca}%,paciente_nome.ilike.%${busca}%`)

    const { data, error } = await query

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    // KPIs
    const { data: todas } = await supabase
      .from('propostas_v2')
      .select('status, valor_final, created_at')
      .eq('clinica_id', clinicaId)

    const todasProps = todas || []
    const mesAtual = new Date().toISOString().slice(0, 7)
    const doMes = todasProps.filter(p => p.created_at?.startsWith(mesAtual))

    const emitidas = doMes.length
    const aceitas = doMes.filter(p => p.status === 'aceita').length
    const taxaAceite = emitidas > 0 ? Math.round((aceitas / emitidas) * 100) : 0
    const valorAberto = todasProps
      .filter(p => ['enviada', 'visualizada'].includes(p.status))
      .reduce((s, p) => s + Number(p.valor_final || 0), 0)

    return NextResponse.json({
      propostas: data,
      kpis: {
        emitidas_mes: emitidas,
        aceitas: aceitas,
        taxa_aceite: taxaAceite,
        valor_em_aberto: Math.round(valorAberto * 100) / 100,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao listar propostas'
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
      paciente_nome,
      paciente_cpf,
      paciente_telefone,
      procedimentos = [],
      desconto_percentual = 0,
      entrada = 0,
      parcelas = 1,
      forma_pagamento = 'a_vista',
      financeira,
      taxa_juros = 0,
      validade,
      vendedor_id,
      vendedor_nome,
      observacoes,
      condicoes,
    } = body as Record<string, unknown>

    if (!paciente_nome) {
      return NextResponse.json({ erro: 'Nome do paciente é obrigatório' }, { status: 400 })
    }

    // Calcular valores
    const procs = procedimentos as Array<{ nome: string; quantidade: number; valor_unitario: number }>
    const valorTotal = procs.reduce((s, p) => s + (p.valor_unitario * (p.quantidade || 1)), 0)
    const descontoValor = valorTotal * (Number(desconto_percentual) / 100)
    const valorFinal = valorTotal - descontoValor
    const valorFinanciado = valorFinal - Number(entrada)
    const valorParcela = Number(parcelas) > 0
      ? (valorFinanciado * (1 + Number(taxa_juros) / 100)) / Number(parcelas)
      : valorFinanciado

    const numero = gerarNumeroProposta()

    const { data, error } = await supabase
      .from('propostas_v2')
      .insert({
        clinica_id,
        numero,
        lead_id,
        oportunidade_id,
        paciente_nome,
        paciente_cpf,
        paciente_telefone,
        procedimentos: procs.map(p => ({
          ...p,
          valor_total: p.valor_unitario * (p.quantidade || 1),
        })),
        valor_total: valorTotal,
        desconto_percentual,
        desconto_valor: descontoValor,
        valor_final: valorFinal,
        entrada,
        parcelas,
        valor_parcela: Math.round(valorParcela * 100) / 100,
        forma_pagamento,
        financeira,
        taxa_juros,
        valor_financiado: valorFinanciado,
        validade,
        vendedor_id,
        vendedor_nome,
        observacoes,
        condicoes,
        status: 'rascunho',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    return NextResponse.json({ proposta: data, mensagem: `Proposta ${numero} criada` }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar proposta'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
