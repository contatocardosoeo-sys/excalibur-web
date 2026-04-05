'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Lead { id: string; nome: string; procedimento: string | null; etapa: string; created_at: string }
interface Ag { id: string; status: string; data: string; created_at: string }
interface Prop { id: string; valor_total: number; status: string; created_at: string }

const ETAPAS = ['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou']

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function BIPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [ags, setAgs] = useState<Ag[]>([])
  const [props, setProps] = useState<Prop[]>([])
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | 'ano'>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('agendamentos').select('id,status,data,created_at'),
      supabase.from('propostas').select('id,valor_total,status,created_at'),
    ]).then(([l, a, p]) => {
      setLeads((l.data ?? []) as Lead[])
      setAgs((a.data ?? []) as Ag[])
      setProps((p.data ?? []) as Prop[])
      setLoading(false)
    })
  }, [])

  const inicioPeriodo = useMemo(() => {
    const d = new Date()
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365
    d.setDate(d.getDate() - dias)
    return d
  }, [periodo])

  const filtrado = useMemo(() => {
    const noPeriodo = (dt: string) => new Date(dt) >= inicioPeriodo
    return {
      leads: leads.filter((l) => noPeriodo(l.created_at)),
      ags: ags.filter((a) => noPeriodo(a.created_at)),
      props: props.filter((p) => noPeriodo(p.created_at)),
    }
  }, [leads, ags, props, inicioPeriodo])

  const funil = useMemo(() => {
    const counts: Record<string, number> = {}
    ETAPAS.forEach((e) => (counts[e] = 0))
    filtrado.leads.forEach((l) => { if (counts[l.etapa] !== undefined) counts[l.etapa]++ })
    // acumular (funil invertido: cada etapa inclui as seguintes)
    const totais: number[] = []
    let acc = 0
    for (let i = ETAPAS.length - 1; i >= 0; i--) {
      acc += counts[ETAPAS[i]]
      totais.unshift(acc)
    }
    return ETAPAS.map((e, i) => ({ etapa: e, count: counts[e], total: totais[i] }))
  }, [filtrado.leads])

  const taxas = useMemo(() => {
    const f = (idx: number) => funil[idx]?.total || 0
    const t1 = f(0), t2 = f(1), t3 = f(2), t4 = f(3), t5 = f(4)
    return {
      contato: t1 > 0 ? (t2 / t1 * 100) : 0,
      agendamento: t2 > 0 ? (t3 / t2 * 100) : 0,
      comparecimento: t3 > 0 ? (t4 / t3 * 100) : 0,
      fechamento: t4 > 0 ? (t5 / t4 * 100) : 0,
      conversao: t1 > 0 ? (t5 / t1 * 100) : 0,
    }
  }, [funil])

  const kpis = useMemo(() => {
    const faturamento = filtrado.props
      .filter((p) => p.status === 'pago')
      .reduce((s, p) => s + Number(p.valor_total), 0)
    const ticketMedio = funil[4]?.count > 0 ? faturamento / funil[4].count : 0
    return {
      totalLeads: filtrado.leads.length,
      fechamentos: funil[4]?.count || 0,
      faturamento,
      ticketMedio,
      compareceu: filtrado.ags.filter((a) => a.status === 'compareceu').length,
    }
  }, [filtrado, funil])

  const porDia = useMemo(() => {
    const mapa: Record<string, number> = {}
    filtrado.leads.forEach((l) => {
      const d = l.created_at.slice(0, 10)
      mapa[d] = (mapa[d] || 0) + 1
    })
    return Object.entries(mapa).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
  }, [filtrado.leads])

  const maxDia = Math.max(...porDia.map(([, v]) => v), 1)

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">📊 BI &amp; Análise</h1>
            <p className="text-gray-400 text-sm mt-1">Funil de conversão, métricas e previsibilidade</p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'ano'] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${periodo === p ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'}`}>
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : 'Ano'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando métricas…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Kpi label="Total Leads" valor={String(kpis.totalLeads)} sub="no período" cor="text-amber-400" />
              <Kpi label="Fechamentos" valor={String(kpis.fechamentos)} sub="contratos" cor="text-green-400" />
              <Kpi label="Faturamento" valor={fmt(kpis.faturamento)} sub="recebido" cor="text-green-400" />
              <Kpi label="Ticket Médio" valor={fmt(kpis.ticketMedio)} sub="por fechamento" cor="text-amber-400" />
              <Kpi label="Conversão" valor={`${taxas.conversao.toFixed(1)}%`} sub="lead → fechado" cor="text-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funil */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Funil de Conversão</h3>
                <div className="space-y-3">
                  {funil.map((f, i) => {
                    const total = funil[0]?.total || 1
                    const pct = (f.total / total) * 100
                    const corEtapa = ['bg-gray-600', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-green-500'][i]
                    return (
                      <div key={f.etapa}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-gray-300 font-medium">{f.etapa}</span>
                          <span className="text-white font-bold">{f.total}</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-7 overflow-hidden relative">
                          <div className={`${corEtapa} h-full transition-all duration-500 flex items-center justify-end pr-3`} style={{ width: `${Math.max(pct, 3)}%` }}>
                            <span className="text-white text-[10px] font-semibold">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-gray-800 mt-4 pt-4 grid grid-cols-2 gap-3 text-xs">
                  <TxItem label="→ Contato" valor={taxas.contato} />
                  <TxItem label="→ Agendado" valor={taxas.agendamento} />
                  <TxItem label="→ Compareceu" valor={taxas.comparecimento} />
                  <TxItem label="→ Fechou" valor={taxas.fechamento} />
                </div>
              </div>

              {/* Leads por dia */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Leads por dia (últimos {porDia.length})</h3>
                {porDia.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8">Sem dados no período</div>
                ) : (
                  <div className="flex items-end gap-1 h-40">
                    {porDia.map(([dia, count]) => (
                      <div key={dia} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[9px] text-gray-500 group-hover:text-amber-400">{count}</span>
                        <div className="w-full bg-amber-500/70 hover:bg-amber-400 rounded-t transition-all"
                          style={{ height: `${(count / maxDia) * 100}%` }} />
                        <span className="text-[8px] text-gray-600 rotate-45 origin-top-left whitespace-nowrap mt-2">
                          {new Date(dia + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, valor, sub, cor }: { label: string; valor: string; sub: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 ${cor}`}>{valor}</p>
      <p className="text-gray-600 text-[10px] mt-1">{sub}</p>
    </div>
  )
}

function TxItem({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-amber-400 font-semibold">{valor.toFixed(0)}%</span>
    </div>
  )
}
