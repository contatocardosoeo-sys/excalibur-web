'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
type TipoMeta = 'faturamento' | 'leads' | 'agendamentos' | 'fechamentos' | 'ticket_medio' | 'conversao'
type PeriodoMeta = 'semanal' | 'mensal' | 'trimestral' | 'anual'

interface Meta {
  id: string
  titulo: string
  tipo: TipoMeta
  periodo: PeriodoMeta
  valor_alvo: number
  valor_atual: number
  unidade: string | null
  responsavel: string | null
  data_inicio: string
  data_fim: string
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<TipoMeta, { icon: string; label: string; cor: string; unidade: string }> = {
  faturamento:  { icon: '💰', label: 'Faturamento',  cor: 'text-green-400',  unidade: 'R$' },
  leads:        { icon: '👥', label: 'Leads',        cor: 'text-blue-400',   unidade: 'leads' },
  agendamentos: { icon: '📅', label: 'Agendamentos', cor: 'text-purple-400', unidade: 'agend.' },
  fechamentos:  { icon: '🎯', label: 'Fechamentos',  cor: 'text-amber-400',  unidade: 'vendas' },
  ticket_medio: { icon: '📊', label: 'Ticket Medio', cor: 'text-cyan-400',   unidade: 'R$' },
  conversao:    { icon: '📈', label: 'Conversao',    cor: 'text-orange-400', unidade: '%' },
}

const PERIODO_LABEL: Record<PeriodoMeta, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
}

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtNum(v: number): string {
  return new Intl.NumberFormat('pt-BR').format(v)
}

function diasRestantes(dataFim: string): number {
  return Math.max(0, Math.ceil((new Date(dataFim).getTime() - Date.now()) / 86400000))
}

