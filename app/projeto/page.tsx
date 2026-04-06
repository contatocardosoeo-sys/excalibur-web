'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface ModuloStatus {
  id: string
  modulo: string
  status: string
  progresso: number
  notas: string | null
  ultima_atualizacao: string | null
}

const MODULOS_DEFAULT = [
  { modulo: 'Login + Auth', progresso: 100, status: 'concluido' },
  { modulo: 'Dashboard', progresso: 100, status: 'concluido' },
  { modulo: 'CRM + Funil', progresso: 100, status: 'concluido' },
  { modulo: 'Pacientes', progresso: 100, status: 'concluido' },
  { modulo: 'Agenda', progresso: 85, status: 'parcial' },
  { modulo: 'Excalibur Pay', progresso: 85, status: 'parcial' },
  { modulo: 'Marketing', progresso: 60, status: 'parcial' },
  { modulo: 'BI & Análise', progresso: 90, status: 'concluido' },
  { modulo: 'HEAD IA', progresso: 100, status: 'concluido' },
  { modulo: 'Academia', progresso: 20, status: 'parcial' },
  { modulo: 'Extensão Chrome', progresso: 80, status: 'parcial' },
  { modulo: 'Sistema Autônomo', progresso: 100, status: 'concluido' },
]

const TASKS = [
  { prioridade: 'critico', desc: 'Calendar view semanal na Agenda', modulo: 'Agenda' },
  { prioridade: 'critico', desc: 'Tracking de pagamentos no Financeiro', modulo: 'Financeiro' },
  { prioridade: 'alta', desc: 'Extensão Chrome ↔ CRM sync bidirecional', modulo: 'Extensão' },
  { prioridade: 'alta', desc: 'Relatórios automáticos semanal/mensal', modulo: 'BI' },
  { prioridade: 'alta', desc: 'Detecção de conflito de horários', modulo: 'Agenda' },
  { prioridade: 'planejado', desc: 'Prontuário odontológico completo', modulo: 'Pacientes' },
  { prioridade: 'planejado', desc: 'Integração Meta/Google Ads', modulo: 'Marketing' },
  { prioridade: 'planejado', desc: 'Multi-clínica', modulo: 'Plataforma' },
]

const ROADMAP = [
  { ver: 'v0.4.0', status: 'atual', itens: ['Sala CEO', 'Sistema Autônomo N8N', 'APIs Backend', 'Security Headers'] },
  { ver: 'v0.5.0', status: 'proximo', itens: ['Calendar View Agenda', 'Tracking Pagamentos', 'Relatórios Auto', 'Comissões'] },
  { ver: 'v0.6.0', status: 'futuro', itens: ['Prontuário Odontológico', 'Plano Tratamento', 'Odontograma Visual'] },
  { ver: 'v0.7.0', status: 'futuro', itens: ['Meta/Google Ads API', 'Landing Pages', 'Campanhas Automáticas'] },
  { ver: 'v1.0.0', status: 'futuro', itens: ['Multi-clínica', 'White Label', 'App Mobile', 'Marketplace'] },
]

const INTEGRACOES = [
  { nome: 'Supabase', status: true }, { nome: 'Vercel', status: true },
  { nome: 'Claude API', status: true }, { nome: 'N8N', status: true },
  { nome: 'GitHub', status: true }, { nome: 'Chrome Extension', status: true },
  { nome: 'Meta Ads', status: false }, { nome: 'Google Ads', status: false },
  { nome: 'WhatsApp Business API', status: false }, { nome: 'Stripe/Pagar.me', status: false },
]

const PRIO: Record<string, string> = {
  critico: 'bg-red-500/20 text-red-400 border-red-700/40',
  alta: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  planejado: 'bg-gray-800 text-gray-400 border-gray-700',
}
const STATUS_BADGE: Record<string, string> = {
  concluido: 'bg-green-500/20 text-green-400',
  parcial: 'bg-amber-500/20 text-amber-400',
  pendente: 'bg-gray-800 text-gray-500',
}

export default function ProjetoPage() {
  const [modulos, setModulos] = useState(MODULOS_DEFAULT.map((m, i) => ({ id: String(i), ...m, notas: null as string | null, ultima_atualizacao: null as string | null })))

  useEffect(() => {
    supabase.from('sistema_status').select('*').then(({ data }) => {
      if (data && data.length > 0) setModulos(data as ModuloStatus[])
    })
    const ch = supabase.channel('projeto-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sistema_status' }, () => {
        supabase.from('sistema_status').select('*').then(({ data }) => {
          if (data && data.length > 0) setModulos(data as ModuloStatus[])
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const pctGeral = Math.round(modulos.reduce((s, m) => s + m.progresso, 0) / modulos.length)
  const concluidos = modulos.filter(m => m.progresso === 100).length

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-2xl font-bold">Excalibur — Visão do Projeto</h1>
            <p className="text-gray-400 text-sm mt-1">
              v0.4.0 · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Deploy Ativo</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Kpi label="Módulos" valor={`${concluidos}/${modulos.length}`} sub="concluídos" cor="text-green-400" />
          <Kpi label="Progresso" valor={`${pctGeral}%`} sub="geral" cor="text-amber-400" />
          <Kpi label="Versão" valor="v0.4.0" sub="atual" cor="text-blue-400" />
          <Kpi label="Deploy" valor="Vercel" sub="excalibur-web.vercel.app" cor="text-green-400" />
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Status dos Módulos</h3>
            <div className="space-y-2">
              {modulos.map((m) => (
                <div key={m.modulo} className="flex items-center gap-3">
                  <span className="text-gray-300 text-xs flex-1 min-w-0 truncate">{m.modulo}</span>
                  <div className="w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-full transition-all ${m.progresso === 100 ? 'bg-green-500' : m.progresso > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${m.progresso}%` }} />
                  </div>
                  <span className="text-gray-500 text-[10px] w-8 text-right">{m.progresso}%</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[m.status] || STATUS_BADGE.pendente}`}>
                    {m.status === 'concluido' ? 'Pronto' : m.status === 'parcial' ? 'Parcial' : 'Falta'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Tasks Prioritárias</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {TASKS.map((t, i) => (
                <div key={i} className={`border rounded-lg p-3 ${PRIO[t.prioridade]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold">{t.prioridade}</span>
                    <span className="text-gray-600 text-[9px]">· {t.modulo}</span>
                  </div>
                  <p className="text-xs">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roadmap + Integrações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Roadmap</h3>
            <div className="space-y-3">
              {ROADMAP.map((r) => (
                <div key={r.ver} className={`border rounded-lg p-3 ${r.status === 'atual' ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${r.status === 'atual' ? 'text-amber-400' : r.status === 'proximo' ? 'text-blue-400' : 'text-gray-500'}`}>{r.ver}</span>
                    {r.status === 'atual' && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">ATUAL</span>}
                    {r.status === 'proximo' && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">PRÓXIMO</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.itens.map((item) => (
                      <span key={item} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Integrações</h3>
            <div className="grid grid-cols-2 gap-2">
              {INTEGRACOES.map((ig) => (
                <div key={ig.nome} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <span className={`w-2 h-2 rounded-full ${ig.status ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span className={`text-xs ${ig.status ? 'text-gray-300' : 'text-gray-500'}`}>{ig.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, valor, sub, cor }: { label: string; valor: string; sub: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${cor}`}>{valor}</p>
      <p className="text-gray-600 text-[10px] mt-1">{sub}</p>
    </div>
  )
}
