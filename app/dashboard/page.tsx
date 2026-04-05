'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Lead {
  id: string
  nome: string
  telefone: string
  procedimento: string
  etapa: string
  created_at: string
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    async function carregarLeads() {
      const { data } = await supabase.from('leads').select('*')
      if (data) setLeads(data)
    }
    carregarLeads()
  }, [])

  const etapas = ['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou']

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Menu lateral */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-white font-bold text-xl">⚔️ Excalibur</h1>
          <p className="text-gray-500 text-xs mt-1">Sistema Operacional</p>
        </div>
        <nav className="p-4 flex flex-col gap-1">
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-500 text-gray-950 font-semibold text-sm">📊 Dashboard</a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm cursor-pointer">👥 Leads / CRM</a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm cursor-pointer">🦷 Pacientes</a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm cursor-pointer">📅 Agenda</a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm cursor-pointer">💰 Financeiro</a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm cursor-pointer">📈 Marketing</a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm cursor-pointer">🎓 Academia</a>
        </nav>
        <div className="mt-auto p-4 border-t border-gray-800">
          <p className="text-gray-500 text-xs">Clínica Exemplo</p>
          <p className="text-gray-400 text-sm font-medium">Dr. João Silva</p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold">Bom dia, Dr. João 👋</h2>
          <p className="text-gray-400 mt-1">Aqui está o resumo de hoje</p>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
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
            <p className="text-gray-400 text-sm">Receita do mês</p>
            <p className="text-white text-3xl font-bold mt-1">R$48k</p>
            <p className="text-green-400 text-xs mt-1">+12% vs mês anterior</p>
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

      </div>
    </div>
  )
}