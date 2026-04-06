'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
type TipoAtividade = 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'visita' | 'tarefa' | 'nota'
type StatusAtividade = 'pendente' | 'concluida' | 'atrasada' | 'cancelada'

interface Atividade {
  id: string
  oportunidade_id: string | null
  lead_id: string | null
  paciente_nome: string
  tipo: TipoAtividade
  titulo: string
  descricao: string | null
  data_agendada: string
  data_conclusao: string | null
  status: StatusAtividade
  responsavel: string | null
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<TipoAtividade, { icon: string; label: string; cor: string; bg: string }> = {
  ligacao:  { icon: '📞', label: 'Ligacao',  cor: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  whatsapp: { icon: '💬', label: 'WhatsApp', cor: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  email:    { icon: '📧', label: 'E-mail',   cor: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  reuniao:  { icon: '🤝', label: 'Reuniao',  cor: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  visita:   { icon: '🏥', label: 'Visita',   cor: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30' },
  tarefa:   { icon: '✅', label: 'Tarefa',   cor: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  nota:     { icon: '📝', label: 'Nota',     cor: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/30' },
}

const STATUS_CONFIG: Record<StatusAtividade, { label: string; cor: string }> = {
  pendente:  { label: 'Pendente',  cor: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  concluida: { label: 'Concluida', cor: 'bg-green-900/40 text-green-400 border-green-700/50' },
  atrasada:  { label: 'Atrasada',  cor: 'bg-red-900/40 text-red-400 border-red-700/50' },
  cancelada: { label: 'Cancelada', cor: 'bg-gray-800 text-gray-500 border-gray-700' },
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function isToday(d: string): boolean {
  const date = new Date(d)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}
function isPast(d: string): boolean {
  return new Date(d) < new Date()
}

// ── Component ────────────────────────────────────────────────────────
export default function AtividadesPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<StatusAtividade | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<TipoAtividade | 'todos'>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos')

  const [form, setForm] = useState({
    paciente_nome: '',
    tipo: 'whatsapp' as TipoAtividade,
    titulo: '',
    descricao: '',
    data_agendada: '',
    responsavel: '',
  })

  // ── Data Loading ────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .order('data_agendada', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        setErro('Tabela "atividades" nao existe ainda. Aguardando Agente 2 criar o banco.')
      } else {
        setErro(error.message)
      }
      setAtividades([])
    } else {
      setAtividades((data ?? []) as Atividade[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // ── Realtime ────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('atividades-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atividades' }, () => {
        carregar()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [carregar])

  // ── Auto-mark overdue ────────────────────────────────────────────────
  const processadas = useMemo(() => {
    return atividades.map(a => {
      if (a.status === 'pendente' && isPast(a.data_agendada)) {
        return { ...a, status: 'atrasada' as StatusAtividade }
      }
      return a
    })
  }, [atividades])

  // ── Filtered ────────────────────────────────────────────────────────
  const filtradas = useMemo(() => {
    let result = processadas
    if (filtroStatus !== 'todos') {
      result = result.filter(a => a.status === filtroStatus)
    }
    if (filtroTipo !== 'todos') {
      result = result.filter(a => a.tipo === filtroTipo)
    }
    if (filtroPeriodo !== 'todos') {
      const now = new Date()
      result = result.filter(a => {
        const d = new Date(a.data_agendada)
        if (filtroPeriodo === 'hoje') return d.toDateString() === now.toDateString()
        if (filtroPeriodo === 'semana') {
          const weekAgo = new Date(now.getTime() - 7 * 86400000)
          return d >= weekAgo
        }
        if (filtroPeriodo === 'mes') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }
        return true
      })
    }
    return result
  }, [processadas, filtroStatus, filtroTipo, filtroPeriodo])

  // ── KPIs ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const hoje = processadas.filter(a => isToday(a.data_agendada))
    return {
      total: processadas.length,
      hoje: hoje.length,
      pendentes: processadas.filter(a => a.status === 'pendente').length,
      atrasadas: processadas.filter(a => a.status === 'atrasada').length,
      concluidas: processadas.filter(a => a.status === 'concluida').length,
    }
  }, [processadas])

  // ── Actions ────────────────────────────────────────────────────────
  async function concluir(id: string) {
    await supabase.from('atividades').update({
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
    }).eq('id', id)
    carregar()
  }

  async function cancelar(id: string) {
    await supabase.from('atividades').update({ status: 'cancelada' }).eq('id', id)
    carregar()
  }

  async function salvar() {
    if (!form.paciente_nome.trim() || !form.titulo.trim() || !form.data_agendada) return
    setSalvando(true)
    const { error } = await supabase.from('atividades').insert({
      paciente_nome: form.paciente_nome.trim(),
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      data_agendada: new Date(form.data_agendada).toISOString(),
      status: 'pendente',
      responsavel: form.responsavel.trim() || null,
    })
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false)
    setForm({ paciente_nome: '', tipo: 'whatsapp', titulo: '', descricao: '', data_agendada: '', responsavel: '' })
    carregar()
  }

  // ── Group by date ────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const groups: Record<string, Atividade[]> = {}
    filtradas.forEach(a => {
      const key = new Date(a.data_agendada).toDateString()
      if (!groups[key]) groups[key] = []
      groups[key].push(a)
    })
    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }, [filtradas])

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              <span className="text-amber-500">&#128197;</span> Atividades
            </h1>
            <p className="text-gray-400 text-sm mt-1">Timeline de follow-ups e tarefas</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            + Nova Atividade
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Kpi label="Total" valor={String(kpis.total)} cor="text-white" />
          <Kpi label="Hoje" valor={String(kpis.hoje)} cor="text-amber-400" />
          <Kpi label="Pendentes" valor={String(kpis.pendentes)} cor="text-blue-400" />
          <Kpi label="Atrasadas" valor={String(kpis.atrasadas)} cor="text-red-400" />
          <Kpi label="Concluidas" valor={String(kpis.concluidas)} cor="text-green-400" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          {/* Period */}
          <div className="flex gap-1.5">
            {(['todos', 'hoje', 'semana', 'mes'] as const).map(p => (
              <button key={p} onClick={() => setFiltroPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filtroPeriodo === p ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}>
                {p === 'todos' ? 'Todos' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-800" />
          {/* Status */}
          <div className="flex gap-1.5">
            {(['todos', 'pendente', 'atrasada', 'concluida', 'cancelada'] as const).map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filtroStatus === s ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}>
                {s === 'todos' ? 'Status' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-800" />
          {/* Type */}
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value as TipoAtividade | 'todos')}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-gray-400 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos os tipos</option>
            {Object.entries(TIPO_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando atividades...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Nenhuma atividade encontrada.</div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([dateStr, items]) => {
              const d = new Date(dateStr)
              const todayLabel = isToday(dateStr) ? 'Hoje' : formatDate(dateStr)
              const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' })
              return (
                <div key={dateStr}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${isToday(dateStr) ? 'bg-amber-500' : 'bg-gray-700'}`} />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isToday(dateStr) ? 'text-amber-400' : 'text-gray-500'}`}>
                      {todayLabel}
                    </h3>
                    <span className="text-gray-600 text-xs">{dayName}</span>
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-gray-600 text-xs">{items.length} atividade{items.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Activity cards */}
                  <div className="space-y-2 ml-6 border-l-2 border-gray-800 pl-6">
                    {items.map(a => {
                      const tipo = TIPO_CONFIG[a.tipo]
                      const status = STATUS_CONFIG[a.status]
                      return (
                        <div key={a.id} className={`bg-gray-900 border border-gray-800 hover:border-amber-500/30 rounded-xl p-4 transition group`}>
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg shrink-0 ${tipo.bg}`}>
                              {tipo.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white font-medium text-sm">{a.titulo}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${status.cor}`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-amber-400 text-xs mt-1">{a.paciente_nome}</p>
                              {a.descricao && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.descricao}</p>}
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                <span>{tipo.label}</span>
                                <span>{formatTime(a.data_agendada)}</span>
                                {a.responsavel && <span>| {a.responsavel}</span>}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                              {(a.status === 'pendente' || a.status === 'atrasada') && (
                                <>
                                  <button
                                    onClick={() => concluir(a.id)}
                                    className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                                  >
                                    Concluir
                                  </button>
                                  <button
                                    onClick={() => cancelar(a.id)}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">Nova Atividade</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Titulo *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Follow-up pos-consulta"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Paciente *</label>
                <input type="text" value={form.paciente_nome} onChange={e => setForm({ ...form, paciente_nome: e.target.value })}
                  placeholder="Nome do paciente"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoAtividade })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Data/Hora *</label>
                <input type="datetime-local" value={form.data_agendada} onChange={e => setForm({ ...form, data_agendada: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Responsavel</label>
                <input type="text" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })}
                  placeholder="Nome"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Descricao</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Detalhes da atividade..." rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !form.titulo.trim() || !form.paciente_nome.trim() || !form.data_agendada}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Criar Atividade'}
              </button>
              <button onClick={() => setModalAberto(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg transition text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-base font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  )
}
