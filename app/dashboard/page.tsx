'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import HeadDashboard from '../components/HeadDashboard'

interface Lead {
  id: string
  nome: string
  telefone: string
  procedimento: string
  etapa: string
  created_at: string
}

interface Proposta {
  id: string
  valor_total: number
  status: string
}

function fmt(v: number): string {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [propostas, setPropostas] = useState<Proposta[]>([])

  useEffect(() => {
    async function carregar() {
      const [l, p] = await Promise.all([
        supabase.from('leads').select('id,nome,telefone,procedimento,etapa,created_at'),
        supabase.from('propostas').select('id,valor_total,status'),
      ])
      if (l.data) setLeads(l.data)
      if (p.data) setPropostas(p.data as Proposta[])
    }
    carregar()
  }, [])

  const etapas = ['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou']

  const receita = useMemo(() => {
    return propostas
      .filter((p) => p.status === 'pago')
      .reduce((s, p) => s + Number(p.valor_total), 0)
  }, [propostas])

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold">Bom dia, Dr. João 👋</h2>
          <p className="text-gray-400 mt-1">Aqui está o resumo de hoje</p>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total de leads</p>
            <p className="text-white text-3xl font-bold mt-1">{leads.length}</p>
            <p className="text-green-400 text-xs mt-1">No banco de dados</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Agendamentos</p>
            <p className="text-white text-3xl font-bold mt-1">{leads.filter(l => l.etapa === 'Agendado').length}</p>
            <p className="text-green-400 text-xs mt-1">Leads agendados</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Receita</p>
            <p className="text-white text-3xl font-bold mt-1">{fmt(receita)}</p>
            <p className="text-green-400 text-xs mt-1">Propostas pagas</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Fechamentos</p>
            <p className="text-white text-3xl font-bold mt-1">{leads.filter(l => l.etapa === 'Fechou').length}</p>
            <p className="text-amber-400 text-xs mt-1">Leads convertidos</p>
          </div>
        </div>

        {/* Kanban */}
        <h3 className="text-white font-semibold text-lg mb-4">Pipeline de leads</h3>
        <div className="grid grid-cols-5 gap-4">
          {etapas.map(etapa => (
            <div key={etapa} className={`bg-gray-900 border rounded-xl p-4 ${etapa === 'Fechou' ? 'border-green-900' : 'border-gray-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-wider ${etapa === 'Fechou' ? 'text-green-400' : 'text-gray-400'}`}>
                  {etapa}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${etapa === 'Fechou' ? 'bg-green-900 text-green-400' : etapa === 'Agendado' ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                  {leads.filter(l => l.etapa === etapa).length}
                </span>
              </div>
              <div className="space-y-2">
                {leads.filter(l => l.etapa === etapa).map(lead => (
                  <div key={lead.id} className={`rounded-lg p-3 ${etapa === 'Fechou' ? 'bg-gray-800 border border-green-900' : 'bg-gray-800'}`}>
                    <p className="text-white text-sm font-medium">{lead.nome}</p>
                    <p className={`text-xs mt-1 ${etapa === 'Fechou' ? 'text-green-400' : 'text-gray-500'}`}>
                      {lead.procedimento} · {lead.telefone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* HEAD — IA Insights */}
        <div className="mt-8">
          <HeadDashboard />
        </div>

      </div>
    </div>
  )
}