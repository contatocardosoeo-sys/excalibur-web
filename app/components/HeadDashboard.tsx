'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Insight {
  id: string
  tipo: 'alerta' | 'oportunidade' | 'previsao' | 'acao' | 'diagnostico'
  titulo: string
  conteudo: string
  prioridade: 'alta' | 'media' | 'baixa'
  status: string
  created_at: string
}

interface HeadLog {
  id: string
  acao: string
  resposta: string
  tokens: number
  created_at: string
}

const TIPO_CONFIG: Record<string, { icon: string; cor: string; bg: string }> = {
  alerta: { icon: '🚨', cor: 'text-red-400', bg: 'border-red-700/50 bg-red-900/20' },
  oportunidade: { icon: '💡', cor: 'text-amber-400', bg: 'border-amber-700/50 bg-amber-900/20' },
  previsao: { icon: '🔮', cor: 'text-purple-400', bg: 'border-purple-700/50 bg-purple-900/20' },
  acao: { icon: '✅', cor: 'text-green-400', bg: 'border-green-700/50 bg-green-900/20' },
  diagnostico: { icon: '📊', cor: 'text-blue-400', bg: 'border-blue-700/50 bg-blue-900/20' },
}

export default function HeadDashboard() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [lastLog, setLastLog] = useState<HeadLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [consultando, setConsultando] = useState(false)
  const [pergunta, setPergunta] = useState('')
  const [respostaLivre, setRespostaLivre] = useState('')

  async function carregar() {
    const { data: ins } = await supabase
      .from('insights_ia')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)
    if (ins) setInsights(ins as Insight[])

    const { data: log } = await supabase
      .from('head_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    if (log?.[0]) setLastLog(log[0] as HeadLog)

    setLoading(false)
  }

  useEffect(() => {
    carregar()

    // Realtime subscription
    const channel = supabase
      .channel('head-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'insights_ia' }, (payload) => {
        setInsights((prev) => [payload.new as Insight, ...prev].slice(0, 8))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'head_log' }, (payload) => {
        setLastLog(payload.new as HeadLog)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function consultarHead() {
    if (!pergunta.trim()) return
    setConsultando(true)
    setRespostaLivre('')
    try {
      const res = await fetch('/api/head', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'consultar', dados: { pergunta } }),
      })
      const data = await res.json()
      setRespostaLivre(data.conteudo || data.erro || 'Sem resposta')
      setPergunta('')
      carregar()
    } catch (e) {
      setRespostaLivre('Erro ao consultar HEAD: ' + (e instanceof Error ? e.message : ''))
    }
    setConsultando(false)
  }

  async function marcarVisto(id: string) {
    await supabase.from('insights_ia').update({ status: 'visto' }).eq('id', id)
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'visto' } : i)))
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-500 text-sm">Carregando HEAD...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header HEAD */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h3 className="text-white font-bold text-sm">Excalibur HEAD — IA</h3>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          {lastLog && (
            <span className="text-gray-600 text-[10px]">
              Última análise:{' '}
              {new Date(lastLog.created_at).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {lastLog.tokens} tokens
            </span>
          )}
        </div>

        {/* Consulta livre */}
        <div className="flex gap-2">
          <input
            type="text"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && consultarHead()}
            placeholder="Pergunte ao HEAD: 'Como melhorar o CPL?', 'Qual módulo priorizar?'..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition placeholder-gray-500"
          />
          <button
            onClick={consultarHead}
            disabled={consultando || !pergunta.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            {consultando ? '⏳' : '⚔️ Perguntar'}
          </button>
        </div>

        {respostaLivre && (
          <div className="mt-3 bg-gray-800 border border-amber-500/30 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
            {respostaLivre}
          </div>
        )}
      </div>

      {/* Grid de Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((i) => {
            const cfg = TIPO_CONFIG[i.tipo] ?? TIPO_CONFIG.diagnostico
            return (
              <div
                key={i.id}
                className={`border rounded-xl p-4 transition ${cfg.bg} ${i.status === 'novo' ? 'ring-1 ring-amber-500/30' : 'opacity-80'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cfg.icon}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.cor}`}>
                      {i.tipo}
                    </span>
                    {i.prioridade === 'alta' && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">
                        ALTA
                      </span>
                    )}
                  </div>
                  {i.status === 'novo' && (
                    <button
                      onClick={() => marcarVisto(i.id)}
                      className="text-[10px] text-gray-500 hover:text-amber-400 transition"
                    >
                      marcar visto
                    </button>
                  )}
                </div>
                <p className="text-white text-xs leading-relaxed">{i.conteudo}</p>
                <p className="text-gray-600 text-[9px] mt-2">
                  {new Date(i.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {insights.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center text-gray-500 text-sm">
          Nenhum insight ainda. Rode <code className="text-amber-400">npm run head</code> para ativar análise automática.
        </div>
      )}
    </div>
  )
}
