'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// ── Types ────────────────────────────────────────────────────────────
type TipoRegra = 'percentual' | 'fixo' | 'escalonado'

interface RegraComissao {
  id: string
  nome: string
  tipo: TipoRegra
  procedimento: string | null
  percentual: number
  valor_fixo: number
  meta_minima: number
  meta_bonus: number
  percentual_bonus: number
  ativo: boolean
  created_at: string
}

interface ComissaoVendedor {
  id: string
  vendedor_nome: string
  periodo: string
  valor_vendas: number
  comissao_base: number
  bonus: number
  total_comissao: number
  status: 'pendente' | 'pago'
}

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ── Component ────────────────────────────────────────────────────────
export default function ComissoesPage() {
  const [regras, setRegras] = useState<RegraComissao[]>([])
  const [comissoes, setComissoes] = useState<ComissaoVendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tab, setTab] = useState<'regras' | 'comissoes'>('regras')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    tipo: 'percentual' as TipoRegra,
    procedimento: '',
    percentual: 5,
    valor_fixo: 0,
    meta_minima: 0,
    meta_bonus: 0,
    percentual_bonus: 0,
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data: r, error: e1 } = await supabase.from('regras_comissao').select('*').order('created_at', { ascending: false })
    if (e1) {
      if (e1.code === '42P01') setErro('Tabela "regras_comissao" nao existe. Aguardando Agente 2.')
      else setErro(e1.message)
      setRegras([])
    } else setRegras((r ?? []) as RegraComissao[])

    const { data: c } = await supabase.from('comissoes_vendedor').select('*').order('periodo', { ascending: false })
    if (c) setComissoes(c as ComissaoVendedor[])

    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const kpis = useMemo(() => {
    const pendentes = comissoes.filter(c => c.status === 'pendente')
    const pagas = comissoes.filter(c => c.status === 'pago')
    return {
      regrasAtivas: regras.filter(r => r.ativo).length,
      totalPendente: pendentes.reduce((s, c) => s + Number(c.total_comissao), 0),
      totalPago: pagas.reduce((s, c) => s + Number(c.total_comissao), 0),
      vendedoresComComissao: new Set(comissoes.map(c => c.vendedor_nome)).size,
    }
  }, [regras, comissoes])

  async function salvarRegra() {
    if (!form.nome.trim()) return
    setSalvando(true)
    const { error } = await supabase.from('regras_comissao').insert({
      nome: form.nome.trim(),
      tipo: form.tipo,
      procedimento: form.procedimento.trim() || null,
      percentual: form.percentual,
      valor_fixo: form.valor_fixo,
      meta_minima: form.meta_minima,
      meta_bonus: form.meta_bonus,
      percentual_bonus: form.percentual_bonus,
      ativo: true,
    })
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setModalAberto(false)
    setForm({ nome: '', tipo: 'percentual', procedimento: '', percentual: 5, valor_fixo: 0, meta_minima: 0, meta_bonus: 0, percentual_bonus: 0 })
    carregar()
  }

  async function toggleRegra(id: string, ativo: boolean) {
    await supabase.from('regras_comissao').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  async function pagarComissao(id: string) {
    await supabase.from('comissoes_vendedor').update({ status: 'pago' }).eq('id', id)
    carregar()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Comissoes</h1>
            <p className="text-gray-400 text-sm mt-1">Regras e pagamento de comissoes</p>
          </div>
          {tab === 'regras' && (
            <button onClick={() => setModalAberto(true)}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
              + Nova Regra
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Kpi label="Regras Ativas" valor={String(kpis.regrasAtivas)} cor="text-amber-400" />
          <Kpi label="A Pagar" valor={fmt(kpis.totalPendente)} cor="text-red-400" />
          <Kpi label="Ja Pago" valor={fmt(kpis.totalPago)} cor="text-green-400" />
          <Kpi label="Vendedores" valor={String(kpis.vendedoresComComissao)} cor="text-blue-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['regras', 'comissoes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}>
              {t === 'regras' ? 'Regras' : 'Comissoes'}
            </button>
          ))}
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando...</div>
        ) : tab === 'regras' ? (
          <div className="space-y-3">
            {regras.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Nenhuma regra criada.</div>
            ) : regras.map(r => (
              <div key={r.id} className={`bg-gray-900 border rounded-xl p-5 transition group ${r.ativo ? 'border-gray-800 hover:border-amber-500/30' : 'border-gray-800/50 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                    r.tipo === 'percentual' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    r.tipo === 'fixo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {r.tipo === 'percentual' ? '%' : r.tipo === 'fixo' ? '$' : '#'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{r.nome}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.ativo ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {r.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {r.tipo === 'percentual' && <span>{r.percentual}% sobre vendas</span>}
                      {r.tipo === 'fixo' && <span>{fmt(r.valor_fixo)} por venda</span>}
                      {r.tipo === 'escalonado' && <span>{r.percentual}% base + {r.percentual_bonus}% acima de {fmt(r.meta_bonus)}</span>}
                      {r.procedimento && <span>| {r.procedimento}</span>}
                      {r.meta_minima > 0 && <span>| Min: {fmt(r.meta_minima)}</span>}
                    </div>
                  </div>

                  <button onClick={() => toggleRegra(r.id, r.ativo)}
                    className="opacity-0 group-hover:opacity-100 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition">
                    {r.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Comissoes Table */
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Vendedor</th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Periodo</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Vendas</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Comissao Base</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Bonus</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Total</th>
                  <th className="text-center text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {comissoes.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-500">Sem comissoes registradas.</td></tr>
                ) : comissoes.map(c => (
                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-5 py-3 text-white text-sm font-medium">{c.vendedor_nome}</td>
                    <td className="px-5 py-3 text-gray-400 text-sm">{c.periodo}</td>
                    <td className="px-5 py-3 text-right text-gray-400 text-sm">{fmt(c.valor_vendas)}</td>
                    <td className="px-5 py-3 text-right text-gray-400 text-sm">{fmt(c.comissao_base)}</td>
                    <td className="px-5 py-3 text-right text-amber-400 text-sm">{fmt(c.bonus)}</td>
                    <td className="px-5 py-3 text-right text-white font-bold text-sm">{fmt(c.total_comissao)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        c.status === 'pago' ? 'bg-green-900/40 text-green-400' : 'bg-amber-900/40 text-amber-400'
                      }`}>
                        {c.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {c.status === 'pendente' && (
                        <button onClick={() => pagarComissao(c.id)}
                          className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded-lg px-3 py-1 text-xs font-medium transition">
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Regra */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-white font-bold text-lg mb-5">Nova Regra de Comissao</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Nome da Regra *</label>
                <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Comissao padrao closers"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoRegra })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                    <option value="escalonado">Escalonado</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Procedimento</label>
                  <input type="text" value={form.procedimento} onChange={e => setForm({ ...form, procedimento: e.target.value })}
                    placeholder="Todos"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              {form.tipo === 'percentual' && (
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Percentual (%)</label>
                  <input type="number" step="0.1" value={form.percentual} onChange={e => setForm({ ...form, percentual: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              )}
              {form.tipo === 'fixo' && (
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">Valor Fixo (R$)</label>
                  <input type="number" step="0.01" value={form.valor_fixo || ''} onChange={e => setForm({ ...form, valor_fixo: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              )}
              {form.tipo === 'escalonado' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block font-medium">% Base</label>
                    <input type="number" step="0.1" value={form.percentual} onChange={e => setForm({ ...form, percentual: Number(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block font-medium">% Bonus</label>
                    <input type="number" step="0.1" value={form.percentual_bonus} onChange={e => setForm({ ...form, percentual_bonus: Number(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block font-medium">Meta Minima (R$)</label>
                    <input type="number" step="0.01" value={form.meta_minima || ''} onChange={e => setForm({ ...form, meta_minima: Number(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block font-medium">Meta Bonus (R$)</label>
                    <input type="number" step="0.01" value={form.meta_bonus || ''} onChange={e => setForm({ ...form, meta_bonus: Number(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvarRegra} disabled={salvando || !form.nome.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Criar Regra'}
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
