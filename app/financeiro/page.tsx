'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type StatusProp = 'pendente' | 'aprovado' | 'negado' | 'pago' | 'cancelado'

interface Proposta {
  id: string
  paciente_id: string | null
  paciente_nome: string
  procedimento: string | null
  valor_total: number
  entrada: number
  parcelas: number
  valor_parcela: number
  taxa_juros: number
  status: StatusProp
  financeira: string | null
  observacoes: string | null
  created_at: string
}

const STATUS: Record<StatusProp, { label: string; cor: string }> = {
  pendente: { label: 'Pendente', cor: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  aprovado: { label: 'Aprovado', cor: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  pago: { label: 'Pago', cor: 'bg-green-900/40 text-green-400 border-green-700/50' },
  negado: { label: 'Negado', cor: 'bg-red-900/40 text-red-400 border-red-700/50' },
  cancelado: { label: 'Cancelado', cor: 'bg-gray-800 text-gray-500 border-gray-700' },
}

function calcParcela(total: number, entrada: number, parcelas: number, taxa: number): number {
  const saldo = Math.max(total - entrada, 0)
  if (parcelas <= 0) return 0
  if (taxa === 0) return saldo / parcelas
  const i = taxa / 100
  return (saldo * i) / (1 - Math.pow(1 + i, -parcelas))
}
function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function FinanceiroPage() {
  const [props, setProps] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<StatusProp | 'todos'>('todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    paciente_nome: '',
    procedimento: 'Implante',
    valor_total: 0,
    entrada: 0,
    parcelas: 12,
    taxa_juros: 0,
    financeira: '',
  })

  async function carregar() {
    setLoading(true); setErro(null)
    const { data, error } = await supabase.from('propostas').select('*').order('created_at', { ascending: false })
    if (error) {
      setErro(error.code === '42P01' ? 'Tabela "propostas" não existe. Rode supabase/migrations/002_agenda_financeiro.sql.' : error.message)
      setProps([])
    } else setProps((data ?? []) as Proposta[])
    setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  const simulacao = useMemo(() => {
    const parcela = calcParcela(form.valor_total, form.entrada, form.parcelas, form.taxa_juros)
    const totalPago = form.entrada + parcela * form.parcelas
    return { parcela, totalPago, juros: totalPago - form.valor_total }
  }, [form])

  async function salvar() {
    if (!form.paciente_nome.trim() || form.valor_total <= 0) return
    setSalvando(true)
    const { error } = await supabase.from('propostas').insert({
      paciente_nome: form.paciente_nome.trim(),
      procedimento: form.procedimento,
      valor_total: form.valor_total,
      entrada: form.entrada,
      parcelas: form.parcelas,
      valor_parcela: simulacao.parcela,
      taxa_juros: form.taxa_juros,
      financeira: form.financeira.trim() || null,
      status: 'pendente',
    })
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false)
    setForm({ paciente_nome: '', procedimento: 'Implante', valor_total: 0, entrada: 0, parcelas: 12, taxa_juros: 0, financeira: '' })
    carregar()
  }

  async function mudarStatus(p: Proposta, s: StatusProp) {
    await supabase.from('propostas').update({ status: s }).eq('id', p.id)
    carregar()
  }

  const filtrados = useMemo(() =>
    filtroStatus === 'todos' ? props : props.filter((p) => p.status === filtroStatus),
    [props, filtroStatus]
  )

  const kpis = useMemo(() => {
    const aprovadas = props.filter((p) => p.status === 'aprovado' || p.status === 'pago')
    const pagas = props.filter((p) => p.status === 'pago')
    return {
      total: props.length,
      valorPipeline: props.filter(p => p.status === 'pendente').reduce((s, p) => s + Number(p.valor_total), 0),
      valorAprovado: aprovadas.reduce((s, p) => s + Number(p.valor_total), 0),
      valorRecebido: pagas.reduce((s, p) => s + Number(p.valor_total), 0),
      taxaAprovacao: props.length > 0 ? (aprovadas.length / props.length * 100) : 0,
    }
  }, [props])

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">💰 Excalibur Pay</h1>
            <p className="text-gray-400 text-sm mt-1">Simulador + Gestão de propostas financeiras</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            + Nova Proposta
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Kpi label="Propostas" valor={String(kpis.total)} sub="total" cor="text-amber-400" />
          <Kpi label="Pipeline" valor={fmt(kpis.valorPipeline)} sub="pendentes" cor="text-blue-400" />
          <Kpi label="Aprovado" valor={fmt(kpis.valorAprovado)} sub="em negócios" cor="text-amber-400" />
          <Kpi label="Recebido" valor={fmt(kpis.valorRecebido)} sub="pagas" cor="text-green-400" />
          <Kpi label="Taxa" valor={`${kpis.taxaAprovacao.toFixed(0)}%`} sub="aprovação" cor="text-amber-400" />
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(['todos', 'pendente', 'aprovado', 'pago', 'negado', 'cancelado'] as const).map((s) => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${filtroStatus === s ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}>
              {s === 'todos' ? 'Todas' : STATUS[s as StatusProp].label}
            </button>
          ))}
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">⚠️ {erro}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Nenhuma proposta.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtrados.map((p) => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 hover:border-amber-600/40 rounded-xl p-5 transition group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{p.paciente_nome}</p>
                    <p className="text-amber-400 text-xs mt-0.5">{p.procedimento}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${STATUS[p.status].cor}`}>{STATUS[p.status].label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Info label="Total" valor={fmt(Number(p.valor_total))} />
                  <Info label="Entrada" valor={fmt(Number(p.entrada))} />
                  <Info label="Parcelas" valor={`${p.parcelas}x ${fmt(Number(p.valor_parcela))}`} />
                </div>
                {p.financeira && <p className="text-gray-500 text-xs mt-3">via {p.financeira}</p>}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                  {p.status === 'pendente' && (
                    <>
                      <button onClick={() => mudarStatus(p, 'aprovado')} className="flex-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-gray-950 border border-amber-500/30 rounded px-3 py-1.5 text-xs font-medium transition">Aprovar</button>
                      <button onClick={() => mudarStatus(p, 'negado')} className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded px-3 py-1.5 text-xs font-medium transition">Negar</button>
                    </>
                  )}
                  {p.status === 'aprovado' && (
                    <button onClick={() => mudarStatus(p, 'pago')} className="flex-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded px-3 py-1.5 text-xs font-medium transition">Marcar como Pago</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-4">💰 Nova Proposta — Simulador</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Paciente *</label>
                <input type="text" value={form.paciente_nome} onChange={(e) => setForm({ ...form, paciente_nome: e.target.value })} placeholder="Nome completo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Procedimento</label>
                <select value={form.procedimento} onChange={(e) => setForm({ ...form, procedimento: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {['Implante', 'Protocolo', 'Prótese', 'Estética', 'Outro'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Financeira</label>
                <input type="text" value={form.financeira} onChange={(e) => setForm({ ...form, financeira: e.target.value })} placeholder="Excalibur Pay"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor Total (R$) *</label>
                <input type="number" step="0.01" value={form.valor_total || ''} onChange={(e) => setForm({ ...form, valor_total: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Entrada (R$)</label>
                <input type="number" step="0.01" value={form.entrada || ''} onChange={(e) => setForm({ ...form, entrada: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Parcelas</label>
                <input type="number" min="1" max="60" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Taxa juros (% a.m.)</label>
                <input type="number" step="0.01" value={form.taxa_juros || ''} onChange={(e) => setForm({ ...form, taxa_juros: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {form.valor_total > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
                <p className="text-amber-400 text-xs uppercase tracking-wider font-semibold mb-2">Simulação</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Parcela</p>
                    <p className="text-white font-bold">{fmt(simulacao.parcela)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total pago</p>
                    <p className="text-white font-bold">{fmt(simulacao.totalPago)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Juros total</p>
                    <p className={`font-bold ${simulacao.juros > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(simulacao.juros)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !form.paciente_nome.trim() || form.valor_total <= 0}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando…' : 'Criar Proposta'}
              </button>
              <button onClick={() => setModalAberto(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg transition text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, valor, sub, cor }: { label: string; valor: string; sub: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 ${cor}`}>{valor}</p>
      <p className="text-gray-600 text-[10px] mt-1">{sub}</p>
    </div>
  )
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-white font-semibold mt-0.5">{valor}</p>
    </div>
  )
}
