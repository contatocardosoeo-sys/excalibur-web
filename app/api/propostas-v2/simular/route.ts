// ⚔️ Excalibur Pay — Simulador de Crédito
// POST /api/propostas-v2/simular — simula parcelas com juros
import { NextRequest, NextResponse } from 'next/server'

interface SimulacaoInput {
  valor_total: number
  entrada: number
  parcelas: number[]
  financeiras?: string[]
}

interface TabelaFinanceira {
  nome: string
  taxas: Record<number, number> // parcelas -> taxa mensal %
}

// Tabela de taxas por financeira (configurável)
const FINANCEIRAS: TabelaFinanceira[] = [
  {
    nome: 'Excalibur Pay',
    taxas: { 1: 0, 2: 0, 3: 0, 6: 1.49, 10: 1.79, 12: 1.99, 18: 2.29, 24: 2.49 },
  },
  {
    nome: 'BV Financeira',
    taxas: { 6: 1.69, 10: 1.99, 12: 2.19, 18: 2.49, 24: 2.79, 36: 2.99 },
  },
  {
    nome: 'Creditas',
    taxas: { 6: 1.59, 12: 1.89, 18: 2.19, 24: 2.49 },
  },
]

function calcularParcela(valorFinanciado: number, taxaMensal: number, numParcelas: number): number {
  if (taxaMensal === 0) return valorFinanciado / numParcelas
  const taxa = taxaMensal / 100
  // Tabela PRICE
  return valorFinanciado * (taxa * Math.pow(1 + taxa, numParcelas)) / (Math.pow(1 + taxa, numParcelas) - 1)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SimulacaoInput

    const { valor_total, entrada = 0, parcelas = [1, 6, 10, 12, 18, 24], financeiras } = body

    if (!valor_total || valor_total <= 0) {
      return NextResponse.json({ erro: 'valor_total deve ser maior que zero' }, { status: 400 })
    }

    if (entrada >= valor_total) {
      return NextResponse.json({ erro: 'Entrada não pode ser maior ou igual ao valor total' }, { status: 400 })
    }

    const valorFinanciado = valor_total - entrada
    const finsFiltradas = financeiras
      ? FINANCEIRAS.filter(f => financeiras.includes(f.nome))
      : FINANCEIRAS

    const simulacoes = finsFiltradas.map(fin => {
      const opcoes = parcelas.map(numParcelas => {
        const taxaMensal = fin.taxas[numParcelas]
        if (taxaMensal === undefined) return null

        const valorParcela = calcularParcela(valorFinanciado, taxaMensal, numParcelas)
        const custoTotal = valorParcela * numParcelas
        const jurosTotal = custoTotal - valorFinanciado

        return {
          parcelas: numParcelas,
          taxa_mensal: taxaMensal,
          valor_parcela: Math.round(valorParcela * 100) / 100,
          valor_financiado: Math.round(valorFinanciado * 100) / 100,
          custo_total: Math.round(custoTotal * 100) / 100,
          juros_total: Math.round(jurosTotal * 100) / 100,
          cet_anual: Math.round(((Math.pow(1 + taxaMensal / 100, 12) - 1) * 100) * 100) / 100,
        }
      }).filter(Boolean)

      return {
        financeira: fin.nome,
        opcoes,
      }
    })

    return NextResponse.json({
      simulacao: {
        valor_total,
        entrada,
        valor_financiado: Math.round(valorFinanciado * 100) / 100,
        financeiras: simulacoes,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro na simulação'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
