'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Lead { id: string; nome: string; telefone: string; procedimento: string; etapa: string; created_at: string }
interface Resposta { id: string; titulo: string; categoria: string; acoes: unknown[]; ativo: boolean; usos: number }
interface Categoria { id: string; nome: string; cor: string; ordem: number }

const FEATURES = [
  { nome: 'Abas com contadores', status: 'pronto', desc: 'Recepção, Mapeamento, Explicação, Agendamento, etc.' },
  { nome: 'Respostas rápidas', status: 'pronto', desc: 'Por categoria com cores diferentes' },
  { nome: 'Fluxos com delay', status: 'pronto', desc: 'Simula digitação humana com delay' },
  { nome: 'Variável #primeiroNome', status: 'pronto', desc: 'Substitui nome do paciente automaticamente' },
  { nome: 'Integração Supabase', status: 'pronto', desc: 'Salva leads direto no banco' },
  { nome: 'Visual dark + amber', status: 'pronto', desc: 'Identidade visual consistente' },
  { nome: 'Busca + filtros', status: 'parcial', desc: 'Campo de busca implementado' },
  { nome: 'Sync bidirecional CRM', status: 'falta', desc: 'Leads do CRM aparecem na extensão — v0.6' },
  { nome: 'Agendar do WhatsApp', status: 'falta', desc: 'Criar agendamento direto da conversa — v0.7' },
  { nome: 'Sugestão de resposta IA', status: 'falta', desc: 'HEAD sugere próxima resposta — v0.8' },
]

const STATUS_COR: Record<string, string> = {
  pronto: 'bg-green-500/20 text-green-400',
  parcial: 'bg-amber-500/20 text-amber-400',
  falta: 'bg-gray-800 text-gray-500',
}

const CATEGORIAS = [
  { cor: 'bg-red-500', nome: 'Agendamento', desc: 'Follow-ups e convites' },
  { cor: 'bg-blue-500', nome: 'Agendando', desc: 'Confirmação de horário' },
  { cor: 'bg-green-500', nome: 'Confirmação', desc: 'Lembretes de consulta' },
  { cor: 'bg-yellow-500', nome: 'Paciente Atrasado', desc: 'No-show e atrasos' },
  { cor: 'bg-purple-500', nome: 'Compareceu/N.Fechou', desc: 'Recuperação pós-consulta' },
  { cor: 'bg-gray-400', nome: 'Lista Fria', desc: 'Reativação de leads' },
]

function ago(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function ExtensaoPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('leads').select('id,nome,telefone,procedimento,etapa,created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('respostas_rapidas').select('id,titulo,categoria,acoes,ativo,usos').eq('ativo', true).order('categoria'),
      supabase.from('categorias_resposta').select('*').order('ordem'),
    ]).then(([l, r, c]) => {
      if (l.data) setLeads(l.data as Lead[])
      if (r.data) setRespostas(r.data as Resposta[])
      if (c.data) setCategorias(c.data as Categoria[])
      setLoading(false)
    })

    const ch = supabase.channel('ext-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (p) =>
        setLeads(prev => [p.new as Lead, ...prev].slice(0, 10))
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const prontos = FEATURES.filter(f => f.status === 'pronto').length
  const respostasPorCat = categorias.map(c => ({
    ...c,
    count: respostas.filter(r => r.categoria === c.nome).length
  }))

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-2xl font-bold">Excalibur CRC — Extensão WhatsApp</h1>
            <p className="text-gray-400 text-sm mt-1">Clone e evolução do WaSeller · {prontos}/{FEATURES.length} features prontas</p>
          </div>
          <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm">
            Abrir WhatsApp Web
          </a>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Kpi label="Features" valor={`${prontos}/${FEATURES.length}`} sub="implementadas" cor="text-green-400" />
          <Kpi label="Leads via Ext" valor={String(leads.length)} sub="últimos salvos" cor="text-amber-400" />
          <Kpi label="Respostas" valor={String(respostas.length)} sub="importadas WaSeller" cor="text-blue-400" />
          <Kpi label="Status" valor="Ativa" sub="extensão instalada" cor="text-green-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Instalação */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Como instalar / recarregar</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex gap-2"><span className="text-amber-400 font-bold">1.</span> Abra <code className="bg-gray-800 px-1 rounded text-amber-400">chrome://extensions</code></div>
              <div className="flex gap-2"><span className="text-amber-400 font-bold">2.</span> Ative o <span className="text-white">Modo do desenvolvedor</span> (canto superior)</div>
              <div className="flex gap-2"><span className="text-amber-400 font-bold">3.</span> Clique <span className="text-white">Carregar sem compactação</span></div>
              <div className="flex gap-2"><span className="text-amber-400 font-bold">4.</span> Selecione a pasta <code className="bg-gray-800 px-1 rounded text-amber-400">excalibur-extension</code></div>
              <div className="flex gap-2"><span className="text-amber-400 font-bold">5.</span> Abra <span className="text-white">web.whatsapp.com</span> — o painel aparece à direita</div>
            </div>
            <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-400 text-xs font-medium">Para recarregar após mudanças:</p>
              <p className="text-gray-400 text-[10px] mt-1">chrome://extensions → botão de reload na extensão → F5 no WhatsApp Web</p>
            </div>
          </div>

          {/* Categorias reais do Supabase */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Categorias ({categorias.length} do WaSeller)</h3>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {respostasPorCat.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                  <span className="text-white text-xs font-medium flex-1">{c.nome}</span>
                  <span className="text-amber-400 text-xs font-bold">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Features */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Status das Features</h3>
            <div className="space-y-1.5">
              {FEATURES.map((f) => (
                <div key={f.nome} className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_COR[f.status]}`}>
                    {f.status === 'pronto' ? '✓' : f.status === 'parcial' ? '◐' : '○'}
                  </span>
                  <span className="text-gray-300 text-xs flex-1">{f.nome}</span>
                  <span className="text-gray-600 text-[10px]">{f.desc.slice(0, 30)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Últimos leads */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              Últimos Leads <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </h3>
            {loading ? <p className="text-gray-500 text-xs text-center py-6">Carregando...</p> : leads.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Nenhum lead salvo ainda</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {leads.map((l) => (
                  <div key={l.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-white text-xs font-medium">{l.nome}</span>
                      <span className="text-gray-600 text-[10px]">{ago(l.created_at)}</span>
                    </div>
                    <p className="text-gray-500 text-[10px] mt-0.5">{l.procedimento} · {l.etapa} · {l.telefone}</p>
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

function Kpi({ label, valor, sub, cor }: { label: string; valor: string; sub: string; cor: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${cor}`}>{valor}</p>
      <p className="text-gray-600 text-[10px] mt-1">{sub}</p>
    </div>
  )
}
