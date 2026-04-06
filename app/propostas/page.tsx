'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import type { PropostaV2, PropostaProcedimento } from '../lib/database.types'

// ── Types ────────────────────────────────────────────────────────────
interface PropostaKPIs {
  emitidas_mes: number
  aceitas: number
  taxa_aceite: number
  valor_em_aberto: number
}

type StatusProposta = 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada' | 'expirada' | 'cancelada'

const STATUS_CONFIG: Record<string, { label: string; cor: string }> = {
  rascunho:    { label: 'Rascunho',    cor: 'bg-gray-800 text-gray-400 border-gray-700' },
  enviada:     { label: 'Enviada',     cor: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  visualizada: { label: 'Visualizada', cor: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50' },
  aceita:      { label: 'Aceita',      cor: 'bg-green-900/40 text-green-400 border-green-700/50' },
  recusada:    { label: 'Recusada',    cor: 'bg-red-900/40 text-red-400 border-red-700/50' },
  expirada:    { label: 'Expirada',    cor: 'bg-amber-900/40 text-amber-400 border-amber-700/50' },
  cancelada:   { label: 'Cancelada',   cor: 'bg-gray-800 text-gray-500 border-gray-700' },
}

const PROCEDIMENTOS = ['Implante', 'Protocolo', 'Protese', 'Lente de Contato', 'Clareamento', 'Harmonizacao', 'Botox', 'Ortodontia', 'Estetica', 'Outro']
const FORMAS_PAGAMENTO = ['a_vista', 'cartao_credito', 'boleto', 'pix', 'financiamento']
const FINANCEIRAS = ['Excalibur Pay', 'BV Financeira', 'Crefisa', 'CredPago', 'Particular']

function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ── Component ────────────────────────────────────────────────────────
export default function PropostasPage() {
  const [propostas, setPropostas] = useState<PropostaV2[]>([])
  const [kpis, setKpis] = useState<PropostaKPIs>({ emitidas_mes: 0, aceitas: 0, taxa_aceite: 0, valor_em_aberto: 0 })
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<PropostaV2 | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<StatusProposta | 'todos'>('todos')
  const [busca, setBusca] = useState('')

  // Form state
  const [form, setForm] = useState({
    paciente_nome: '',
    paciente_cpf: '',
    paciente_telefone: '',
    procedimentos: [{ nome: 'Implante', quantidade: 1, valor_unitario: 0 }] as PropostaProcedimento[],
    desconto_percentual: 0,
    entrada: 0,
    parcelas: 12,
    forma_pagamento: 'cartao_credito',
    financeira: 'Excalibur Pay',
    taxa_juros: 0,
    validade: '',
    observacoes: '',
    condicoes: '',
  })

  // ── Data ────────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'todos') params.set('status', filtroStatus)
      if (busca) params.set('busca', busca)
      const res = await fetch(`/api/propostas-v2?${params}`)
      const json = await res.json()
      if (json.erro) {
        setErro(json.erro)
        setPropostas([])
      } else {
        setPropostas(json.propostas || [])
        if (json.kpis) setKpis(json.kpis)
      }
    } catch {
      setErro('Erro ao conectar com API')
    }
    setLoading(false)
  }, [filtroStatus, busca])

  useEffect(() => { carregar() }, [carregar])

  // ── Simulacao ────────────────────────────────────────────────────
  const sim = useMemo(() => {
    const valorTotal = form.procedimentos.reduce((s, p) => s + (p.valor_unitario * (p.quantidade || 1)), 0)
    const desconto = valorTotal * (form.desconto_percentual / 100)
    const valorFinal = valorTotal - desconto
    const valorFinanciado = valorFinal - form.entrada
    const valorParcela = form.parcelas > 0
      ? (valorFinanciado * (1 + form.taxa_juros / 100)) / form.parcelas
      : valorFinanciado
    const custoTotal = form.entrada + valorParcela * form.parcelas
    return { valorTotal, desconto, valorFinal, valorFinanciado, valorParcela, custoTotal, juros: custoTotal - valorFinal }
  }, [form])

  // ── Filtered ────────────────────────────────────────────────────
  const filtradas = useMemo(() => {
    let result = propostas
    if (busca.trim()) {
      const q = busca.toLowerCase()
      result = result.filter(p => p.paciente_nome?.toLowerCase().includes(q) || p.numero?.toLowerCase().includes(q))
    }
    return result
  }, [propostas, busca])

  // ── Save ────────────────────────────────────────────────────────
  async function salvar() {
    if (!form.paciente_nome.trim() || sim.valorTotal <= 0) return
    setSalvando(true)
    try {
      const res = await fetch('/api/propostas-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_nome: form.paciente_nome.trim(),
          paciente_cpf: form.paciente_cpf.trim() || undefined,
          paciente_telefone: form.paciente_telefone.trim() || undefined,
          procedimentos: form.procedimentos.filter(p => p.valor_unitario > 0),
          desconto_percentual: form.desconto_percentual,
          entrada: form.entrada,
          parcelas: form.parcelas,
          forma_pagamento: form.forma_pagamento,
          financeira: form.financeira,
          taxa_juros: form.taxa_juros,
          validade: form.validade || undefined,
          observacoes: form.observacoes.trim() || undefined,
          condicoes: form.condicoes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.erro) {
        setErro(json.erro)
      } else {
        setModalAberto(false)
        setForm({
          paciente_nome: '', paciente_cpf: '', paciente_telefone: '',
          procedimentos: [{ nome: 'Implante', quantidade: 1, valor_unitario: 0 }] as PropostaProcedimento[],
          desconto_percentual: 0, entrada: 0, parcelas: 12, forma_pagamento: 'cartao_credito',
          financeira: 'Excalibur Pay', taxa_juros: 0, validade: '', observacoes: '', condicoes: '',
        })
        carregar()
      }
    } catch {
      setErro('Erro ao criar proposta')
    }
    setSalvando(false)
  }

  async function mudarStatus(id: string, status: string) {
    await fetch(`/api/propostas-v2/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setDetalhe(null)
    carregar()
  }

  async function deletar(id: string) {
    if (!confirm('Remover esta proposta?')) return
    await fetch(`/api/propostas-v2/${id}`, { method: 'DELETE' })
    setDetalhe(null)
    carregar()
  }

  // Procedimentos form helpers
  function addProc() {
    setForm({ ...form, procedimentos: [...form.procedimentos, { nome: 'Implante', quantidade: 1, valor_unitario: 0 } as PropostaProcedimento] })
  }
  function removeProc(i: number) {
    setForm({ ...form, procedimentos: form.procedimentos.filter((_, idx) => idx !== i) })
  }
  function updateProc(i: number, field: string, value: string | number) {
    const procs = [...form.procedimentos]
    procs[i] = { ...procs[i], [field]: value } as PropostaProcedimento
    setForm({ ...form, procedimentos: procs })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Propostas</h1>
            <p className="text-gray-400 text-sm mt-1">Orcamentos + simulador de credito</p>
          </div>
          <button onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            + Nova Proposta
          </button>
        </div>

        {/* KPIs — from API */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Emitidas (Mes)" valor={String(kpis.emitidas_mes)} cor="text-white" />
          <KpiCard label="Aceitas" valor={String(kpis.aceitas)} cor="text-green-400" />
          <KpiCard label="Taxa de Aceite" valor={`${kpis.taxa_aceite}%`} cor="text-amber-400" />
          <KpiCard label="Valor em Aberto" valor={fmt(kpis.valor_em_aberto)} cor="text-blue-400" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por numero ou cliente..."
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 w-72" />
          <div className="flex gap-1.5">
            {(['todos', 'rascunho', 'enviada', 'visualizada', 'aceita', 'recusada'] as const).map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filtroStatus === s ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}>
                {s === 'todos' ? 'Todos' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {erro && <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{erro}</div>}

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando propostas...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Nenhuma proposta encontrada.</div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Numero</th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Cliente</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Total</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Parcelas</th>
                  <th className="text-center text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Status</th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Criado</th>
                  <th className="text-right text-gray-500 text-xs uppercase tracking-wider px-5 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(p => {
                  const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.rascunho
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer" onClick={() => setDetalhe(p)}>
                      <td className="px-5 py-3">
                        <span className="text-amber-400 text-sm font-mono font-medium">{p.numero}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-xs">
                            {(p.paciente_nome || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{p.paciente_nome}</p>
                            {p.paciente_telefone && <p className="text-gray-500 text-xs">{p.paciente_telefone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-white font-bold text-sm">{fmt(Number(p.valor_final || p.valor_total || 0))}</td>
                      <td className="px-5 py-3 text-right text-gray-400 text-sm">
                        {p.parcelas > 1 ? `${p.parcelas}x ${fmt(Number(p.valor_parcela || 0))}` : 'A vista'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${st.cor}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-sm">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {p.status === 'rascunho' && (
                            <button onClick={() => mudarStatus(p.id, 'enviada')}
                              className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-blue-500/30 transition">
                              Enviar
                            </button>
                          )}
                          {p.status === 'enviada' && (
                            <button onClick={() => mudarStatus(p.id, 'aceita')}
                              className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 text-xs px-2.5 py-1 rounded-lg border border-green-500/30 transition">
                              Aceitar
                            </button>
                          )}
                          <button onClick={() => deletar(p.id)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-red-500/30 transition">
                            X
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && setDetalhe(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-amber-400 text-xs font-mono font-bold">{detalhe.numero}</p>
                <h2 className="text-white font-bold text-lg">{detalhe.paciente_nome}</h2>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${STATUS_CONFIG[detalhe.status]?.cor || ''}`}>
                {STATUS_CONFIG[detalhe.status]?.label || detalhe.status}
              </span>
            </div>

            {/* Procedimentos */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">Procedimentos</p>
              {(detalhe.procedimentos || []).map((proc, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{proc.nome}</p>
                    <p className="text-gray-500 text-xs">Qtd: {proc.quantidade}</p>
                  </div>
                  <p className="text-amber-400 font-bold text-sm">{fmt(proc.valor_total || proc.valor_unitario * proc.quantidade)}</p>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <DetailRow label="Valor Total" value={fmt(Number(detalhe.valor_total))} />
              {detalhe.desconto_percentual > 0 && <DetailRow label="Desconto" value={`${detalhe.desconto_percentual}% (${fmt(Number(detalhe.desconto_valor))})`} />}
              <DetailRow label="Valor Final" value={fmt(Number(detalhe.valor_final))} highlight />
              <DetailRow label="Entrada" value={fmt(Number(detalhe.entrada))} />
              <DetailRow label="Parcelas" value={`${detalhe.parcelas}x ${fmt(Number(detalhe.valor_parcela))}`} />
              <DetailRow label="Financeira" value={detalhe.financeira || 'N/A'} />
              {detalhe.taxa_juros > 0 && <DetailRow label="Juros" value={`${detalhe.taxa_juros}% a.m.`} />}
              <DetailRow label="Forma Pgto" value={detalhe.forma_pagamento?.replace('_', ' ') || 'N/A'} />
            </div>

            {/* Timeline placeholder */}
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Timeline</p>
              <div className="space-y-2 text-xs text-gray-500">
                <p>Criada em {new Date(detalhe.created_at).toLocaleString('pt-BR')}</p>
                {detalhe.updated_at && detalhe.updated_at !== detalhe.created_at && (
                  <p>Atualizada em {new Date(detalhe.updated_at).toLocaleString('pt-BR')}</p>
                )}
              </div>
            </div>

            {detalhe.observacoes && (
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 mb-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Observacoes</p>
                <p className="text-gray-300 text-sm">{detalhe.observacoes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-5 flex-wrap">
              {detalhe.status === 'rascunho' && (
                <button onClick={() => mudarStatus(detalhe.id, 'enviada')}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                  Enviar ao Paciente
                </button>
              )}
              {(detalhe.status === 'enviada' || detalhe.status === 'visualizada') && (
                <>
                  <button onClick={() => mudarStatus(detalhe.id, 'aceita')}
                    className="flex-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-gray-950 border border-green-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                    Aceitar
                  </button>
                  <button onClick={() => mudarStatus(detalhe.id, 'recusada')}
                    className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                    Recusar
                  </button>
                </>
              )}
              {detalhe.paciente_telefone && (
                <a href={`https://wa.me/55${detalhe.paciente_telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                  WhatsApp
                </a>
              )}
              <button onClick={() => deletar(detalhe.id)}
                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-lg px-4 py-2 text-sm font-medium transition">
                Excluir
              </button>
              <button onClick={() => setDetalhe(null)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">Nova Proposta</h2>

            {/* Patient */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Paciente *</label>
                <input type="text" value={form.paciente_nome} onChange={e => setForm({ ...form, paciente_nome: e.target.value })}
                  placeholder="Nome completo" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">CPF</label>
                <input type="text" value={form.paciente_cpf} onChange={e => setForm({ ...form, paciente_cpf: e.target.value })}
                  placeholder="000.000.000-00" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Telefone</label>
                <input type="text" value={form.paciente_telefone} onChange={e => setForm({ ...form, paciente_telefone: e.target.value })}
                  placeholder="48999001122" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Procedimentos */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Procedimentos</p>
                <button onClick={addProc} className="text-amber-400 text-xs hover:text-amber-300">+ Adicionar</button>
              </div>
              {form.procedimentos.map((proc, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <select value={proc.nome} onChange={e => updateProc(i, 'nome', e.target.value)}
                    className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                    {PROCEDIMENTOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input type="number" min="1" value={proc.quantidade} onChange={e => updateProc(i, 'quantidade', Number(e.target.value))}
                    className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-amber-500" placeholder="Qtd" />
                  <input type="number" step="0.01" value={proc.valor_unitario || ''} onChange={e => updateProc(i, 'valor_unitario', Number(e.target.value))}
                    className="col-span-4 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" placeholder="Valor R$" />
                  {form.procedimentos.length > 1 && (
                    <button onClick={() => removeProc(i)} className="col-span-1 text-red-400 hover:text-red-300 text-sm">X</button>
                  )}
                </div>
              ))}
            </div>

            {/* Payment */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Desconto (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.desconto_percentual || ''} onChange={e => setForm({ ...form, desconto_percentual: Number(e.target.value) })}
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
                  {[1,2,3,4,5,6,8,10,12,15,18,24,30,36,48].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Forma Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
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
                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Taxa Juros (% a.m.)</label>
                <input type="number" step="0.01" value={form.taxa_juros || ''} onChange={e => setForm({ ...form, taxa_juros: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Live Simulator */}
            {sim.valorTotal > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-4">
                <p className="text-amber-400 text-xs uppercase tracking-wider font-bold mb-3">Simulacao em tempo real</p>
                <div className="grid grid-cols-4 gap-4">
                  <SimBox label="Valor Final" valor={fmt(sim.valorFinal)} desc={form.desconto_percentual > 0 ? `-${form.desconto_percentual}%` : 'sem desc'} cor="text-white" />
                  <SimBox label="Parcela" valor={fmt(sim.valorParcela)} desc={`${form.parcelas}x`} cor="text-amber-400" />
                  <SimBox label="Custo Total" valor={fmt(sim.custoTotal)} desc="entrada + parcelas" cor="text-white" />
                  <SimBox label="Juros" valor={fmt(sim.juros)} desc={form.taxa_juros > 0 ? `${form.taxa_juros}%` : 'sem juros'} cor={sim.juros > 0 ? 'text-red-400' : 'text-green-400'} />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={salvar} disabled={salvando || !form.paciente_nome.trim() || sim.valorTotal <= 0}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                {salvando ? 'Salvando...' : 'Criar Proposta'}
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
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg px-3 py-2">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-amber-400 text-base font-bold' : 'text-white'}`}>{value}</p>
    </div>
  )
}
