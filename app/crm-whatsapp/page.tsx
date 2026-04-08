'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Lead {
  id: string
  phone: string
  nome: string | null
  etapa: string
  etiqueta: string | null
  ultimo_contato: string
  dados: Record<string, unknown>
}

const ETAPA_COR: Record<string, { bg: string; text: string }> = {
  RECEPCAO: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  MAPEAMENTO: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  EXPLICACAO: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  AGENDAMENTO: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  AGENDANDO: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  CONFIRMACAO: { bg: 'bg-green-500/20', text: 'text-green-400' },
  REAGENDAMENTO: { bg: 'bg-red-500/20', text: 'text-red-400' },
  LISTA_FRIA: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  SDR: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
}

const ETAPAS_FILTRO = ['RECEPCAO', 'MAPEAMENTO', 'EXPLICACAO', 'AGENDAMENTO', 'AGENDANDO', 'CONFIRMACAO', 'REAGENDAMENTO', 'LISTA_FRIA']
const CLINICA_ID = '21e95ba0-8f06-4062-85f0-1b9da496be52'

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function CRMWhatsAppPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [etapaFiltro, setEtapaFiltro] = useState('')
  const [dataFiltro, setDataFiltro] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos')
  const [leadAberto, setLeadAberto] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [showNovoLead, setShowNovoLead] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoEtapa, setNovoEtapa] = useState('RECEPCAO')
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null)
  const [novaEtapa, setNovaEtapa] = useState('')

  const carregarLeads = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('whatsapp_leads')
      .select('*')
      .eq('clinica_id', CLINICA_ID)
      .order('ultimo_contato', { ascending: false })

    if (etapaFiltro) query = query.eq('etapa', etapaFiltro)

    // Filtro por data
    if (dataFiltro !== 'todos') {
      const now = new Date()
      let desde: Date
      if (dataFiltro === 'hoje') {
        desde = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (dataFiltro === 'semana') {
        desde = new Date(now.getTime() - 7 * 86400000)
      } else {
        desde = new Date(now.getTime() - 30 * 86400000)
      }
      query = query.gte('ultimo_contato', desde.toISOString())
    }

    const { data } = await query
    setLeads(data || [])
    setLoading(false)
  }, [etapaFiltro, dataFiltro])

  useEffect(() => {
    carregarLeads()
    const channel = supabase
      .channel('whatsapp_leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_leads' }, () => carregarLeads())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [carregarLeads])

  async function enviarMensagem(lead: Lead) {
    if (!mensagem.trim()) return
    setEnviando(true)
    try {
      const res = await fetch('/api/wascript/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinica_id: CLINICA_ID, phone: lead.phone, tipo: 'texto', mensagem }),
      })
      const result = await res.json()
      if (result.success !== false) {
        setMensagem('')
        setLeadAberto(null)
      }
    } catch { /* */ }
    setEnviando(false)
  }

  async function criarLeadManual() {
    if (!novoTelefone.trim()) return
    await supabase.from('whatsapp_leads').insert({
      clinica_id: CLINICA_ID,
      phone: novoTelefone.replace(/\D/g, ''),
      nome: novoNome || null,
      etapa: novoEtapa,
      etiqueta: null,
      ultimo_contato: new Date().toISOString(),
      dados: {},
    })
    setNovoNome('')
    setNovoTelefone('')
    setNovoEtapa('RECEPCAO')
    setShowNovoLead(false)
    carregarLeads()
  }

  async function mudarEtapa(leadId: string, etapa: string) {
    await supabase.from('whatsapp_leads').update({ etapa }).eq('id', leadId)
    setDrawerLead(prev => prev ? { ...prev, etapa } : null)
    carregarLeads()
  }

  const leadsFiltrados = leads.filter(l => {
    const q = busca.toLowerCase()
    return !busca || l.phone.includes(q) || (l.nome || '').toLowerCase().includes(q) || (l.etiqueta || '').toLowerCase().includes(q)
  })

  const contPorEtapa = ETAPAS_FILTRO.map(e => ({ etapa: e, count: leads.filter(l => l.etapa === e).length }))

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-amber-500">💬</span> CRM WhatsApp
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Leads via Wascript — {leads.length} contatos | Realtime ativo
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNovoLead(true)}
                className="px-4 py-2 bg-amber-500 text-gray-950 text-sm rounded-xl font-bold hover:bg-amber-400 transition">
                + Novo Lead
              </button>
              <button onClick={carregarLeads} className="px-4 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl hover:border-amber-500/50 transition">
                Atualizar
              </button>
            </div>
          </div>

          {/* Mini funil visual */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-1">
              {ETAPAS_FILTRO.map((etapa, i) => {
                const count = contPorEtapa.find(e => e.etapa === etapa)?.count || 0
                const cor = ETAPA_COR[etapa] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                const totalLeads = leads.length || 1
                const width = Math.max(8, (count / totalLeads) * 100)
                return (
                  <div key={etapa} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                    <div className="w-full flex items-end justify-center" style={{ height: 40 }}>
                      <div className={`${cor.bg} rounded-t-lg w-full`} style={{ height: `${width}%`, minHeight: 4 }} />
                    </div>
                    <span className={`${cor.text} text-[9px] font-bold`}>{count}</span>
                    <span className="text-gray-500 text-[8px] truncate max-w-full">{etapa.replace('_', ' ')}</span>
                    {i < ETAPAS_FILTRO.length - 1 && <span className="text-gray-700 text-[8px] absolute" style={{ display: 'none' }}>→</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setEtapaFiltro('')}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${!etapaFiltro ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              Todos ({leads.length})
            </button>
            {contPorEtapa.filter(e => e.count > 0).map(e => {
              const cor = ETAPA_COR[e.etapa] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
              return (
                <button key={e.etapa} onClick={() => setEtapaFiltro(etapaFiltro === e.etapa ? '' : e.etapa)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${etapaFiltro === e.etapa ? 'bg-amber-500 text-gray-950' : `${cor.bg} ${cor.text} hover:opacity-80`}`}>
                  {e.etapa.replace('_', ' ')} ({e.count})
                </button>
              )
            })}
          </div>

          {/* Busca + filtro data */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nome, telefone, etiqueta..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="flex gap-1">
              {(['hoje', 'semana', 'mes', 'todos'] as const).map(f => (
                <button key={f} onClick={() => setDataFiltro(f)}
                  className={`px-3 py-2 rounded-xl text-xs transition ${dataFiltro === f ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}`}>
                  {f === 'hoje' ? 'Hoje' : f === 'semana' ? '7d' : f === 'mes' ? '30d' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de leads */}
          {loading ? (
            <div className="text-center text-gray-500 py-12 animate-pulse">Carregando leads...</div>
          ) : leadsFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400">Nenhum lead encontrado.</p>
              <p className="text-gray-500 text-sm mt-1">Leads aparecem automaticamente quando o webhook recebe mensagens.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leadsFiltrados.map(lead => {
                const cor = ETAPA_COR[lead.etapa] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }
                const isAberto = leadAberto === lead.id
                return (
                  <div key={lead.id} className={`bg-gray-900 border ${isAberto ? 'border-amber-500/30' : 'border-gray-800'} rounded-2xl p-4 transition hover:border-gray-700`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDrawerLead(lead)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{lead.nome || 'Sem nome'}</span>
                          <span className="text-gray-500 text-xs">{lead.phone}</span>
                          <span className={`${cor.bg} ${cor.text} text-[10px] px-2 py-0.5 rounded-lg font-medium`}>{lead.etapa.replace('_', ' ')}</span>
                          {lead.etiqueta && <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-lg">{lead.etiqueta}</span>}
                        </div>
                        <p className="text-gray-500 text-[10px] mt-1">Ultimo contato: {tempoRelativo(lead.ultimo_contato)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setLeadAberto(isAberto ? null : lead.id)}
                          className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg hover:border-amber-500/50 transition">
                          💬 Msg
                        </button>
                        <button onClick={() => window.open(`https://wa.me/${lead.phone}`, '_blank')}
                          className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition">
                          📱 Abrir
                        </button>
                      </div>
                    </div>

                    {isAberto && (
                      <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                        <input
                          type="text"
                          placeholder={`Mensagem para ${lead.nome || lead.phone}...`}
                          value={mensagem}
                          onChange={e => setMensagem(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && enviarMensagem(lead)}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => enviarMensagem(lead)}
                          disabled={enviando || !mensagem.trim()}
                          className="px-4 py-2 bg-amber-500 text-gray-950 rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50 transition shrink-0"
                        >
                          {enviando ? '...' : 'Enviar'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Drawer lateral */}
      {drawerLead && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-5 overflow-y-auto shrink-0">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white font-bold text-sm">{drawerLead.nome || 'Sem nome'}</h3>
            <button onClick={() => setDrawerLead(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Telefone</p>
              <p className="text-white text-sm font-mono">{drawerLead.phone}</p>
            </div>

            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Etapa Atual</p>
              <div className="flex items-center gap-2">
                <span className={`${ETAPA_COR[drawerLead.etapa]?.bg || 'bg-gray-500/20'} ${ETAPA_COR[drawerLead.etapa]?.text || 'text-gray-400'} text-xs px-2 py-1 rounded-lg font-medium`}>
                  {drawerLead.etapa.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Mudar Etapa</p>
              <select
                value={novaEtapa || drawerLead.etapa}
                onChange={e => { setNovaEtapa(e.target.value); mudarEtapa(drawerLead.id, e.target.value) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {ETAPAS_FILTRO.map(e => (
                  <option key={e} value={e}>{e.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {drawerLead.etiqueta && (
              <div>
                <p className="text-gray-500 text-[10px] uppercase mb-1">Etiqueta</p>
                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-lg">{drawerLead.etiqueta}</span>
              </div>
            )}

            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Ultimo Contato</p>
              <p className="text-gray-400 text-xs">{tempoRelativo(drawerLead.ultimo_contato)} atras</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800">
              <button onClick={() => { setLeadAberto(drawerLead.id); setDrawerLead(null) }}
                className="w-full px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition">
                💬 Enviar mensagem
              </button>
              <button onClick={() => window.open(`https://wa.me/${drawerLead.phone}`, '_blank')}
                className="w-full px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition">
                📱 Abrir WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lead */}
      {showNovoLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowNovoLead(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">Novo Lead Manual</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-xs block mb-1">Nome</label>
                <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">Telefone *</label>
                <input type="text" value={novoTelefone} onChange={e => setNovoTelefone(e.target.value)}
                  placeholder="5511999999999"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">Etapa</label>
                <select value={novoEtapa} onChange={e => setNovoEtapa(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  {ETAPAS_FILTRO.map(e => (
                    <option key={e} value={e}>{e.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNovoLead(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition">
                  Cancelar
                </button>
                <button onClick={criarLeadManual} disabled={!novoTelefone.trim()}
                  className="flex-1 px-4 py-2 bg-amber-500 text-gray-950 rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50 transition">
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
