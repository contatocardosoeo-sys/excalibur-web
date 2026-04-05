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

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [novo, setNovo] = useState({
    nome: '',
    telefone: '',
    procedimento: 'Implante',
    etapa: 'Recebido'
  })

  async function carregarLeads() {
    const { data, error } = await supabase.from('leads').select('*')
    console.log('dados:', data)
    console.log('erro:', error)
    if (data) setLeads(data)
  }

  useEffect(() => {
    carregarLeads()
  }, [])

  async function adicionarLead() {
    if (!novo.nome || !novo.telefone) return
    await supabase.from('leads').insert([novo])
    setNovo({ nome: '', telefone: '', procedimento: 'Implante', etapa: 'Recebido' })
    setMostrarFormulario(false)
    carregarLeads()
  }

  async function mudarEtapa(id: string, etapa: string) {
    await supabase.from('leads').update({ etapa }).eq('id', id)
    await carregarLeads()
  }

  async function converterParaPaciente(lead: Lead) {
    if (!confirm(`Converter "${lead.nome}" em paciente?`)) return
    const { error } = await supabase.from('pacientes').insert({
      lead_id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      procedimento: lead.procedimento,
      status: 'ativo',
    })
    if (error) {
      alert('Erro: ' + error.message + (error.code === '42P01' ? '\n\nRode supabase/migrations/001_pacientes.sql no dashboard.' : ''))
      return
    }
    alert(`✅ ${lead.nome} convertido em paciente!`)
  }

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
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 text-sm">📊 Dashboard</a>
          <a href="/crm" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-500 text-gray-950 font-semibold text-sm">👥 Leads / CRM</a>
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

      {/* Conteúdo */}
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white text-2xl font-bold">Leads / CRM</h2>
            <p className="text-gray-400 mt-1">{leads.length} leads no total</p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition"
          >
            + Novo lead
          </button>
        </div>

        {/* Formulário */}
        {mostrarFormulario && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Novo lead</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nome</label>
                <input
                  type="text"
                  value={novo.nome}
                  onChange={e => setNovo({...novo, nome: e.target.value})}
                  placeholder="Nome completo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Telefone</label>
                <input
                  type="text"
                  value={novo.telefone}
                  onChange={e => setNovo({...novo, telefone: e.target.value})}
                  placeholder="48999001122"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Procedimento</label>
                <select
                  value={novo.procedimento}
                  onChange={e => setNovo({...novo, procedimento: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option>Implante</option>
                  <option>Protocolo</option>
                  <option>Prótese</option>
                  <option>Estética</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Etapa</label>
                <select
                  value={novo.etapa}
                  onChange={e => setNovo({...novo, etapa: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {etapas.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={adicionarLead}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2 rounded-lg transition text-sm"
              >
                Salvar lead
              </button>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-5 py-2 rounded-lg transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Kanban */}
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
                  <div key={lead.id} className="bg-gray-800 rounded-lg p-3">
                    <p className="text-white text-sm font-medium">{lead.nome}</p>
                    <p className="text-gray-500 text-xs mt-1">{lead.procedimento}</p>
                    <p className="text-gray-600 text-xs">{lead.telefone}</p>
                    <select
                      value={lead.etapa}
                      onChange={e => mudarEtapa(lead.id, e.target.value)}
                      className="mt-2 w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs focus:outline-none focus:border-amber-500"
                    >
                      {etapas.map(e => <option key={e}>{e}</option>)}
                    </select>
                    {(lead.etapa === 'Compareceu' || lead.etapa === 'Fechou') && (
                      <button
                        onClick={() => converterParaPaciente(lead)}
                        className="mt-2 w-full bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-gray-950 border border-amber-500/30 hover:border-amber-500 rounded px-2 py-1 text-xs font-medium transition"
                      >
                        → Paciente
                      </button>
                    )}
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