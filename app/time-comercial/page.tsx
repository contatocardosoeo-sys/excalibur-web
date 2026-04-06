'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
type CargoVendedor = 'closer' | 'sdr' | 'gerente' | 'recepcionista' | 'coordenador'
type StatusVendedor = 'ativo' | 'inativo' | 'ferias'

interface Vendedor {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cargo: CargoVendedor
  status: StatusVendedor
  foto_url: string | null
  meta_mensal: number
  created_at: string
}

interface PerformanceVendedor {
  vendedor_id: string
  vendedor_nome: string
  leads_atribuidos: number
  oportunidades: number
  propostas_enviadas: number
  propostas_aceitas: number
  valor_fechado: number
  taxa_conversao: number
}

// ── Constants ────────────────────────────────────────────────────────
const CARGO_CONFIG: Record<CargoVendedor, { label: string; cor: string }> = {
  closer:        { label: 'Closer',        cor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  sdr:           { label: 'SDR',           cor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  gerente:       { label: 'Gerente',       cor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  recepcionista: { label: 'Recepcionista', cor: 'bg-green-500/20 text-green-400 border-green-500/30' },
  coordenador:   { label: 'Coordenador',  cor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
}

const STATUS_COR: Record<StatusVendedor, string> = {
  ativo: 'bg-green-500',
  inativo: 'bg-gray-500',
  ferias: 'bg-amber-500',
}

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ── Component ────────────────────────────────────────────────────────
export default function TimeComercialPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [performance, setPerformance] = useState<PerformanceVendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [tab, setTab] = useState<'equipe' | 'ranking'>('equipe')
  const [filtroCargo, setFiltroCargo] = useState<CargoVendedor | 'todos'>('todos')

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: 'closer' as CargoVendedor,
    meta_mensal: 0,
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .order('nome')

    if (error) {
      if (error.code === '42P01') {
        setErro('Tabela "vendedores" nao existe ainda. Aguardando Agente 2 criar o banco.')
      } else {
        setErro(error.message)
      }
      setVendedores([])
    } else {
      setVendedores((data ?? []) as Vendedor[])
    }

    // Load performance data
    const { data: perfData } = await supabase
      .from('vendedor_performance')
      .select('*')
      .order('valor_fechado', { ascending: false })

    if (perfData) setPerformance(perfData as PerformanceVendedor[])

    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = useMemo(() => {
    if (filtroCargo === 'todos') return vendedores
    return vendedores.filter(v => v.cargo === filtroCargo)
  }, [vendedores, filtroCargo])

  const kpis = useMemo(() => {
    const ativos = vendedores.filter(v => v.status === 'ativo')
    const metaTotal = ativos.reduce((s, v) => s + Number(v.meta_mensal), 0)
    const fechadoTotal = performance.reduce((s, p) => s + Number(p.valor_fechado), 0)
    return {
      total: vendedores.length,
      ativos: ativos.length,
      metaTotal,
      fechadoTotal,
      atingimento: metaTotal > 0 ? (fechadoTotal / metaTotal * 100) : 0,
    }
  }, [vendedores, performance])

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    const { error } = await supabase.from('vendedores').insert({
      nome: form.nome.trim(),
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      cargo: form.cargo,
      status: 'ativo',
      meta_mensal: form.meta_mensal,
    })
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false)
    setForm({ nome: '', email: '', telefone: '', cargo: 'closer', meta_mensal: 0 })
    carregar()
  }

  async function toggleStatus(v: Vendedor) {
    const novoStatus: StatusVendedor = v.status === 'ativo' ? 'inativo' : 'ativo'
    await supabase.from('vendedores').update({ status: novoStatus }).eq('id', v.id)
    carregar()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Time Comercial</h1>
            <p className="text-gray-400 text-sm mt-1">Equipe de vendas + performance</p>
          </div>
          <button onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            + Novo Membro
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Kpi label="Membros" valor={String(kpis.total)} cor="text-white" />
          <Kpi label="Ativos" valor={String(kpis.ativos)} cor="text-green-400" />
          <Kpi label="Meta Total" valor={fmt(kpis.metaTotal)} cor="text-amber-400" />
          <Kpi label="Fechado" valor={fmt(kpis.fechadoTotal)} cor="text-green-400" />
          <Kpi label="Atingimento" valor={`${kpis.atingimento.toFixed(0)}%`} cor={kpis.atingimento >= 100 ? 'text-green-400' : 'text-amber-400'} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['equipe', 'ranking'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}>
              {t === 'equipe' ? 'Equipe' : 'Ranking'}
            </button>
          ))}
          {tab === 'equipe' && (
            <>
              <div className="w-px h-8 bg-gray-800 self-center" />
              {(['todos', 'closer', 'sdr', 'gerente', 'recepcionista', 'coordenador'] as const).map(c => (
                <button key={c} onClick={() => setFiltroCargo(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filtroCargo === c ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}>
                  {c === 'todos' ? 'Todos' : CARGO_CONFIG[c].label}
                </button>
              ))}
            </>
          )}
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando...</div>
        ) : tab === 'equipe' ? (
          /* Equipe Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(v => {
              const perf = performance.find(p => p.vendedor_id === v.id)
              const atingimento = v.meta_mensal > 0 && perf ? (perf.valor_fechado / v.meta_mensal * 100) : 0
              return (
                <div key={v.id} className="bg-gray-900 border border-gray-800 hover:border-amber-500/30 rounded-xl p-5 transition group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xl">
                        {v.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${STATUS_COR[v.status]}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{v.nome}</p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-1 ${CARGO_CONFIG[v.cargo].cor}`}>
                        {CARGO_CONFIG[v.cargo].label}
                      </span>
                      {v.email && <p className="text-gray-500 text-xs mt-1.5 truncate">{v.email}</p>}
                      {v.telefone && <p className="text-gray-600 text-xs">{v.telefone}</p>}
                    </div>
                  </div>

                  {/* Performance bar */}
                  {v.meta_mensal > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Meta: {fmt(v.meta_mensal)}</span>
                        <span className={`font-semibold ${atingimento >= 100 ? 'text-green-400' : atingimento >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {atingimento.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${atingimento >= 100 ? 'bg-green-500' : atingimento >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(atingimento, 100)}%` }}
                        />
                      </div>
                      {perf && (
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <MiniStat label="Leads" valor={String(perf.leads_atribuidos)} />
                          <MiniStat label="Propostas" valor={String(perf.propostas_enviadas)} />
                          <MiniStat label="Fechado" valor={fmt(perf.valor_fechado)} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => toggleStatus(v)}
                      className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                        v.status === 'ativo'
                          ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                          : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-gray-950'
                      }`}>
                      {v.status === 'ativo' ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Ranking */
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">#</th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Vendedor</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Leads</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Oportunidades</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Propostas</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Aceitas</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Conversao</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Valor Fechado</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-500">Sem dados de performance ainda.</td></tr>
                ) : (
                  performance.map((p, i) => (
                    <tr key={p.vendedor_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">
                            {p.vendedor_nome.charAt(0)}
                          </div>
                          <span className="text-white font-medium text-sm">{p.vendedor_nome}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-sm">{p.leads_atribuidos}</td>
                      <td className="px-5 py-3 text-right text-gray-400 text-sm">{p.oportunidades}</td>
                      <td className="px-5 py-3 text-right text-gray-400 text-sm">{p.propostas_enviadas}</td>
                      <td className="px-5 py-3 text-right text-green-400 text-sm font-medium">{p.propostas_aceitas}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-medium ${p.taxa_conversao >= 50 ? 'text-green-400' : p.taxa_conversao >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                          {p.taxa_conversao.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-amber-400 font-bold text-sm">{fmt(p.valor_fechado)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-white font-bold text-lg mb-5">Novo Membro</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Cargo</label>
                  <select value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value as CargoVendedor })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    {Object.entries(CARGO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Meta Mensal (R$)</label>
                  <input type="number" step="0.01" value={form.meta_mensal || ''} onChange={e => setForm({ ...form, meta_mensal: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvar} disabled={salvando || !form.nome.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Adicionar'}
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

function MiniStat({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-gray-600 text-[9px] uppercase tracking-wider">{label}</p>
      <p className="text-gray-300 text-xs font-semibold mt-0.5">{valor}</p>
    </div>
  )
}
