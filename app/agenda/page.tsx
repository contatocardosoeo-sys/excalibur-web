'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Agendamento {
  id: string
  paciente_nome: string
  data: string
  hora: string
  procedimento: string
  status: string
  observacoes: string
  created_at: string
}

const STATUS_COR: Record<string, string> = {
  agendado:    'bg-blue-900 text-blue-300',
  confirmado:  'bg-amber-500 text-gray-950',
  compareceu:  'bg-green-900 text-green-400',
  cancelado:   'bg-red-900 text-red-400',
  'no-show':   'bg-gray-700 text-gray-400',
}

const PROCEDIMENTOS = ['Implante', 'Protocolo', 'Prótese', 'Estética', 'Outro']
const STATUS_LISTA  = ['agendado', 'confirmado', 'compareceu', 'cancelado', 'no-show']

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function semanaAtual(): string[] {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=dom
  const inicio = new Date(hoje)
  inicio.setDate(hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)) // segunda
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function AgendaPage() {
  const [agendamentos, setAgendamentos]   = useState<Agendamento[]>([])
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().toISOString().split('T')[0])
  const [modalAberto, setModalAberto]     = useState(false)
  const [salvando, setSalvando]           = useState(false)
  const [filtroStatus, setFiltroStatus]   = useState('todos')

  const [form, setForm] = useState({
    paciente_nome: '',
    data: new Date().toISOString().split('T')[0],
    hora: '09:00',
    procedimento: 'Implante',
    status: 'agendado',
    observacoes: '',
  })

  async function carregar() {
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
    if (data) setAgendamentos(data)
  }

  useEffect(() => { carregar() }, [])

  async function salvar() {
    if (!form.paciente_nome || !form.data || !form.hora) return
    setSalvando(true)
    await supabase.from('agendamentos').insert([form])
    setForm({
      paciente_nome: '',
      data: new Date().toISOString().split('T')[0],
      hora: '09:00',
      procedimento: 'Implante',
      status: 'agendado',
      observacoes: '',
    })
    setModalAberto(false)
    setSalvando(false)
    carregar()
  }

  async function mudarStatus(id: string, status: string) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    carregar()
  }

  const semana = semanaAtual()
  const hoje   = new Date().toISOString().split('T')[0]

  const doDia = agendamentos.filter(a => a.data === diaSelecionado &&
    (filtroStatus === 'todos' || a.status === filtroStatus)
  )

  const countDia = (data: string) =>
    agendamentos.filter(a => a.data === data).length

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white text-2xl font-bold">Agenda</h2>
            <p className="text-gray-400 mt-1">{agendamentos.length} agendamentos registrados</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition"
          >
            + Novo agendamento
          </button>
        </div>

        {/* Calendário semanal */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Semana atual</h3>
            <span className="text-gray-400 text-sm">
              {formatarData(semana[0])} – {formatarData(semana[6])}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {semana.map((data, i) => {
              const count  = countDia(data)
              const ativo  = data === diaSelecionado
              const ehHoje = data === hoje
              return (
                <button
                  key={data}
                  onClick={() => setDiaSelecionado(data)}
                  className={`flex flex-col items-center p-3 rounded-xl transition ${
                    ativo
                      ? 'bg-amber-500 text-gray-950'
                      : ehHoje
                      ? 'bg-gray-800 border border-amber-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium">{DIAS_SEMANA[i]}</span>
                  <span className="text-lg font-bold mt-1">{data.split('-')[2]}</span>
                  {count > 0 && (
                    <span className={`text-xs mt-1 font-semibold ${ativo ? 'text-gray-950' : 'text-amber-500'}`}>
                      {count} ag.
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filtro status + lista do dia */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">
              {formatarData(diaSelecionado)} — {doDia.length} agendamentos
            </h3>
            <div className="flex gap-2">
              {['todos', ...STATUS_LISTA].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`text-xs px-3 py-1 rounded-full transition font-medium ${
                    filtroStatus === s
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {doDia.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Nenhum agendamento para este dia.
            </div>
          ) : (
            <div className="space-y-3">
              {doDia.map(ag => (
                <div
                  key={ag.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-4"
                >
                  {/* Hora */}
                  <div className="text-amber-500 font-bold text-lg w-16 shrink-0">
                    {ag.hora.slice(0, 5)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{ag.paciente_nome}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{ag.procedimento}</p>
                    {ag.observacoes && (
                      <p className="text-gray-500 text-xs mt-1 truncate">{ag.observacoes}</p>
                    )}
                  </div>

                  {/* Status badge + select */}
                  <div className="shrink-0">
                    <select
                      value={ag.status}
                      onChange={e => mudarStatus(ag.id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_COR[ag.status] ?? 'bg-gray-700 text-gray-300'}`}
                    >
                      {STATUS_LISTA.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo estatístico */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          {STATUS_LISTA.map(s => {
            const count = agendamentos.filter(a => a.status === s).length
            return (
              <div key={s} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">{s.charAt(0).toUpperCase() + s.slice(1)}</p>
                <p className="text-white text-2xl font-bold">{count}</p>
              </div>
            )
          })}
        </div>

      </div>

      {/* Modal novo agendamento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-white font-bold text-lg mb-5">Novo agendamento</h3>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Paciente</label>
                <input
                  type="text"
                  value={form.paciente_nome}
                  onChange={e => setForm({ ...form, paciente_nome: e.target.value })}
                  placeholder="Nome do paciente"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setForm({ ...form, data: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Hora</label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={e => setForm({ ...form, hora: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Procedimento</label>
                <select
                  value={form.procedimento}
                  onChange={e => setForm({ ...form, procedimento: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                >
                  {PROCEDIMENTOS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Status inicial</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                >
                  {STATUS_LISTA.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Observações opcionais..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-2.5 rounded-lg transition"
              >
                {salvando ? 'Salvando...' : 'Salvar agendamento'}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 py-2.5 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
