'use client'

import { useEffect, useState, useCallback, useMemo, DragEvent } from 'react'
import Sidebar from '../components/Sidebar'
import type { Oportunidade } from '../lib/database.types'

// ── Types ────────────────────────────────────────────────────────────
interface OportunidadeKPIs {
  valor_bruto_pipeline: number
  forecast_ponderado: number
  taxa_conversao: number
  total_ativas: number
  ganhas: number
  perdidas: number
}

type Estagio = 'Qualificacao' | 'Proposta Enviada' | 'Negociacao' | 'Fechamento' | 'Ganho' | 'Perdido'

const ESTAGIOS: { key: Estagio; label: string; cor: string; bg: string; prob: number }[] = [
  { key: 'Qualificacao',     label: 'Qualificacao',     cor: 'text-blue-400',   bg: 'border-blue-500/30',   prob: 20 },
  { key: 'Proposta Enviada', label: 'Proposta Enviada', cor: 'text-purple-400', bg: 'border-purple-500/30', prob: 40 },
  { key: 'Negociacao',       label: 'Negociacao',       cor: 'text-amber-400',  bg: 'border-amber-500/30',  prob: 70 },
  { key: 'Fechamento',       label: 'Fechamento',       cor: 'text-orange-400', bg: 'border-orange-500/30', prob: 90 },
  { key: 'Ganho',            label: 'Ganho',            cor: 'text-green-400',  bg: 'border-green-500/30',  prob: 100 },
  { key: 'Perdido',          label: 'Perdido',          cor: 'text-red-400',    bg: 'border-red-500/30',    prob: 0 },
]

