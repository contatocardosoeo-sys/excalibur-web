'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Insight { id: string; tipo: string; titulo: string; conteudo: string; prioridade: string; status: string; created_at: string }
interface HeadLog { id: string; acao: string; pergunta: string; resposta: string; modelo: string; tokens: number; created_at: string }
interface SyncLog { id: string; origem: string; destino: string; status: string; detalhes: string; created_at: string }
interface Lead { id: string; etapa: string; procedimento: string; created_at: string }

const MODULOS = [
  { nome: 'Login + Auth', rota: '/', status: 'concluido', pct: 100, icon: '🔐' },
  { nome: 'Dashboard', rota: '/dashboard', status: 'concluido', pct: 100, icon: '📊' },
  { nome: 'CRM + Funil', rota: '/crm', status: 'concluido', pct: 100, icon: '👥' },
  { nome: 'Pacientes', rota: '/pacientes', status: 'concluido', pct: 100, icon: '🦷' },
  { nome: 'Agenda', rota: '/agenda', status: 'concluido', pct: 100, icon: '📅' },
  { nome: 'Excalibur Pay', rota: '/financeiro', status: 'concluido', pct: 100, icon: '💰' },
  { nome: 'Marketing', rota: '/marketing', status: 'concluido', pct: 100, icon: '📈' },
  { nome: 'BI & Análise', rota: '/bi', status: 'concluido', pct: 100, icon: '📊' },
  { nome: 'Academia', rota: '/academia', status: 'concluido', pct: 90, icon: '🎓' },
  { nome: 'HEAD IA', rota: '/dashboard', status: 'concluido', pct: 100, icon: '🧠' },
  { nome: 'Extensão Chrome', rota: '#', status: 'ativo', pct: 80, icon: '🤖' },
  { nome: 'Multi-clínica', rota: '#', status: 'planejado', pct: 0, icon: '🏥' },
]

