'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Lead {
  id: string
  nome: string
  procedimento: string | null
  etapa: string
  created_at: string
}

export default function MarketingPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [investMes, setInvestMes] = useState(5000)

  useEffect(() => {
    supabase.from('leads').select('id,nome,procedimento,etapa,created_at').then(({ data }) => {
      setLeads((data ?? []) as Lead[])
      setLoading(false)
    })
  }, [])

  const kpis = useMemo(() => {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const leadsMes = leads.filter((l) => new Date(l.created_at) >= inicioMes)
    const agendados = leads.filter((l) => ['Agendado', 'Compareceu', 'Fechou'].includes(l.etapa))
    const fechados = leads.filter((l) => l.etapa === 'Fechou')
    return {
      leadsMes: leadsMes.length,
      cpl: leadsMes.length > 0 ? investMes / leadsMes.length : 0,
      taxaAgendamento: leads.length > 0 ? (agendados.length / leads.length * 100) : 0,
      taxaFechamento: agendados.length > 0 ? (fechados.length / agendados.length * 100) : 0,
      cac: fechados.length > 0 ? investMes / fechados.length : 0,
    }
  }, [leads, investMes])

  const porProcedimento = useMemo(() => {
    const map: Record<string, number> = {}
    leads.forEach((l) => {
      const p = l.procedimento || 'Outro'
      map[p] = (map[p] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [leads])

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">📈 Marketing</h1>
          <p className="text-gray-400 text-sm mt-1">CPL, CAC, ROI e origem dos leads</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center gap-4">
          <label className="text-gray-400 text-xs font-medium">Investimento em ads este mês:</label>
          <input type="number" value={investMes} onChange={(e) => setInvestMes(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm w-40 focus:outline-none focus:border-amber-500" />
          <span className="text-amber-400 font-semibold">{fmt(investMes)}</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Kpi label="Leads no mês" valor={String(kpis.leadsMes)} sub="novos" cor="text-amber-400" />
              <Kpi label="CPL" valor={fmt(kpis.cpl)} sub="custo por lead" cor="text-blue-400" />
              <Kpi label="CAC" valor={fmt(kpis.cac)} sub="custo por cliente" cor="text-amber-400" />
              <Kpi label="T. Agendamento" valor={`${kpis.taxaAgendamento.toFixed(0)}%`} sub="leads → agendados" cor="text-green-400" />
              <Kpi label="T. Fechamento" valor={`${kpis.taxaFechamento.toFixed(0)}%`} sub="agendados → fechou" cor="text-green-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Leads por Procedimento</h3>
                <div className="space-y-2">
                  {porProcedimento.map(([proc, count]) => {
                    const pct = (count / leads.length) * 100
                    return (
                      <div key={proc}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{proc}</span>
                          <span className="text-amber-400 font-semibold">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Próximas integrações</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { icon: '📘', nome: 'Meta Ads', status: 'em breve' },
                    { icon: '🔎', nome: 'Google Ads', status: 'em breve' },
                    { icon: '📱', nome: 'Instagram', status: 'em breve' },
                    { icon: '🌐', nome: 'Landing Pages', status: 'roadmap' },
                  ].map((i) => (
                    <div key={i.nome} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{i.icon}</span>
                        <span className="text-gray-300">{i.nome}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 uppercase tracking-wider">{i.status}</span>
                    </div>
                  ))}
                </div>
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