const ORIGENS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', google: '🔍', indicacao: '🤝', manual: '📌', outro: '📌',
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
  const [kpis, setKpis] = useState<OportunidadeKPIs>({
    valor_bruto_pipeline: 0, forecast_ponderado: 0, taxa_conversao: 0,
    total_ativas: 0, ganhas: 0, perdidas: 0,
  })
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverEstagio, setDragOverEstagio] = useState<Estagio | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    valor: 0,
    probabilidade: 20,
    procedimento: 'Implante',
    origem: 'whatsapp',
    observacoes: '',
  })

  // ── Data Loading via API ────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      const res = await fetch(`/api/oportunidades?${params}`)
      const json = await res.json()
      if (json.erro) {
        setErro(json.erro)
        setOportunidades([])
      } else {
        setOportunidades(json.oportunidades || [])
        if (json.kpis) setKpis(json.kpis)
      }
    } catch {
      setErro('Erro ao conectar com API')
    }
    setLoading(false)
  }, [busca])

  useEffect(() => { carregar() }, [carregar])

  // ── Filtered by search (client-side for instant feedback) ────────────
  const filtradas = useMemo(() => {
    if (!busca.trim()) return oportunidades
    const q = busca.toLowerCase()
    return oportunidades.filter(o =>
      o.titulo?.toLowerCase().includes(q) ||
      o.procedimento?.toLowerCase().includes(q)
    )
  }, [oportunidades, busca])

  // ── Drag & Drop ────────────────────────────────────────────────────
  function handleDragStart(e: DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: DragEvent, estagio: Estagio) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverEstagio(estagio)
  }

  function handleDragLeave() {
    setDragOverEstagio(null)
  }

  async function handleDrop(e: DragEvent, novoEstagio: Estagio) {
    e.preventDefault()
    setDragOverEstagio(null)
    if (!draggedId) return

    const op = oportunidades.find(o => o.id === draggedId)
    if (!op || op.estagio === novoEstagio) {
      setDraggedId(null)
      return
    }

    // Optimistic update
    setOportunidades(prev =>
      prev.map(o => o.id === draggedId ? { ...o, estagio: novoEstagio } : o)
    )
    setDraggedId(null)

    try {
      const res = await fetch(`/api/oportunidades/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estagio: novoEstagio }),
      })
      const json = await res.json()
      if (json.erro) {
        carregar() // Revert
      } else {
        // Refresh KPIs
        carregar()
      }
    } catch {
      carregar()
    }
  }

  // ── Save ────────────────────────────────────────────────────────────
  async function salvar() {
    if (!form.titulo.trim() || form.valor <= 0) return
    setSalvando(true)
    try {
      const res = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          valor: form.valor,
          probabilidade: form.probabilidade,
          estagio: 'Qualificacao',
          procedimento: form.procedimento,
          origem: form.origem,
          observacoes: form.observacoes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.erro) {
        setErro(json.erro)
      } else {
        setModalAberto(false)
        setForm({ titulo: '', valor: 0, probabilidade: 20, procedimento: 'Implante', origem: 'whatsapp', observacoes: '' })
        carregar()
      }
    } catch {
      setErro('Erro ao criar oportunidade')
    }
    setSalvando(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function deletar(id: string) {
    if (!confirm('Remover esta oportunidade?')) return
    await fetch(`/api/oportunidades/${id}`, { method: 'DELETE' })
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
            <h1 className="text-white text-2xl font-bold">Oportunidades</h1>
            <p className="text-gray-400 text-sm mt-1">Pipeline de vendas com drag & drop</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModalAberto(true)}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
              + Nova Oportunidade
            </button>
          </div>
        </div>

        {/* KPIs — 6 cards baseados na API */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <KpiCard label="Valor Bruto" valor={fmt(kpis.valor_bruto_pipeline)} cor="text-amber-400" />
          <KpiCard label="Forecast" valor={fmt(kpis.forecast_ponderado)} cor="text-blue-400" />
          <KpiCard label="Conversao" valor={`${kpis.taxa_conversao}%`} cor="text-green-400" />
          <KpiCard label="Ativas" valor={String(kpis.total_ativas)} cor="text-white" />
          <KpiCard label="Ganhas" valor={String(kpis.ganhas)} cor="text-green-400" />
          <KpiCard label="Perdidas" valor={String(kpis.perdidas)} cor="text-red-400" />
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6 items-center">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por cliente, procedimento, vendedor..."
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 flex-1 max-w-md"
          />
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando pipeline...</div>
        ) : (
          <div className="grid grid-cols-6 gap-3 min-h-[60vh]">
            {ESTAGIOS.map(estagio => {
              const cards = filtradas.filter(o => o.estagio === estagio.key)
              const valorTotal = cards.reduce((s, o) => s + Number(o.valor || 0), 0)
              const isOver = dragOverEstagio === estagio.key

              return (
                <div
                  key={estagio.key}
                  onDragOver={e => handleDragOver(e, estagio.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, estagio.key)}
                  className={`bg-gray-900/50 border rounded-xl p-3 transition-all ${estagio.bg} ${
                    isOver ? 'bg-amber-500/5 border-amber-500/50 scale-[1.01]' : ''
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${estagio.cor}`}>
                        {estagio.label}
                      </span>
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full font-semibold">
                        {cards.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-gray-500 font-medium">{fmt(valorTotal)}</p>
                    <p className="text-[10px] text-gray-600">{estagio.prob}% prob.</p>
                  </div>

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
                        {/* Avatar + Name */}
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {(op.titulo || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium leading-tight truncate">{op.titulo}</p>
                            {op.procedimento && (
                              <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                {op.procedimento}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Value + Probability */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-amber-400 text-xs font-bold">{fmt(Number(op.valor || 0))}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            op.probabilidade >= 70 ? 'bg-green-900/50 text-green-300 border border-green-700/50' :
                            op.probabilidade >= 40 ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50' :
                            'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                          }`}>
                            {op.probabilidade}%
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                          <span>{ORIGENS[op.origem] || '📌'} {op.origem}</span>
                          <span>{timeAgo(op.created_at)}</span>
                        </div>

                        {/* Delete on hover */}
                        <button
                          onClick={e => { e.stopPropagation(); deletar(op.id) }}
                          className="mt-2 w-full opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded px-2 py-1 text-[10px] font-medium transition"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">Nova Oportunidade</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Titulo / Cliente *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Nome do lead ou oportunidade"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor (R$) *</label>
                  <input type="number" step="0.01" value={form.valor || ''} onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Probabilidade (%)</label>
                  <input type="number" min="0" max="100" value={form.probabilidade} onChange={e => setForm({ ...form, probabilidade: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Procedimento</label>
                  <select value={form.procedimento} onChange={e => setForm({ ...form, procedimento: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    {['Implante', 'Protocolo', 'Protese', 'Lente', 'Clareamento', 'Harmonizacao', 'Botox', 'Ortodontia', 'Estetica', 'Outro'].map(p =>
                      <option key={p}>{p}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Origem</label>
                  <select value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google</option>
                    <option value="indicacao">Indicacao</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  rows={3} placeholder="Notas sobre a oportunidade..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !form.titulo.trim() || form.valor <= 0}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Criar Oportunidade'}
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

function KpiCard({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  )
}
