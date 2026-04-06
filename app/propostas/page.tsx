'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
type StatusProposta = 'rascunho' | 'enviada' | 'aceita' | 'rejeitada' | 'expirada'

interface Proposta {
  id: string
  oportunidade_id: string | null
  paciente_nome: string
  procedimento: string
  valor_total: number
  desconto: number
  entrada: number
  parcelas: number
  taxa_juros: number
  financeira: string | null
  validade_dias: number
  status: StatusProposta
  observacoes: string | null
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusProposta, { label: string; cor: string }> = {
  rascunho:  { label: 'Rascunho',  cor: 'bg-gray-800 text-gray-400 border-gray-700' },
  enviada:   { label: 'Enviada',   cor: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  aceita:    { label: 'Aceita',    cor: 'bg-green-900/40 text-green-400 border-green-700/50' },
  rejeitada: { label: 'Rejeitada', cor: 'bg-red-900/40 text-red-400 border-red-700/50' },
  expirada:  { label: 'Expirada',  cor: 'bg-amber-900/40 text-amber-400 border-amber-700/50' },
}

const PROCEDIMENTOS = ['Implante', 'Protocolo', 'Protese', 'Lente de Contato', 'Clareamento', 'Harmonizacao', 'Botox', 'Ortodontia', 'Estetica', 'Outro']
const FINANCEIRAS = ['Excalibur Pay', 'BV Financeira', 'Crefisa', 'CredPago', 'Particular', 'Outra']
const PARCELAS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 24, 30, 36, 48]

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function calcParcela(total: number, desconto: number, entrada: number, parcelas: number, taxa: number) {
  const valorComDesconto = total - (total * desconto / 100)
  const saldo = Math.max(valorComDesconto - entrada, 0)
  if (parcelas <= 0 || saldo <= 0) return { parcela: 0, totalPago: entrada, juros: 0, valorFinal: valorComDesconto }
  let parcela: number
  if (taxa === 0) {
    parcela = saldo / parcelas
  } else {
    const i = taxa / 100
    parcela = (saldo * i) / (1 - Math.pow(1 + i, -parcelas))
  }
  const totalPago = entrada + parcela * parcelas
  return {
    parcela,
    totalPago,
    juros: totalPago - valorComDesconto,
    valorFinal: valorComDesconto,
  }
}

// ── Component ────────────────────────────────────────────────────────
export default function PropostasPage() {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [detalheAberto, setDetalheAberto] = useState<Proposta | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<StatusProposta | 'todos'>('todos')
  const [busca, setBusca] = useState('')

  const [form, setForm] = useState({
    paciente_nome: '',
    procedimento: 'Implante',
    valor_total: 0,
    desconto: 0,
    entrada: 0,
    parcelas: 12,
    taxa_juros: 0,
    financeira: 'Excalibur Pay',
    validade_dias: 7,
    observacoes: '',
  })

  // ── Data ────────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('propostas_v2')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        // Fallback to propostas table
        const { data: d2, error: e2 } = await supabase.from('propostas').select('*').order('created_at', { ascending: false })
        if (e2) {
          setErro('Tabela de propostas nao encontrada. Aguardando Agente 2.')
          setPropostas([])
        } else {
          // Map old propostas to new format
          setPropostas((d2 ?? []).map((p: Record<string, unknown>) => ({
            ...p,
            desconto: 0,
            validade_dias: 7,
            status: (p.status === 'pendente' ? 'enviada' : p.status === 'aprovado' ? 'aceita' : p.status === 'negado' ? 'rejeitada' : p.status) as StatusProposta,
          })) as Proposta[])
        }
      } else {
        setErro(error.message)
        setPropostas([])
      }
    } else {
      setPropostas((data ?? []) as Proposta[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const channel = supabase
      .channel('propostas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'propostas_v2' }, () => carregar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'propostas' }, () => carregar())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [carregar])

  // ── Simulacao live ────────────────────────────────────────────────
  const sim = useMemo(() =>
    calcParcela(form.valor_total, form.desconto, form.entrada, form.parcelas, form.taxa_juros),
    [form.valor_total, form.desconto, form.entrada, form.parcelas, form.taxa_juros]
  )

  // ── Filtered ────────────────────────────────────────────────────────
  const filtradas = useMemo(() => {
    let result = propostas
    if (filtroStatus !== 'todos') result = result.filter(p => p.status === filtroStatus)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      result = result.filter(p => p.paciente_nome.toLowerCase().includes(q) || p.procedimento.toLowerCase().includes(q))
    }
    return result
  }, [propostas, filtroStatus, busca])

  // ── KPIs ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const aceitas = propostas.filter(p => p.status === 'aceita')
    const enviadas = propostas.filter(p => p.status === 'enviada')
    const total = propostas.length
    const taxaAceite = total > 0 ? (aceitas.length / total * 100) : 0
    return {
      total,
      rascunhos: propostas.filter(p => p.status === 'rascunho').length,
      enviadas: enviadas.length,
      aceitas: aceitas.length,
      valorAceito: aceitas.reduce((s, p) => s + Number(p.valor_total), 0),
      valorPipeline: enviadas.reduce((s, p) => s + Number(p.valor_total), 0),
      taxaAceite,
    }
  }, [propostas])

  // ── Save ────────────────────────────────────────────────────────
  async function salvar() {
    if (!form.paciente_nome.trim() || form.valor_total <= 0) return
    setSalvando(true)
    // Try propostas_v2 first, fallback to propostas
    const payload = {
      paciente_nome: form.paciente_nome.trim(),
      procedimento: form.procedimento,
      valor_total: form.valor_total,
      desconto: form.desconto,
      entrada: form.entrada,
      parcelas: form.parcelas,
      valor_parcela: sim.parcela,
      taxa_juros: form.taxa_juros,
      financeira: form.financeira || null,
      validade_dias: form.validade_dias,
      status: 'rascunho',
      observacoes: form.observacoes.trim() || null,
    }
    let { error } = await supabase.from('propostas_v2').insert(payload)
    if (error && error.code === '42P01') {
      // Fallback: use old propostas table
      const { error: e2 } = await supabase.from('propostas').insert({
        paciente_nome: payload.paciente_nome,
        procedimento: payload.procedimento,
        valor_total: payload.valor_total,
        entrada: payload.entrada,
        parcelas: payload.parcelas,
        valor_parcela: payload.valor_parcela,
        taxa_juros: payload.taxa_juros,
        financeira: payload.financeira,
        status: 'pendente',
        observacoes: payload.observacoes,
      })
      error = e2
    }
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false)
    setForm({ paciente_nome: '', procedimento: 'Implante', valor_total: 0, desconto: 0, entrada: 0, parcelas: 12, taxa_juros: 0, financeira: 'Excalibur Pay', validade_dias: 7, observacoes: '' })
    carregar()
  }

  async function mudarStatus(id: string, status: StatusProposta) {
    // Try both tables
    const { error } = await supabase.from('propostas_v2').update({ status }).eq('id', id)
    if (error) {
      const mapped = status === 'aceita' ? 'aprovado' : status === 'rejeitada' ? 'negado' : status === 'enviada' ? 'pendente' : status
      await supabase.from('propostas').update({ status: mapped }).eq('id', id)
    }
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
              <span className="text-amber-500">&#128196;</span> Propostas
            </h1>
            <p className="text-gray-400 text-sm mt-1">Simulador de parcelamento + gestao de propostas</p>
          </div>
          <button onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            + Nova Proposta
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Kpi label="Total" valor={String(kpis.total)} cor="text-white" />
          <Kpi label="Rascunhos" valor={String(kpis.rascunhos)} cor="text-gray-400" />
          <Kpi label="Enviadas" valor={String(kpis.enviadas)} cor="text-blue-400" />
          <Kpi label="Aceitas" valor={String(kpis.aceitas)} cor="text-green-400" />
          <Kpi label="Valor Aceito" valor={fmt(kpis.valorAceito)} cor="text-green-400" />
          <Kpi label="Taxa Aceite" valor={`${kpis.taxaAceite.toFixed(0)}%`} cor="text-amber-400" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar paciente ou procedimento..."
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 w-72" />
          <div className="flex gap-1.5">
            {(['todos', 'rascunho', 'enviada', 'aceita', 'rejeitada', 'expirada'] as const).map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filtroStatus === s ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}>
                {s === 'todos' ? 'Todas' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>}

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando propostas...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Nenhuma proposta encontrada.</div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(p => {
              const calc = calcParcela(Number(p.valor_total), Number(p.desconto || 0), Number(p.entrada), p.parcelas, Number(p.taxa_juros))
              return (
                <div key={p.id}
                  onClick={() => setDetalheAberto(p)}
                  className="bg-gray-900 border border-gray-800 hover:border-amber-500/30 rounded-xl p-5 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                      {p.paciente_nome.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold">{p.paciente_nome}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_CONFIG[p.status].cor}`}>
                          {STATUS_CONFIG[p.status].label}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{p.procedimento} {p.financeira ? `| ${p.financeira}` : ''}</p>
                    </div>

                    {/* Values */}
                    <div className="text-right shrink-0">
                      <p className="text-amber-400 font-bold">{fmt(calc.valorFinal)}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {p.entrada > 0 ? `${fmt(Number(p.entrada))} + ` : ''}{p.parcelas}x {fmt(calc.parcela)}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0" onClick={e => e.stopPropagation()}>
                      {p.status === 'rascunho' && (
                        <button onClick={() => mudarStatus(p.id, 'enviada')}
                          className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg px-3 py-1.5 text-xs font-medium transition">
                          Enviar
                        </button>
                      )}
                      {p.status === 'enviada' && (
                        <>
                          <button onClick={() => mudarStatus(p.id, 'aceita')}
                            className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded-lg px-3 py-1.5 text-xs font-medium transition">
                            Aceitar
                          </button>
                          <button onClick={() => mudarStatus(p.id, 'rejeitada')}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-lg px-3 py-1.5 text-xs font-medium transition">
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Proposta + Simulador */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">Nova Proposta — Simulador</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Paciente *</label>
                <input type="text" value={form.paciente_nome} onChange={e => setForm({ ...form, paciente_nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Procedimento</label>
                <select value={form.procedimento} onChange={e => setForm({ ...form, procedimento: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {PROCEDIMENTOS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Financeira</label>
                <select value={form.financeira} onChange={e => setForm({ ...form, financeira: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {FINANCEIRAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor Total (R$) *</label>
                <input type="number" step="0.01" value={form.valor_total || ''} onChange={e => setForm({ ...form, valor_total: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Desconto (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.desconto || ''} onChange={e => setForm({ ...form, desconto: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Entrada (R$)</label>
                <input type="number" step="0.01" value={form.entrada || ''} onChange={e => setForm({ ...form, entrada: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Parcelas</label>
                <select value={form.parcelas} onChange={e => setForm({ ...form, parcelas: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {PARCELAS_OPTIONS.map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Taxa juros (% a.m.)</label>
                <input type="number" step="0.01" value={form.taxa_juros || ''} onChange={e => setForm({ ...form, taxa_juros: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Validade (dias)</label>
                <input type="number" min="1" max="90" value={form.validade_dias} onChange={e => setForm({ ...form, validade_dias: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Live Simulator */}
            {form.valor_total > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mt-5">
                <p className="text-amber-400 text-xs uppercase tracking-wider font-bold mb-3">Simulacao em tempo real</p>
                <div className="grid grid-cols-4 gap-4">
                  <SimBox label="Valor Final" valor={fmt(sim.valorFinal)} desc={form.desconto > 0 ? `-${form.desconto}% desc` : 'sem desconto'} cor="text-white" />
                  <SimBox label="Parcela" valor={fmt(sim.parcela)} desc={`${form.parcelas}x`} cor="text-amber-400" />
                  <SimBox label="Total Pago" valor={fmt(sim.totalPago)} desc="entrada + parcelas" cor="text-white" />
                  <SimBox label="Juros Total" valor={fmt(sim.juros)} desc={form.taxa_juros > 0 ? `${form.taxa_juros}% a.m.` : 'sem juros'} cor={sim.juros > 0 ? 'text-red-400' : 'text-green-400'} />
                </div>

                {/* Comparison table */}
                {form.valor_total > 0 && (
                  <div className="mt-4 border-t border-amber-500/20 pt-4">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-2">Comparativo de parcelas</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[6, 12, 18, 24].map(n => {
                        const c = calcParcela(form.valor_total, form.desconto, form.entrada, n, form.taxa_juros)
                        return (
                          <button key={n} type="button"
                            onClick={() => setForm({ ...form, parcelas: n })}
                            className={`text-center p-2 rounded-lg border transition ${
                              form.parcelas === n
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            }`}>
                            <p className="text-white text-sm font-bold">{n}x</p>
                            <p className="text-gray-400 text-[10px]">{fmt(c.parcela)}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="col-span-2 mt-4">
              <label className="text-gray-400 text-xs mb-1.5 block font-medium">Observacoes</label>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Notas internas..." rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !form.paciente_nome.trim() || form.valor_total <= 0}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Criar Proposta'}
              </button>
              <button onClick={() => setModalAberto(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg transition text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Detalhe Modal */}
      {detalheAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setDetalheAberto(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Detalhes da Proposta</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUS_CONFIG[detalheAberto.status].cor}`}>
                {STATUS_CONFIG[detalheAberto.status].label}
              </span>
            </div>

            <div className="space-y-3">
              <DetailRow label="Paciente" value={detalheAberto.paciente_nome} />
              <DetailRow label="Procedimento" value={detalheAberto.procedimento} />
              <DetailRow label="Financeira" value={detalheAberto.financeira || 'N/A'} />
              <DetailRow label="Valor Total" value={fmt(Number(detalheAberto.valor_total))} highlight />
              {detalheAberto.desconto > 0 && <DetailRow label="Desconto" value={`${detalheAberto.desconto}%`} />}
              <DetailRow label="Entrada" value={fmt(Number(detalheAberto.entrada))} />
              <DetailRow label="Parcelas" value={`${detalheAberto.parcelas}x ${fmt(calcParcela(Number(detalheAberto.valor_total), Number(detalheAberto.desconto || 0), Number(detalheAberto.entrada), detalheAberto.parcelas, Number(detalheAberto.taxa_juros)).parcela)}`} />
              <DetailRow label="Taxa" value={`${detalheAberto.taxa_juros}% a.m.`} />
              <DetailRow label="Criada em" value={new Date(detalheAberto.created_at).toLocaleDateString('pt-BR')} />
              {detalheAberto.observacoes && <DetailRow label="Obs" value={detalheAberto.observacoes} />}
            </div>

            <div className="flex gap-2 mt-6">
              {detalheAberto.status === 'rascunho' && (
                <button onClick={() => { mudarStatus(detalheAberto.id, 'enviada'); setDetalheAberto(null) }}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                  Enviar ao Paciente
                </button>
              )}
              {detalheAberto.status === 'enviada' && (
                <>
                  <button onClick={() => { mudarStatus(detalheAberto.id, 'aceita'); setDetalheAberto(null) }}
                    className="flex-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                    Aceitar
                  </button>
                  <button onClick={() => { mudarStatus(detalheAberto.id, 'rejeitada'); setDetalheAberto(null) }}
                    className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                    Rejeitar
                  </button>
                </>
              )}
              <button onClick={() => setDetalheAberto(null)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition text-sm">Fechar</button>
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

function SimBox({ label, valor, desc, cor }: { label: string; valor: string; desc: string; cor: string }) {
  return (
    <div>
      <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${cor}`}>{valor}</p>
      <p className="text-gray-600 text-[10px]">{desc}</p>
    </div>
  )
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
    </div>
  )
}