const PRIO_COR: Record<string, string> = {
  alta: 'bg-red-500/20 text-red-400 border-red-700/40',
  media: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  baixa: 'bg-gray-800 text-gray-400 border-gray-700',
}
const TIPO_ICON: Record<string, string> = {
  alerta: '🚨', oportunidade: '💡', previsao: '🔮', acao: '✅', diagnostico: '📊',
}

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }
function ago(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function CEOPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [logs, setLogs] = useState<HeadLog[]>([])
  const [syncs, setSyncs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pergunta, setPergunta] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [resposta, setResposta] = useState('')

  async function carregar() {
    const [l, i, h, s] = await Promise.all([
      supabase.from('leads').select('id,etapa,procedimento,created_at'),
      supabase.from('insights_ia').select('*').order('created_at', { ascending: false }).limit(12),
      supabase.from('head_log').select('*').order('created_at', { ascending: false }).limit(6),
      supabase.from('sync_log').select('*').order('created_at', { ascending: false }).limit(8),
    ])
    if (l.data) setLeads(l.data as Lead[])
    if (i.data) setInsights(i.data as Insight[])
    if (h.data) setLogs(h.data as HeadLog[])
    if (s.data) setSyncs(s.data as SyncLog[])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    const ch = supabase.channel('ceo-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'insights_ia' }, (p) => {
        setInsights((prev) => [p.new as Insight, ...prev].slice(0, 12))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'head_log' }, (p) => {
        setLogs((prev) => [p.new as HeadLog, ...prev].slice(0, 6))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sync_log' }, (p) => {
        setSyncs((prev) => [p.new as SyncLog, ...prev].slice(0, 8))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const metricas = useMemo(() => {
    const agendados = leads.filter((l) => ['Agendado', 'Compareceu', 'Fechou'].includes(l.etapa))
    const compareceram = leads.filter((l) => ['Compareceu', 'Fechou'].includes(l.etapa))
    const fecharam = leads.filter((l) => l.etapa === 'Fechou')
    const invest = 5000
    return {
      total: leads.length,
      agendados: agendados.length,
      compareceram: compareceram.length,
      fecharam: fecharam.length,
      txAgendamento: leads.length > 0 ? (agendados.length / leads.length * 100) : 0,
      txComparecimento: agendados.length > 0 ? (compareceram.length / agendados.length * 100) : 0,
      txFechamento: compareceram.length > 0 ? (fecharam.length / compareceram.length * 100) : 0,
      cpl: leads.length > 0 ? invest / leads.length : 0,
      cac: fecharam.length > 0 ? invest / fecharam.length : 0,
    }
  }, [leads])

  async function consultarHead() {
    if (!pergunta.trim()) return
    setConsultando(true); setResposta('')
    try {
      const res = await fetch('/api/head', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'consultar', dados: { pergunta } }),
      })
      const data = await res.json()
      setResposta(data.conteudo || data.erro || 'Sem resposta')
      setPergunta('')
      carregar()
    } catch (e) {
      setResposta('Erro: ' + (e instanceof Error ? e.message : ''))
    }
    setConsultando(false)
  }

  const modulosPorStatus = {
    concluido: MODULOS.filter((m) => m.status === 'concluido').length,
    ativo: MODULOS.filter((m) => m.status === 'ativo').length,
    planejado: MODULOS.filter((m) => m.status === 'planejado').length,
  }
  const pctGeral = Math.round(MODULOS.reduce((s, m) => s + m.pct, 0) / MODULOS.length)

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 flex items-center justify-center text-gray-500">Carregando visão CEO...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">👑 Visão CEO</h1>
          <p className="text-gray-400 text-sm mt-1">Painel executivo em tempo real — Excalibur v1.0</p>
        </div>

        {/* KPIs Negócio */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <KpiCard label="Leads" valor={String(metricas.total)} cor="text-amber-400" />
          <KpiCard label="Agendados" valor={String(metricas.agendados)} cor="text-blue-400" />
          <KpiCard label="Compareceu" valor={String(metricas.compareceram)} cor="text-purple-400" />
          <KpiCard label="Fecharam" valor={String(metricas.fecharam)} cor="text-green-400" />
          <KpiCard label="CPL" valor={fmt(metricas.cpl)} cor="text-amber-400" />
          <KpiCard label="CAC" valor={fmt(metricas.cac)} cor="text-red-400" />
        </div>

        {/* Taxas de conversão */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <TaxaBar label="Taxa Agendamento" valor={metricas.txAgendamento} cor="bg-blue-500" />
          <TaxaBar label="Taxa Comparecimento" valor={metricas.txComparecimento} cor="bg-purple-500" />
          <TaxaBar label="Taxa Fechamento" valor={metricas.txFechamento} cor="bg-green-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status Módulos */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Status dos Módulos</h3>
              <span className="text-amber-400 text-xs font-bold">{pctGeral}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all" style={{ width: `${pctGeral}%` }} />
            </div>
            <div className="flex gap-3 text-xs mb-4">
              <span className="text-green-400">✅ {modulosPorStatus.concluido} prontos</span>
              <span className="text-amber-400">🔄 {modulosPorStatus.ativo} ativos</span>
              <span className="text-gray-500">⬜ {modulosPorStatus.planejado} planejados</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {MODULOS.map((m) => (
                <div key={m.nome} className="flex items-center gap-2 text-xs">
                  <span>{m.icon}</span>
                  <span className="text-gray-300 flex-1">{m.nome}</span>
                  <div className="w-16 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${m.pct === 100 ? 'bg-green-500' : m.pct > 0 ? 'bg-amber-500' : 'bg-gray-700'}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 w-8 text-right">{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights HEAD */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 lg:col-span-2">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              🧠 Insights do HEAD
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </h3>
            {insights.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Rode <code className="text-amber-400">npm run head</code> para gerar insights</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {insights.map((i) => (
                  <div key={i.id} className={`border rounded-lg p-3 ${PRIO_COR[i.prioridade] || PRIO_COR.media}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs">{TIPO_ICON[i.tipo] || '📋'}</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold">{i.tipo}</span>
                      <span className="text-gray-600 text-[9px] ml-auto">{ago(i.created_at)}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{i.conteudo.slice(0, 120)}{i.conteudo.length > 120 ? '…' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Consultar HEAD */}
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-5 mb-6">
          <h3 className="text-amber-400 font-semibold text-sm mb-3">⚔️ Consultar HEAD</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultarHead()}
              placeholder="Pergunte qualquer coisa: estratégia, métricas, prioridades, mercado..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-gray-500"
            />
            <button
              onClick={consultarHead}
              disabled={consultando || !pergunta.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-bold px-6 py-2.5 rounded-lg text-sm transition"
            >
              {consultando ? '🧠 Pensando...' : '⚔️ Perguntar'}
            </button>
          </div>
          {resposta && (
            <div className="mt-3 bg-gray-800 border border-amber-500/20 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {resposta}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log HEAD */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">📜 Log do HEAD</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">Sem consultas ainda</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {logs.map((l) => (
                  <div key={l.id} className="bg-gray-800 rounded-lg p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-amber-400 font-semibold">{l.acao}</span>
                      <span className="text-gray-600">{ago(l.created_at)} · {l.tokens}tk</span>
                    </div>
                    <p className="text-gray-400 truncate">{l.resposta?.slice(0, 100)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Log */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">🔄 Atividade em Tempo Real</h3>
            {syncs.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">Sem atividade recente</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {syncs.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs bg-gray-800 rounded-lg p-2.5">
                    <span className={`w-2 h-2 rounded-full ${s.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-300">{s.origem} → {s.destino}</span>
                    {s.detalhes && <span className="text-gray-500 truncate flex-1">{s.detalhes.slice(0, 40)}</span>}
                    <span className="text-gray-600 shrink-0">{ago(s.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${cor}`}>{valor}</p>
    </div>
  )
}

function TaxaBar({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">{valor.toFixed(0)}%</span>
      </div>
      <div className="bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div className={`${cor} h-full transition-all duration-500`} style={{ width: `${Math.min(valor, 100)}%` }} />
      </div>
    </div>
  )
}
