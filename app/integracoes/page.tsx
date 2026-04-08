'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface FunilPreview {
  data: string
  leads: number
  fechamentos: number
  faturamento: number
}

const CLINICA_ID = '21e95ba0-8f06-4062-85f0-1b9da496be52'

export default function IntegracoesPage() {
  const [wascriptStatus, setWascriptStatus] = useState<'ativo' | 'inativo' | 'verificando'>('verificando')
  const [wascriptToken, setWascriptToken] = useState('')
  const [funilPreview, setFunilPreview] = useState<FunilPreview[]>([])
  const [testando, setTestando] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Verificar wascript
    const { data: conn } = await supabase
      .from('wascript_connections')
      .select('token, ativo')
      .eq('clinica_id', CLINICA_ID)
      .maybeSingle()

    if (conn) {
      setWascriptStatus(conn.ativo ? 'ativo' : 'inativo')
      setWascriptToken(conn.token || '')
    } else {
      setWascriptStatus('inativo')
    }

    // Ultimas entradas funil
    const { data: funil } = await supabase
      .from('funil_diario')
      .select('data, leads, fechamentos, faturamento')
      .eq('clinica_id', CLINICA_ID)
      .order('data', { ascending: false })
      .limit(5)

    setFunilPreview(funil || [])
  }, [])

  useEffect(() => { load() }, [load])

  const testarWascript = async () => {
    setTestando(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/wascript/webhook')
      if (res.ok) {
        setTestResult('Webhook ativo e respondendo')
      } else {
        setTestResult('Webhook retornou erro: ' + res.status)
      }
    } catch {
      setTestResult('Erro ao conectar com webhook')
    }
    setTestando(false)
  }

  const exportarCSV = () => {
    window.location.href = `/api/funil?clinica_id=${CLINICA_ID}&periodo=30&formato=csv`
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/wascript/webhook`
    : '/api/wascript/webhook'

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto)
  }

  const statusColor = wascriptStatus === 'ativo' ? 'text-green-400' : wascriptStatus === 'inativo' ? 'text-red-400' : 'text-gray-400'
  const statusDot = wascriptStatus === 'ativo' ? 'bg-green-500' : wascriptStatus === 'inativo' ? 'bg-red-500' : 'bg-gray-500'

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-white text-2xl font-bold mb-1">Integracoes</h1>
        <p className="text-gray-400 text-sm mb-6">Configure e monitore as integracoes da clinica</p>

        <div className="space-y-6 max-w-3xl">

          {/* WhatsApp / Wascript */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="text-white font-semibold text-sm">WhatsApp / Wascript</h3>
                  <p className="text-gray-500 text-xs">CRM automatico via WhatsApp Web</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                <span className={`text-xs font-medium ${statusColor}`}>
                  {wascriptStatus === 'verificando' ? 'Verificando...' : wascriptStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-[10px] uppercase block mb-1">Token</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={wascriptToken || 'Nao configurado'}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono" />
                  {wascriptToken && (
                    <button onClick={() => copiar(wascriptToken)}
                      className="px-3 py-2 bg-gray-800 text-gray-400 text-xs rounded-lg hover:text-white transition">
                      Copiar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-[10px] uppercase block mb-1">URL do Webhook</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={webhookUrl}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono" />
                  <button onClick={() => copiar(webhookUrl)}
                    className="px-3 py-2 bg-gray-800 text-gray-400 text-xs rounded-lg hover:text-white transition">
                    Copiar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={testarWascript} disabled={testando}
                  className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition">
                  {testando ? 'Testando...' : 'Testar Conexao'}
                </button>
                {testResult && (
                  <span className={`text-xs ${testResult.includes('ativo') ? 'text-green-400' : 'text-red-400'}`}>{testResult}</span>
                )}
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 mt-2">
                <p className="text-gray-400 text-xs font-medium mb-2">Como configurar no ProspectaCRM:</p>
                <ol className="text-gray-500 text-[10px] space-y-1 list-decimal list-inside">
                  <li>Acesse ProspectaCRM → Configuracoes → Webhook</li>
                  <li>Cole a URL do webhook acima</li>
                  <li>Selecione eventos: mensagem recebida, status atualizado</li>
                  <li>Salve e teste com uma mensagem</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Funil Diario */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="text-white font-semibold text-sm">Funil Diario</h3>
                <p className="text-gray-500 text-xs">Import/export de dados do funil</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={exportarCSV}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg hover:border-amber-500/30 transition">
                Exportar CSV (30 dias)
              </button>
            </div>

            {funilPreview.length > 0 && (
              <div>
                <p className="text-gray-500 text-[10px] uppercase mb-2">Ultimas 5 entradas</p>
                <div className="space-y-1">
                  {funilPreview.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-800">
                      <span className="text-gray-400">{f.data}</span>
                      <div className="flex gap-4">
                        <span className="text-gray-300">{f.leads} leads</span>
                        <span className="text-green-400">{f.fechamentos} fecha.</span>
                        <span className="text-amber-400 font-mono">R${Number(f.faturamento).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status integracoes */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔌</span>
              <div>
                <h3 className="text-white font-semibold text-sm">Status das Integracoes</h3>
                <p className="text-gray-500 text-xs">Visao geral de todas as conexoes</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { nome: 'Supabase', status: 'ativo', desc: 'Banco de dados PostgreSQL' },
                { nome: 'Wascript', status: wascriptStatus === 'ativo' ? 'ativo' : 'inativo', desc: 'CRM WhatsApp automatico' },
                { nome: 'Vercel', status: 'ativo', desc: 'Deploy e hosting' },
                { nome: 'N8N', status: 'em_breve', desc: 'Automacoes avancadas' },
              ].map(int => (
                <div key={int.nome} className="flex items-center justify-between py-2 border-b border-gray-800">
                  <div>
                    <span className="text-white text-sm">{int.nome}</span>
                    <span className="text-gray-500 text-xs ml-2">{int.desc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${int.status === 'ativo' ? 'bg-green-500' : int.status === 'inativo' ? 'bg-red-500' : 'bg-gray-500'}`} />
                    <span className={`text-xs ${int.status === 'ativo' ? 'text-green-400' : int.status === 'inativo' ? 'text-red-400' : 'text-gray-500'}`}>
                      {int.status === 'em_breve' ? 'Em breve' : int.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