// ── Component ────────────────────────────────────────────────────────
export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodoMeta | 'todos'>('todos')

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'faturamento' as TipoMeta,
    periodo: 'mensal' as PeriodoMeta,
    valor_alvo: 0,
    valor_atual: 0,
    responsavel: '',
    data_inicio: '',
    data_fim: '',
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .order('data_fim', { ascending: true })

    if (error) {
      if (error.code === '42P01') setErro('Tabela "metas" nao existe. Aguardando Agente 2.')
      else setErro(error.message)
      setMetas([])
    } else {
      setMetas((data ?? []) as Meta[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const channel = supabase
      .channel('metas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'metas' }, () => carregar())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [carregar])

  const filtradas = useMemo(() => {
    if (filtroPeriodo === 'todos') return metas
    return metas.filter(m => m.periodo === filtroPeriodo)
  }, [metas, filtroPeriodo])

  const kpis = useMemo(() => {
    const ativas = metas.filter(m => diasRestantes(m.data_fim) > 0)
    const atingidas = ativas.filter(m => m.valor_alvo > 0 && m.valor_atual >= m.valor_alvo)
    const mediaAtingimento = ativas.length > 0
      ? ativas.reduce((s, m) => s + (m.valor_alvo > 0 ? Math.min(m.valor_atual / m.valor_alvo * 100, 100) : 0), 0) / ativas.length
      : 0
    return {
      total: metas.length,
      ativas: ativas.length,
      atingidas: atingidas.length,
      mediaAtingimento,
    }
  }, [metas])

  async function salvar() {
    if (!form.titulo.trim() || form.valor_alvo <= 0 || !form.data_inicio || !form.data_fim) return
    setSalvando(true)
    const { error } = await supabase.from('metas').insert({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      periodo: form.periodo,
      valor_alvo: form.valor_alvo,
      valor_atual: form.valor_atual,
      unidade: TIPO_CONFIG[form.tipo].unidade,
      responsavel: form.responsavel.trim() || null,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
    })
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false)
    setForm({ titulo: '', tipo: 'faturamento', periodo: 'mensal', valor_alvo: 0, valor_atual: 0, responsavel: '', data_inicio: '', data_fim: '' })
    carregar()
  }

  async function atualizarValor(id: string, novoValor: number) {
    await supabase.from('metas').update({ valor_atual: novoValor }).eq('id', id)
    carregar()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Metas & OKRs</h1>
            <p className="text-gray-400 text-sm mt-1">Acompanhe metas de vendas e indicadores</p>
          </div>
          <button onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            + Nova Meta
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Kpi label="Total Metas" valor={String(kpis.total)} cor="text-white" />
          <Kpi label="Ativas" valor={String(kpis.ativas)} cor="text-amber-400" />
          <Kpi label="Atingidas" valor={String(kpis.atingidas)} cor="text-green-400" />
          <Kpi label="Media Ating." valor={`${kpis.mediaAtingimento.toFixed(0)}%`} cor={kpis.mediaAtingimento >= 80 ? 'text-green-400' : kpis.mediaAtingimento >= 50 ? 'text-amber-400' : 'text-red-400'} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['todos', 'semanal', 'mensal', 'trimestral', 'anual'] as const).map(p => (
            <button key={p} onClick={() => setFiltroPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filtroPeriodo === p ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}>
              {p === 'todos' ? 'Todas' : PERIODO_LABEL[p]}
            </button>
          ))}
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Nenhuma meta encontrada.</div>
        ) : (
          <div className="space-y-4">
            {filtradas.map(m => {
              const tipo = TIPO_CONFIG[m.tipo]
              const progresso = m.valor_alvo > 0 ? (m.valor_atual / m.valor_alvo * 100) : 0
              const atingida = progresso >= 100
              const dias = diasRestantes(m.data_fim)
              const expirada = dias === 0 && !atingida
              const isMonetary = m.tipo === 'faturamento' || m.tipo === 'ticket_medio'

              return (
                <div key={m.id} className={`bg-gray-900 border rounded-xl p-6 transition ${
                  atingida ? 'border-green-500/30' : expirada ? 'border-red-500/30 opacity-60' : 'border-gray-800 hover:border-amber-500/30'
                }`}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl shrink-0">
                      {tipo.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">{m.titulo}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          atingida ? 'bg-green-900/40 text-green-400' : expirada ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {atingida ? 'Atingida' : expirada ? 'Expirada' : PERIODO_LABEL[m.periodo]}
                        </span>
                        {m.responsavel && <span className="text-gray-600 text-xs">| {m.responsavel}</span>}
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className={`font-bold ${tipo.cor}`}>
                            {isMonetary ? fmt(m.valor_atual) : fmtNum(m.valor_atual)}
                            <span className="text-gray-500 font-normal"> / {isMonetary ? fmt(m.valor_alvo) : `${fmtNum(m.valor_alvo)} ${tipo.unidade}`}</span>
                          </span>
                          <span className={`font-bold text-sm ${
                            progresso >= 100 ? 'text-green-400' : progresso >= 70 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {progresso.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progresso >= 100 ? 'bg-green-500' : progresso >= 70 ? 'bg-amber-500' : progresso >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(progresso, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(m.data_inicio).toLocaleDateString('pt-BR')} - {new Date(m.data_fim).toLocaleDateString('pt-BR')}</span>
                          {dias > 0 && <span className="text-amber-400">{dias} dias restantes</span>}
                        </div>
                      </div>
                    </div>

                    {/* Quick update */}
                    {!atingida && !expirada && (
                      <div className="shrink-0">
                        <input
                          type="number"
                          step={isMonetary ? '0.01' : '1'}
                          defaultValue={m.valor_atual}
                          onBlur={e => {
                            const v = Number(e.target.value)
                            if (v !== m.valor_atual) atualizarValor(m.id, v)
                          }}
                          className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
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
            <h2 className="text-white font-bold text-lg mb-5">Nova Meta</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Titulo *</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Faturamento Abril 2026"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoMeta })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Periodo</label>
                  <select value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value as PeriodoMeta })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    {Object.entries(PERIODO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor Alvo *</label>
                  <input type="number" step="0.01" value={form.valor_alvo || ''} onChange={e => setForm({ ...form, valor_alvo: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor Atual</label>
                  <input type="number" step="0.01" value={form.valor_atual || ''} onChange={e => setForm({ ...form, valor_atual: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Responsavel</label>
                <input type="text" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })}
                  placeholder="Time ou pessoa"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Data Inicio *</label>
                  <input type="date" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Data Fim *</label>
                  <input type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !form.titulo.trim() || form.valor_alvo <= 0 || !form.data_inicio || !form.data_fim}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Criar Meta'}
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
