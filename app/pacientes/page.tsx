'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Paciente {
  id: string
  nome: string
  telefone: string
  procedimento: string
  etapa: string
  created_at: string
}

const etapasCor: Record<string, string> = {
  'Recebido':      'bg-gray-700 text-gray-300',
  'Contato feito': 'bg-blue-900 text-blue-300',
  'Agendado':      'bg-amber-500 text-gray-950',
  'Compareceu':    'bg-purple-900 text-purple-300',
  'Fechou':        'bg-green-900 text-green-400',
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [novo, setNovo] = useState({
    nome: '',
    telefone: '',
    procedimento: 'Implante',
    etapa: 'Recebido',
  })
  const [salvando, setSalvando] = useState(false)

  async function carregarPacientes() {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setPacientes(data)
  }

  useEffect(() => {
    carregarPacientes()
  }, [])

  async function adicionarPaciente() {
    if (!novo.nome || !novo.telefone) return
    setSalvando(true)
    await supabase.from('leads').insert([novo])
    setNovo({ nome: '', telefone: '', procedimento: 'Implante', etapa: 'Recebido' })
    setMostrarFormulario(false)
    setSalvando(false)
    carregarPacientes()
  }

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white text-2xl font-bold">Pacientes</h2>
            <p className="text-gray-400 mt-1">{pacientes.length} pacientes cadastrados</p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition"
          >
            + Novo paciente
          </button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition text-sm"
          />
        </div>

        {/* Formulário */}
        {mostrarFormulario && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Novo paciente</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nome</label>
                <input
                  type="text"
                  value={novo.nome}
                  onChange={e => setNovo({ ...novo, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Telefone</label>
                <input
                  type="text"
                  value={novo.telefone}
                  onChange={e => setNovo({ ...novo, telefone: e.target.value })}
                  placeholder="48999001122"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Procedimento</label>
                <select
                  value={novo.procedimento}
                  onChange={e => setNovo({ ...novo, procedimento: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option>Implante</option>
                  <option>Protocolo</option>
                  <option>Prótese</option>
                  <option>Estética</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Etapa</label>
                <select
                  value={novo.etapa}
                  onChange={e => setNovo({ ...novo, etapa: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou'].map(e => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={adicionarPaciente}
                disabled={salvando}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold px-5 py-2 rounded-lg transition text-sm"
              >
                {salvando ? 'Salvando...' : 'Salvar paciente'}
              </button>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-5 py-2 rounded-lg transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Grid de cards */}
        {filtrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {busca ? 'Nenhum paciente encontrado para essa busca.' : 'Nenhum paciente cadastrado ainda.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtrados.map(paciente => (
              <div
                key={paciente.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-white font-semibold text-sm leading-tight">{paciente.nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${etapasCor[paciente.etapa] ?? 'bg-gray-700 text-gray-300'}`}>
                    {paciente.etapa}
                  </span>
                </div>
                <p className="text-amber-500 text-sm font-medium">{paciente.procedimento}</p>
                <p className="text-gray-400 text-xs mt-1">{paciente.telefone}</p>
                <p className="text-gray-600 text-xs mt-2">
                  {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
