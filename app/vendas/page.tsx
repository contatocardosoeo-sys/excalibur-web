'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
interface VendasKPIs {
  vendas_mes: number
  ticket_medio: number
  taxa_conversao: number
  pipeline_ativo: number
  pipeline_leads_count: number
  forecast: number
  ciclo_vendas_dias: number
  meta_mensal: number
  percentual_meta: number
}

interface FunilEstagio {
  estagio: string
  quantidade: number
  percentual: number
}

interface LeadQuente {
  id: string
  titulo: string
  valor: number
  score: number
  estagio: string
}

interface AtividadeRecente {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  created_at: string
}

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtNum(v: number): string {
  return new Intl.NumberFormat('pt-BR').format(v)
}

const FUNIL_CORES: Record<string, string> = {
  'Novo Lead': 'bg-blue-500',
  'Qualificacao': 'bg-cyan-500',
  'Contato Inicial': 'bg-purple-500',
  'Em Negociacao': 'bg-amber-500',
  'Pagamento Pendente': 'bg-orange-500',
  'Fechado/Ganho': 'bg-green-500',
  'Perdido': 'bg-red-500',
}

// ── Component ────────────────────────────────────────────────────────
export default function VendasDashboardPage() {
  const [kpis, setKpis] = useState<VendasKPIs | null>(null)
  const [funil, setFunil] = useState<FunilEstagio[]>([])
  const [leadsQuentes, setLeadsQuentes] = useState<LeadQuente[]>([])
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<'mes' | '90dias'>('mes')

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/vendas/dashboard?periodo=${periodo}`)
      const json = await res.json()
      if (json.erro) {
        setErro(json.erro)
      } else {
        setKpis(json.kpis || null)
        setFunil(json.funil || [])
        setLeadsQuentes(json.leads_quentes || [])
        setAtividades(json.atividades_recentes || [])
      }
    } catch {
      setErro('Erro ao conectar com API de vendas')
    }
    setLoading(false)
  }, [periodo])

  useEffect(() => { carregar() }, [carregar])

  const maxFunil = Math.max(...funil.map(f => f.quantidade), 1)

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Dashboard de Vendas</h1>
            <p className="text-gray-400 text-sm mt-1">Visao geral do comercial</p>
          </div>
          <div className="flex gap-2">
            {(['mes', '90dias'] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  periodo === p ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
                }`}>
                {p === 'mes' ? 'Este Mes' : '90 Dias'}
              </button>
            ))}
          </div>
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">{erro}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando dashboard...</div>
        ) : kpis ? (
          <>
            {/* 9 KPIs */}
            <div className="grid grid-cols-3 md:grid-cols-9 gap-3 mb-8">
              <KpiCard label="Vendas Mes" valor={fmt(kpis.vendas_mes)} cor="text-green-400" large />
              <KpiCard label="Ticket Medio" valor={fmt(kpis.ticket_medio)} cor="text-amber-400" />
              <KpiCard label="Conversao" valor={`${kpis.taxa_conversao}%`} cor="text-blue-400" />
              <KpiCard label="Pipeline" valor={fmt(kpis.pipeline_ativo)} cor="text-purple-400" />
              <KpiCard label="Leads Ativos" valor={String(kpis.pipeline_leads_count)} cor="text-white" />
              <KpiCard label="Forecast" valor={fmt(kpis.forecast)} cor="text-cyan-400" />
              <KpiCard label="Ciclo Vendas" valor={`${kpis.ciclo_vendas_dias}d`} cor="text-orange-400" />
              <KpiCard label="Meta" valor={fmt(kpis.meta_mensal)} cor="text-gray-400" />
              <KpiCard label="% Meta" valor={`${kpis.percentual_meta}%`} cor={kpis.percentual_meta >= 100 ? 'text-green-400' : kpis.percentual_meta >= 50 ? 'text-amber-400' : 'text-red-400'} />
            </div>

            {/* Meta Progress */}
            {kpis.meta_mensal > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-semibold">Vendas vs Meta</p>
                  <p className="text-gray-400 text-sm">{fmt(kpis.vendas_mes)} / {fmt(kpis.meta_mensal)}</p>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      kpis.percentual_meta >= 100 ? 'bg-green-500' : kpis.percentual_meta >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(kpis.percentual_meta, 100)}%` }}
                  />
                </div>
                <p className={`text-right text-sm font-bold mt-2 ${
                  kpis.percentual_meta >= 100 ? 'text-green-400' : kpis.percentual_meta >= 70 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {kpis.percentual_meta}% atingido
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Funil de Conversao */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Funil de Conversao</h3>
                <div className="space-y-3">
                  {funil.filter(f => f.quantidade > 0 || f.estagio !== 'Perdido').map(f => (
                    <div key={f.estagio}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs">{f.estagio}</span>
                        <span className="text-white text-xs font-bold">{f.quantidade} ({f.percentual}%)</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${FUNIL_CORES[f.estagio] || 'bg-gray-600'}`}
                          style={{ width: `${(f.quantidade / maxFunil) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leads Quentes */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Leads Quentes (Score 60+)</h3>
                {leadsQuentes.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">Nenhum lead quente no momento.</p>
                ) : (
                  <div className="space-y-3">
                    {leadsQuentes.map(lead => (
                      <div key={lead.id} className="bg-gray-800/50 border border-gray-700/50 hover:border-amber-500/30 rounded-lg p-3 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                              {lead.score}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{lead.titulo}</p>
                              <p className="text-gray-500 text-xs">{lead.estagio}</p>
                            </div>
                          </div>
                          <p className="text-amber-400 font-bold text-sm">{fmt(lead.valor)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Atividades Recentes</h3>
              {atividades.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">Sem atividades recentes.</p>
              ) : (
                <div className="space-y-2">
                  {atividades.map(a => (
                    <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">{a.titulo}</p>
                        {a.descricao && <p className="text-gray-500 text-xs truncate">{a.descricao}</p>}
                      </div>
                      <span className="text-gray-600 text-xs shrink-0">
                        {new Date(a.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">Sem dados disponíveis.</div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, valor, cor, large }: { label: string; valor: string; cor: string; large?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium leading-tight">{label}</p>
      <p className={`${large ? 'text-base' : 'text-sm'} font-bold mt-1 ${cor} truncate`}>{valor}</p>
    </div>
  )
}
