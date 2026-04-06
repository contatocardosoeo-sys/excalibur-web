'use client'

import { useEffect, useState, useCallback, useMemo, DragEvent } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
type EtapaOp = 'qualificacao' | 'proposta_enviada' | 'negociacao' | 'fechamento' | 'ganho' | 'perdido'
type Temperatura = 'frio' | 'morno' | 'quente'
type Origem = 'whatsapp' | 'instagram' | 'google' | 'indicacao' | 'outro'

interface Oportunidade {
  id: string
  lead_id: string | null
  nome: string
  telefone: string
  procedimento: string
  valor_estimado: number
  etapa: EtapaOp
  temperatura: Temperatura
  origem: Origem
  vendedor: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

// ── Constants ────────────────────────────────────────────────────────
const ETAPAS: { key: EtapaOp; label: string; cor: string; bg: string }[] = [
  { key: 'qualificacao', label: 'Qualificacao', cor: 'text-blue-400', bg: 'border-blue-500/30' },
  { key: 'proposta_enviada', label: 'Proposta Enviada', cor: 'text-purple-400', bg: 'border-purple-500/30' },
  { key: 'negociacao', label: 'Negociacao', cor: 'text-amber-400', bg: 'border-amber-500/30' },
  { key: 'fechamento', label: 'Fechamento', cor: 'text-orange-400', bg: 'border-orange-500/30' },
  { key: 'ganho', label: 'Ganho', cor: 'text-green-400', bg: 'border-green-500/30' },
  { key: 'perdido', label: 'Perdido', cor: 'text-red-400', bg: 'border-red-500/30' },
]

const TEMP_BADGE: Record<Temperatura, { label: string; cor: string }> = {
  frio: { label: 'FRIO', cor: 'bg-blue-900/50 text-blue-300 border-blue-700/50' },
  morno: { label: 'MORNO', cor: 'bg-amber-900/50 text-amber-300 border-amber-700/50' },
  quente: { label: 'QUENTE', cor: 'bg-red-900/50 text-red-300 border-red-700/50' },
}

const ORIGEM_ICON: Record<Origem, string> = {
  whatsapp: '💬',
  instagram: '📸',
  google: '🔍',
  indicacao: '🤝',
  outro: '📌',
}

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

// ── Component ────────────────────────────────────────────────────────
export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverEtapa, setDragOverEtapa] = useState<EtapaOp | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroTemp, setFiltroTemp] = useState<Temperatura | 'todos'>('todos')

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    procedimento: 'Implante',
    valor_estimado: 0,
    etapa: 'qualificacao' as EtapaOp,
    temperatura: 'morno' as Temperatura,
    origem: 'whatsapp' as Origem,
    vendedor: '',
    observacoes: '',
  })

  // ── Data Loading ────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('oportunidades')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        setErro('Tabela "oportunidades" nao existe ainda. Aguardando Agente 2 criar o banco.')
      } else {
        setErro(error.message)
      }
      setOportunidades([])
    } else {
      setOportunidades((data ?? []) as Oportunidade[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // ── Realtime ────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('oportunidades-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oportunidades' }, () => {
        carregar()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [carregar])

  // ── Filtered Data ────────────────────────────────────────────────────
  const filtradas = useMemo(() => {
    let result = oportunidades
    if (busca.trim()) {
      const q = busca.toLowerCase()
      result = result.filter(o =>
        o.nome.toLowerCase().includes(q) ||
        o.procedimento.toLowerCase().includes(q) ||
        o.telefone.includes(q)
      )
    }
    if (filtroTemp !== 'todos') {
      result = result.filter(o => o.temperatura === filtroTemp)
    }
    return result
  }, [oportunidades, busca, filtroTemp])

  // ── KPIs ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const ganhas = oportunidades.filter(o => o.etapa === 'ganho')
    const perdidas = oportunidades.filter(o => o.etapa === 'perdido')
    const ativas = oportunidades.filter(o => o.etapa !== 'ganho' && o.etapa !== 'perdido')
    const pipeline = ativas.reduce((s, o) => s + Number(o.valor_estimado), 0)
    const fechado = ganhas.reduce((s, o) => s + Number(o.valor_estimado), 0)
    const taxaConversao = (ganhas.length + perdidas.length) > 0
      ? (ganhas.length / (ganhas.length + perdidas.length) * 100)
      : 0
    return {
      total: oportunidades.length,
      ativas: ativas.length,
      pipeline,
      fechado,
      taxaConversao,
      quentes: oportunidades.filter(o => o.temperatura === 'quente' && o.etapa !== 'ganho' && o.etapa !== 'perdido').length,
    }
  }, [oportunidades])

  // ── Drag & Drop ────────────────────────────────────────────────────
  function handleDragStart(e: DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: DragEvent, etapa: EtapaOp) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverEtapa(etapa)
  }

  function handleDragLeave() {
    setDragOverEtapa(null)
  }

  async function handleDrop(e: DragEvent, novaEtapa: EtapaOp) {
    e.preventDefault()
    setDragOverEtapa(null)
    if (!draggedId) return

    const op = oportunidades.find(o => o.id === draggedId)
    if (!op || op.etapa === novaEtapa) {
      setDraggedId(null)
      return
    }

    // Optimistic update
    setOportunidades(prev =>
      prev.map(o => o.id === draggedId ? { ...o, etapa: novaEtapa, updated_at: new Date().toISOString() } : o)
    )
    setDraggedId(null)

    const { error } = await supabase
      .from('oportunidades')
      .update({ etapa: novaEtapa, updated_at: new Date().toISOString() })
      .eq('id', draggedId)

    if (error) {
      carregar() // Revert on error
    }
  }

  // ── Save ────────────────────────────────────────────────────────────
  async function salvar() {
    if (!form.nome.trim() || form.valor_estimado <= 0) return
    setSalvando(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('oportunidades').insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      procedimento: form.procedimento,
      valor_estimado: form.valor_estimado,
      etapa: form.etapa,
      temperatura: form.temperatura,
      origem: form.origem,
      vendedor: form.vendedor.trim() || null,
      observacoes: form.observacoes.trim() || null,
      created_at: now,
      updated_at: now,
    })
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setModalAberto(false)
    setForm({
      nome: '', telefone: '', procedimento: 'Implante', valor_estimado: 0,
      etapa: 'qualificacao', temperatura: 'morno', origem: 'whatsapp', vendedor: '', observacoes: '',
    })
    carregar()
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              <span className="text-amber-500">&#9878;</span> Oportunidades
            </h1>
            <p className="text-gray-400 text-sm mt-1">Pipeline de vendas com drag & drop</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            + Nova Oportunidade
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Kpi label="Total" valor={String(kpis.total)} cor="text-white" />
          <Kpi label="Ativas" valor={String(kpis.ativas)} cor="text-amber-400" />
          <Kpi label="Pipeline" valor={fmt(kpis.pipeline)} cor="text-blue-400" />
          <Kpi label="Fechado" valor={fmt(kpis.fechado)} cor="text-green-400" />
          <Kpi label="Conversao" valor={`${kpis.taxaConversao.toFixed(0)}%`} cor="text-amber-400" />
          <Kpi label="Quentes" valor={String(kpis.quentes)} cor="text-red-400" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar nome, procedimento, telefone..."
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 w-72"
          />
          <div className="flex gap-1.5">
            {(['todos', 'frio', 'morno', 'quente'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTemp(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filtroTemp === t
                    ? 'bg-amber-500 text-gray-950'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {t === 'todos' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            {erro}
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando oportunidades...</div>
        ) : (
          <div className="grid grid-cols-6 gap-3 min-h-[60vh]">
            {ETAPAS.map(etapa => {
              const cards = filtradas.filter(o => o.etapa === etapa.key)
              const valorTotal = cards.reduce((s, o) => s + Number(o.valor_estimado), 0)
              const isOver = dragOverEtapa === etapa.key

              return (
                <div
                  key={etapa.key}
                  onDragOver={e => handleDragOver(e, etapa.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, etapa.key)}
                  className={`bg-gray-900/50 border rounded-xl p-3 transition-all ${etapa.bg} ${
                    isOver ? 'bg-amber-500/5 border-amber-500/50 scale-[1.01]' : ''
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${etapa.cor}`}>
                        {etapa.label}
                      </span>
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full font-semibold">
                        {cards.length}
                      </span>
                    </div>
                  </div>
                  {valorTotal > 0 && (
                    <p className="text-[10px] text-gray-500 mb-3 font-medium">{fmt(valorTotal)}</p>
                  )}

                  {/* Cards */}
                  <div className="space-y-2 min-h-[200px]">
                    {cards.map(op => (
                      <div
                        key={op.id}
                        draggable
                        onDragStart={e => handleDragStart(e, op.id)}
                        className={`bg-gray-800 hover:bg-gray-750 border border-gray-700/50 hover:border-amber-500/30 rounded-lg p-3 cursor-grab active:cursor-grabbing transition group ${
                          draggedId === op.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-white text-sm font-medium leading-tight">{op.nome}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${TEMP_BADGE[op.temperatura].cor}`}>
                            {TEMP_BADGE[op.temperatura].label}
                          </span>
                        </div>

                        {/* Procedure + Value */}
                        <p className="text-amber-400 text-xs mt-1.5 font-medium">{fmt(Number(op.valor_estimado))}</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">{op.procedimento}</p>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                          <span>{ORIGEM_ICON[op.origem]} {op.origem}</span>
                          {op.vendedor && <span>| {op.vendedor}</span>}
                        </div>

                        {/* Time */}
                        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(op.updated_at)} atras</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Oportunidade */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">Nova Oportunidade</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do lead/paciente"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  placeholder="48999001122"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor Estimado (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_estimado || ''}
                  onChange={e => setForm({ ...form, valor_estimado: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Procedimento</label>
                <select
                  value={form.procedimento}
                  onChange={e => setForm({ ...form, procedimento: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {['Implante', 'Protocolo', 'Protese', 'Estetica', 'Lente', 'Clareamento', 'Outro'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Temperatura</label>
                <select
                  value={form.temperatura}
                  onChange={e => setForm({ ...form, temperatura: e.target.value as Temperatura })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="frio">Frio</option>
                  <option value="morno">Morno</option>
                  <option value="quente">Quente</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Origem</label>
                <select
                  value={form.origem}
                  onChange={e => setForm({ ...form, origem: e.target.value as Origem })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="google">Google</option>
                  <option value="indicacao">Indicacao</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Vendedor</label>
                <input
                  type="text"
                  value={form.vendedor}
                  onChange={e => setForm({ ...form, vendedor: e.target.value })}
                  placeholder="Nome do vendedor"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Observacoes</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Notas sobre a oportunidade..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim() || form.valor_estimado <= 0}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
              >
                {salvando ? 'Salvando...' : 'Criar Oportunidade'}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────
function Kpi({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-base font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  )
}
