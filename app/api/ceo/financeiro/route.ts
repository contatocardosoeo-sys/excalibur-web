import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data: propostas, error } = await supabase
      .from('propostas')
      .select('id, status, valor_total, parcelas, valor_parcela, procedimento, created_at')

    if (error) throw error

    const lista = propostas ?? []
    const pagas = lista.filter(p => p.status === 'pago')
    const aprovadas = lista.filter(p => p.status === 'aprovado' || p.status === 'pago')
    const pendentes = lista.filter(p => p.status === 'pendente')

    const receitaTotal = pagas.reduce((s, p) => s + Number(p.valor_total), 0)
    const pipeline = pendentes.reduce((s, p) => s + Number(p.valor_total), 0)
    const ticketMedio = aprovadas.length > 0
      ? aprovadas.reduce((s, p) => s + Number(p.valor_total), 0) / aprovadas.length
      : 0

    // Receita por procedimento
    const porProcedimento: Record<string, number> = {}
    pagas.forEach(p => {
      const proc = p.procedimento || 'Outro'
      porProcedimento[proc] = (porProcedimento[proc] || 0) + Number(p.valor_total)
    })

    const receitaPorProcedimento = Object.entries(porProcedimento)
      .map(([procedimento, valor]) => ({ procedimento, valor }))
      .sort((a, b) => b.valor - a.valor)

    return NextResponse.json({
      receita_total: receitaTotal,
      pipeline,
      ticket_medio: Math.round(ticketMedio * 100) / 100,
      total_propostas: lista.length,
      aprovadas: aprovadas.length,
      pendentes: pendentes.length,
      taxa_aprovacao: lista.length > 0
        ? Math.round((aprovadas.length / lista.length) * 10000) / 100
        : 0,
      receita_por_procedimento: receitaPorProcedimento,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao calcular financeiro'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
