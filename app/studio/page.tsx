'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface SyncLog { id: string; origem: string; destino: string; status: string; detalhes: string; created_at: string }
interface Insight { id: string; tipo: string; titulo: string; conteudo: string; prioridade: string; created_at: string }

function ago(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const COMMITS = [
  { hash: 'ea2c296', msg: 'fix(n8n): método POST nos HTTP Request nodes', time: '5 abr' },
  { hash: 'd32a562', msg: 'fix(seguranca): Supabase client usa env vars', time: '5 abr' },
  { hash: '056f833', msg: 'feat(autonomo): sistema autônomo N8N + Claude API + loop 24/7', time: '5 abr' },
  { hash: 'd2d3adc', msg: 'feat(agente-11): CRM auto-conversão lead→paciente', time: '5 abr' },
  { hash: '080f76e', msg: 'perf(agente-10): select específico nas queries', time: '5 abr' },
  { hash: '877ae4b', msg: 'feat(agente-4): APIs backend + security headers', time: '5 abr' },
  { hash: '9008c79', msg: 'fix(dashboard): Sidebar component + receita real', time: '5 abr' },
  { hash: '84545cb', msg: 'feat(ceo): sala de controle com gráficos Recharts', time: '5 abr' },
]

const PRIO_COR: Record<string, string> = {
  alta: 'border-red-700/40 bg-red-500/10',
  media: 'border-amber-500/40 bg-amber-500/10',
  baixa: 'border-gray-700 bg-gray-800',
}

export default function StudioPage() {
  const [syncs, setSyncs] = useState<SyncLog[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('sync_log').select('*').order('created_at', { ascending: false }).limit(15),
      supabase.from('insights_ia').select('*').order('created_at', { ascending: false }).limit(10),
    ]).then(([s, i]) => {
      if (s.data) setSyncs(s.data as SyncLog[])
      if (i.data) setInsights(i.data as Insight[])
      setLoading(false)
    })

    const ch = supabase.channel('studio-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sync_log' }, (p) =>
        setSyncs(prev => [p.new as SyncLog, ...prev].slice(0, 15))
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'insights_ia' }, (p) =>
        setInsights(prev => [p.new as Insight, ...prev].slice(0, 10))
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-2xl font-bold">Excalibur Studio — Desenvolvimento ao Vivo</h1>
            <p className="text-gray-400 text-sm mt-1">Monitoramento em tempo real do sistema</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-700/40 text-green-400 text-xs px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Servidor Online
            </span>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <StatusCard label="Dev Server" valor="localhost:3000" status="online" />
          <StatusCard label="Vercel" valor="excalibur-web" status="online" />
          <StatusCard label="Supabase" valor="PostgreSQL" status="online" />
          <StatusCard label="HEAD IA" valor="Loop 5min" status="online" />
          <StatusCard label="N8N" valor="Cloud" status="online" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Commits */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Últimos Commits</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {COMMITS.map((c) => (
                <div key={c.hash} className="flex items-start gap-2 bg-gray-800 rounded-lg p-2.5">
                  <code className="text-amber-400 text-[10px] font-mono shrink-0 mt-0.5">{c.hash.slice(0, 7)}</code>
                  <p className="text-gray-300 text-xs flex-1">{c.msg}</p>
                  <span className="text-gray-600 text-[10px] shrink-0">{c.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deploy Vercel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Deploy Vercel</h3>
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">excalibur-web</span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Ready</span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>URL: <a href="https://excalibur-web.vercel.app" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">excalibur-web.vercel.app</a></p>
                  <p>Branch: main</p>
                  <p>Scope: contatocardosoeo-sys-projects</p>
                  <p>Framework: Next.js 16 (Turbopack)</p>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-xs font-medium mb-2">Build Info</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Versão: <span className="text-amber-400">v0.4.0</span></p>
                  <p>Tag: <span className="text-green-400">v0.4.0</span></p>
                  <p>Rotas: 18 (12 static + 6 dynamic)</p>
                  <p>Build: <span className="text-green-400">zero erros</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Activity Log */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              Log de Atividades <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </h3>
            {loading ? <p className="text-gray-500 text-xs text-center py-6">Carregando...</p> : syncs.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Sem atividade registrada</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {syncs.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs bg-gray-800 rounded-lg p-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-300 flex-1 truncate">{s.origem} → {s.destino}{s.detalhes ? ` · ${s.detalhes.slice(0, 40)}` : ''}</span>
                    <span className="text-gray-600 shrink-0">{ago(s.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HEAD Insights */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              Insights do HEAD IA <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </h3>
            {loading ? <p className="text-gray-500 text-xs text-center py-6">Carregando...</p> : insights.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Rode <code className="text-amber-400">npm run head</code> para gerar insights</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {insights.map((i) => (
                  <div key={i.id} className={`border rounded-lg p-3 ${PRIO_COR[i.prioridade] || PRIO_COR.media}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{i.titulo?.slice(0, 40)}</span>
                      <span className="text-gray-600 text-[9px]">{ago(i.created_at)}</span>
                    </div>
                    <p className="text-gray-400 text-[10px] leading-relaxed">{i.conteudo?.slice(0, 120)}{(i.conteudo?.length || 0) > 120 ? '…' : ''}</p>
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

function StatusCard({ label, valor, status }: { label: string; valor: string; status: 'online' | 'offline' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
        <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      <p className="text-white text-sm font-semibold">{valor}</p>
    </div>
  )
}
