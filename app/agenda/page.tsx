'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type StatusAg = 'agendado' | 'confirmado' | 'compareceu' | 'cancelado' | 'noshow'

interface Agendamento {
  id: string
  paciente_id: string | null
  paciente_nome: string
  telefone: string | null
  data: string
  hora: string
  duracao_min: number | null
  procedimento: string | null
  status: StatusAg
  observacoes: string | null
  created_at: string
}

interface PacienteLite {
  id: string
  nome: string
  telefone: string | null
  procedimento: string | null
}

const STATUS: Record<StatusAg, { label: string; cor: string }> = {
  agendado: { label: 'Agendado', cor: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  confirmado: { label: 'Confirmado', cor: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  compareceu: { label: 'Compareceu', cor: 'bg-green-900/40 text-green-400 border-green-700/50' },
  cancelado: { label: 'Cancelado', cor: 'bg-gray-800 text-gray-500 border-gray-700' },
  noshow: { label: 'No-show', cor: 'bg-red-900/40 text-red-400 border-red-700/50' },
}

const vazio: Partial<Agendamento> = {
  paciente_nome: '',
  telefone: '',
  data: new Date().toISOString().slice(0, 10),
  hora: '09:00',
  duracao_min: 60,
  procedimento: 'Avaliação',
  status: 'agendado',
  observacoes: '',
}

function hoje(): string { return new Date().toISOString().slice(0, 10) }
function amanha(): string { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) }
function weekBounds(): [string, string] {
  const d = new Date(); const dia = d.getDay()
  const s = new Date(d); s.setDate(d.getDate() - dia)
  const e = new Date(s); e.setDate(s.getDate() + 6)
  return [s.toISOString().slice(0, 10), e.toISOString().slice(0, 10)]
}
function formatPhone(p: string | null): string {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

export default function AgendaPage() {
  const [ags, setAgs] = useState<Agendamento[]>([])
  const [pacientes, setPacientes] = useState<PacienteLite[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'hoje' | 'semana' | 'todos'>('hoje')
  const [filtroStatus, setFiltroStatus] = useState<StatusAg | 'todos'>('todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Partial<Agendamento>>(vazio)
  const [salvando, setSalvando] = useState(false)
  const [buscaPac, setBuscaPac] = useState('')

  async function carregar() {
    setLoading(true); setErro(null)
    const { data, error } = await supabase.from('agendamentos').select('*').order('data').order('hora')
    if (error) {
      setErro(error.code === '42P01' ? 'Tabela "agendamentos" não existe. Rode supabase/migrations/002_agenda_financeiro.sql.' : error.message)
      setAgs([])
    } else setAgs((data ?? []) as Agendamento[])
    const { data: pacs } = await supabase.from('pacientes').select('id,nome,telefone,procedimento').eq('status', 'ativo').order('nome')
    setPacientes((pacs ?? []) as PacienteLite[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() { setEditando({ ...vazio, data: hoje() }); setBuscaPac(''); setModalAberto(true) }
  function abrirEdit(a: Agendamento) { setEditando({ ...a }); setBuscaPac(a.paciente_nome); setModalAberto(true) }

  async function salvar() {
    if (!editando.paciente_nome?.trim() || !editando.data || !editando.hora) return
    setSalvando(true)
    const payload = {
      paciente_id: editando.paciente_id || null,
      paciente_nome: editando.paciente_nome.trim(),
      telefone: editando.telefone?.trim() || null,
      data: editando.data,
      hora: editando.hora,
      duracao_min: editando.duracao_min || 60,
      procedimento: editando.procedimento || null,
      status: (editando.status || 'agendado') as StatusAg,
      observacoes: editando.observacoes?.trim() || null,
    }
    const { error } = editando.id
      ? await supabase.from('agendamentos').update(payload).eq('id', editando.id)
      : await supabase.from('agendamentos').insert(payload)
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false); carregar()
  }

  async function mudarStatus(a: Agendamento, s: StatusAg) {
    await supabase.from('agendamentos').update({ status: s }).eq('id', a.id)
    carregar()
  }

  function selecionarPaciente(p: PacienteLite) {
    setEditando({ ...editando, paciente_id: p.id, paciente_nome: p.nome, telefone: p.telefone, procedimento: p.procedimento || editando.procedimento })
    setBuscaPac(p.nome)
  }

  const filtrados = useMemo(() => {
    const [ws, we] = weekBounds(); const h = hoje()
    return ags.filter((a) => {
      if (filtro === 'hoje' && a.data !== h) return false
      if (filtro === 'semana' && (a.data < ws || a.data > we)) return false
      if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
      return true
    })
  }, [ags, filtro, filtroStatus])

  const kpis = useMemo(() => {
    const h = hoje(); const am = amanha()
    const doDia = ags.filter((a) => a.data === h)
    return {
      hoje: doDia.length,
      confirmados: doDia.filter((a) => a.status === 'confirmado').length,
      aguardando: doDia.filter((a) => a.status === 'agendado').length,
      amanha: ags.filter((a) => a.data === am).length,
      compareceu: doDia.filter((a) => a.status === 'compareceu').length,
    }
  }, [ags])

  const pacFiltrados = useMemo(() => pacientes.filter((p) => p.nome.toLowerCase().includes(buscaPac.toLowerCase())).slice(0, 6), [pacientes, buscaPac])

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">📅 Agenda</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie os agendamentos da clínica</p>
          </div>
          <button onClick={abrirNovo} className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            + Novo Agendamento
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Kpi label="Hoje" valor={kpis.hoje} sub="agendamentos" cor="text-amber-400" />
          <Kpi label="Confirmados" valor={kpis.confirmados} sub="para hoje" cor="text-green-400" />
          <Kpi label="Aguardando" valor={kpis.aguardando} sub="confirmação" cor="text-blue-400" />
          <Kpi label="Compareceu" valor={kpis.compareceu} sub="hoje" cor="text-green-400" />
          <Kpi label="Amanhã" valor={kpis.amanha} sub="agendamentos" cor="text-amber-400" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['hoje', 'semana', 'todos'] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${filtro === f ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}>
              {f === 'hoje' ? 'Hoje' : f === 'semana' ? 'Esta semana' : 'Todos'}
            </button>
          ))}
          <div className="w-px bg-gray-800 mx-2" />
          {(['todos', 'agendado', 'confirmado', 'compareceu', 'cancelado', 'noshow'] as const).map((s) => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${filtroStatus === s ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}>
              {s === 'todos' ? 'Todos' : STATUS[s as StatusAg].label}
            </button>
          ))}
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">⚠️ {erro}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Nenhum agendamento encontrado.</div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((a) => (
              <div key={a.id} className="bg-gray-900 border border-gray-800 hover:border-amber-600/40 rounded-xl p-4 flex items-center gap-4 transition group">
                <div className="w-16 text-center shrink-0">
                  <p className="text-amber-400 font-bold text-lg leading-none">{a.hora.slice(0, 5)}</p>
                  <p className="text-gray-500 text-[10px] uppercase mt-1">
                    {new Date(a.data + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{a.paciente_nome}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    {a.procedimento && <span>{a.procedimento}</span>}
                    {a.telefone && <span>· {formatPhone(a.telefone)}</span>}
                    <span>· {a.duracao_min || 60}min</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${STATUS[a.status].cor}`}>
                  {STATUS[a.status].label}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {a.status === 'agendado' && (
                    <button onClick={() => mudarStatus(a, 'confirmado')} className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-gray-950 border border-amber-500/30 rounded px-3 py-1 text-xs font-medium transition">Confirmar</button>
                  )}
                  {(a.status === 'agendado' || a.status === 'confirmado') && (
                    <button onClick={() => mudarStatus(a, 'compareceu')} className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded px-3 py-1 text-xs font-medium transition">Compareceu</button>
                  )}
                  <button onClick={() => abrirEdit(a)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded px-3 py-1 text-xs transition">Editar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-4">{editando.id ? '✏️ Editar Agendamento' : '+ Novo Agendamento'}</h2>
            <div className="mb-4 relative">
              <label className="text-gray-400 text-xs mb-1.5 block font-medium">Paciente *</label>
              <input type="text" value={buscaPac}
                onChange={(e) => { setBuscaPac(e.target.value); setEditando({ ...editando, paciente_id: null, paciente_nome: e.target.value }) }}
                placeholder="Buscar paciente ou digitar nome…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition" />
              {buscaPac && !editando.paciente_id && pacFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-56 overflow-y-auto z-10">
                  {pacFiltrados.map((p) => (
                    <button key={p.id} onClick={() => selecionarPaciente(p)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-white border-b border-gray-700 last:border-0">
                      <div className="font-medium">{p.nome}</div>
                      {p.procedimento && <div className="text-xs text-amber-400">{p.procedimento}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Data *" type="date" value={editando.data || ''} onChange={(v) => setEditando({ ...editando, data: v })} />
              <Campo label="Hora *" type="time" value={editando.hora || ''} onChange={(v) => setEditando({ ...editando, hora: v })} />
              <Campo label="Telefone" value={editando.telefone || ''} onChange={(v) => setEditando({ ...editando, telefone: v })} placeholder="(48) 99999-9999" />
              <Campo label="Duração (min)" type="number" value={String(editando.duracao_min || 60)} onChange={(v) => setEditando({ ...editando, duracao_min: Number(v) })} />
              <Campo label="Procedimento" value={editando.procedimento || ''} onChange={(v) => setEditando({ ...editando, procedimento: v })} placeholder="Avaliação" />
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Status</label>
                <select value={editando.status || 'agendado'} onChange={(e) => setEditando({ ...editando, status: e.target.value as StatusAg })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {(Object.keys(STATUS) as StatusAg[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-gray-400 text-xs mb-1.5 block font-medium">Observações</label>
              <textarea value={editando.observacoes || ''} onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !editando.paciente_nome?.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando…' : editando.id ? 'Salvar' : 'Agendar'}
              </button>
              <button onClick={() => setModalAberto(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg transition text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, valor, sub, cor }: { label: string; valor: number; sub: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${cor}`}>{valor}</p>
      <p className="text-gray-600 text-[10px] mt-1">{sub}</p>
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-gray-400 text-xs mb-1.5 block font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition" />
    </div>
  )
}
