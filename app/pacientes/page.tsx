'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type StatusPaciente = 'ativo' | 'inativo' | 'arquivado'

interface Paciente {
  id: string
  lead_id: string | null
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  procedimento: string | null
  status: StatusPaciente
  observacoes: string | null
  valor_total: number | null
  tags: string[] | null
  created_at: string
}

const PROCEDIMENTOS = ['Implante', 'Protocolo', 'Prótese', 'Estética', 'Outro']
const STATUS_LABELS: Record<StatusPaciente, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  arquivado: 'Arquivado',
}
const STATUS_CORES: Record<StatusPaciente, string> = {
  ativo: 'bg-green-900/40 text-green-400 border border-green-700/50',
  inativo: 'bg-gray-800 text-gray-400 border border-gray-700',
  arquivado: 'bg-red-900/40 text-red-400 border border-red-700/50',
}

function formatPhone(p: string | null): string {
  if (!p) return '—'
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}
function formatCPF(c: string | null): string {
  if (!c) return '—'
  const d = c.replace(/\D/g, '')
  if (d.length !== 11) return c
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}
function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase()
}

const vazio: Partial<Paciente> = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  data_nascimento: '',
  procedimento: 'Implante',
  status: 'ativo',
  observacoes: '',
  tags: [],
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusPaciente | 'todos'>('todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Partial<Paciente>>(vazio)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setErro(
        error.code === '42P01'
          ? 'Tabela "pacientes" ainda não existe. Rode supabase/migrations/001_pacientes.sql no dashboard.'
          : error.message
      )
      setPacientes([])
    } else {
      setPacientes((data ?? []) as Paciente[])
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirNovo() {
    setEditando({ ...vazio })
    setModalAberto(true)
  }
  function abrirEdit(p: Paciente) {
    setEditando({ ...p })
    setModalAberto(true)
  }

  async function salvar() {
    if (!editando.nome?.trim()) return
    setSalvando(true)
    const payload = {
      nome: editando.nome.trim(),
      cpf: editando.cpf?.trim() || null,
      telefone: editando.telefone?.trim() || null,
      email: editando.email?.trim() || null,
      data_nascimento: editando.data_nascimento || null,
      procedimento: editando.procedimento || null,
      status: (editando.status || 'ativo') as StatusPaciente,
      observacoes: editando.observacoes?.trim() || null,
    }
    const { error } = editando.id
      ? await supabase.from('pacientes').update(payload).eq('id', editando.id)
      : await supabase.from('pacientes').insert(payload)
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setModalAberto(false)
    carregar()
  }

  async function arquivar(p: Paciente) {
    if (!confirm(`Arquivar ${p.nome}?`)) return
    await supabase.from('pacientes').update({ status: 'arquivado' }).eq('id', p.id)
    carregar()
  }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return pacientes.filter((p) => {
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
      if (!q) return true
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.cpf || '').toLowerCase().includes(q) ||
        (p.telefone || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      )
    })
  }, [pacientes, busca, filtroStatus])

  const kpis = useMemo(() => {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const inicioSemana = new Date(agora)
    inicioSemana.setDate(agora.getDate() - 7)
    return {
      total: pacientes.length,
      ativos: pacientes.filter((p) => p.status === 'ativo').length,
      inativos: pacientes.filter((p) => p.status === 'inativo').length,
      novosMes: pacientes.filter((p) => new Date(p.created_at) >= inicioMes).length,
      novosSemana: pacientes.filter((p) => new Date(p.created_at) >= inicioSemana).length,
    }
  }, [pacientes])

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              🦷 Pacientes
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Gerencie sua base de pacientes e fidelização
            </p>
          </div>
          <button
            onClick={abrirNovo}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            + Novo Paciente
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <KpiCard label="Total" valor={kpis.total} sub="pacientes na base" accent="amber" />
          <KpiCard
            label="Ativos"
            valor={kpis.ativos}
            sub={`${kpis.total ? Math.round((kpis.ativos / kpis.total) * 100) : 0}% da base`}
            accent="green"
          />
          <KpiCard label="Inativos" valor={kpis.inativos} sub="sem interação" accent="gray" />
          <KpiCard label="Novos" valor={kpis.novosMes} sub="este mês" accent="amber" />
          <KpiCard label="Semana" valor={kpis.novosSemana} sub="últimos 7 dias" accent="amber" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF, telefone ou e-mail…"
            className="flex-1 min-w-[280px] bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
          />
          <div className="flex gap-2">
            {(['todos', 'ativo', 'inativo', 'arquivado'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  filtroStatus === s
                    ? 'bg-amber-500 text-gray-950'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            ⚠️ {erro}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {busca || filtroStatus !== 'todos'
              ? 'Nenhum paciente encontrado com esses filtros.'
              : 'Nenhum paciente cadastrado ainda. Clique em "+ Novo Paciente".'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtrados.map((p) => (
              <div
                key={p.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-amber-600/50 transition group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {initials(p.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{p.nome}</p>
                    <p className="text-gray-500 text-xs">{formatCPF(p.cpf)}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_CORES[p.status]}`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {p.procedimento && (
                    <p className="text-amber-400 font-medium">{p.procedimento}</p>
                  )}
                  <p className="text-gray-400">📞 {formatPhone(p.telefone)}</p>
                  {p.email && <p className="text-gray-500 truncate">✉ {p.email}</p>}
                  <p className="text-gray-600">Desde {formatDate(p.created_at)}</p>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => abrirEdit(p)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded transition"
                  >
                    Editar
                  </button>
                  {p.status !== 'arquivado' && (
                    <button
                      onClick={() => arquivar(p)}
                      className="bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 text-xs px-3 py-1.5 rounded transition"
                    >
                      Arquivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModalAberto(false)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-4">
              {editando.id ? '✏️ Editar Paciente' : '+ Novo Paciente'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo
                label="Nome completo *"
                value={editando.nome || ''}
                onChange={(v) => setEditando({ ...editando, nome: v })}
                placeholder="Maria Silva"
              />
              <Campo
                label="CPF"
                value={editando.cpf || ''}
                onChange={(v) => setEditando({ ...editando, cpf: v })}
                placeholder="000.000.000-00"
              />
              <Campo
                label="Telefone"
                value={editando.telefone || ''}
                onChange={(v) => setEditando({ ...editando, telefone: v })}
                placeholder="(48) 99999-9999"
              />
              <Campo
                label="E-mail"
                value={editando.email || ''}
                onChange={(v) => setEditando({ ...editando, email: v })}
                placeholder="maria@email.com"
                type="email"
              />
              <Campo
                label="Data de nascimento"
                value={editando.data_nascimento || ''}
                onChange={(v) => setEditando({ ...editando, data_nascimento: v })}
                type="date"
              />
              <CampoSelect
                label="Procedimento"
                value={editando.procedimento || 'Implante'}
                onChange={(v) => setEditando({ ...editando, procedimento: v })}
                options={PROCEDIMENTOS}
              />
              <CampoSelect
                label="Status"
                value={editando.status || 'ativo'}
                onChange={(v) => setEditando({ ...editando, status: v as StatusPaciente })}
                options={['ativo', 'inativo', 'arquivado']}
                formatOption={(o) => STATUS_LABELS[o as StatusPaciente]}
              />
            </div>

            <div className="mt-4">
              <label className="text-gray-400 text-xs mb-1.5 block font-medium">
                Observações
              </label>
              <textarea
                value={editando.observacoes || ''}
                onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
                placeholder="Alergias, histórico, preferências…"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvar}
                disabled={salvando || !editando.nome?.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
              >
                {salvando ? 'Salvando…' : editando.id ? 'Salvar alterações' : 'Cadastrar paciente'}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg transition text-sm"
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

/* ---------- Subcomponentes ---------- */

function KpiCard({
  label,
  valor,
  sub,
  accent,
}: {
  label: string
  valor: number
  sub: string
  accent: 'amber' | 'green' | 'gray'
}) {
  const corMap = {
    amber: 'text-amber-400',
    green: 'text-green-400',
    gray: 'text-gray-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${corMap[accent]}`}>{valor}</p>
      <p className="text-gray-600 text-[10px] mt-1">{sub}</p>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="text-gray-400 text-xs mb-1.5 block font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition"
      />
    </div>
  )
}

function CampoSelect({
  label,
  value,
  onChange,
  options,
  formatOption,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  formatOption?: (o: string) => string
}) {
  return (
    <div>
      <label className="text-gray-400 text-xs mb-1.5 block font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {formatOption ? formatOption(o) : o}
          </option>
        ))}
      </select>
    </div>
  )
}
